import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { test } from 'node:test';
import hydroOoe, { filtereSeenStationen } from '../api/hydro-ooe.ts';

const kammer = {
  station_no: '5290', station_name: 'Kammer', stationparameter_no: 'WT',
  ts_value: 15.2, timestamp: '2026-10-11T16:00:00.000+02:00',
};

function antwortAufzeichnen() {
  const headers = new Map<string, string>();
  let body = '';
  const response = {
    statusCode: 200,
    setHeader(name: string, value: string) { headers.set(name, value); },
    end(inhalt: string) { body = inhalt; },
  } as unknown as ServerResponse;
  return { response, headers, daten: (): unknown => JSON.parse(body) };
}

test('liefert nur geplante Seenstationen und nur die benötigten Quellfelder', () => {
  const ergebnis = filtereSeenStationen([
    { ...kammer, interneDaten: 'nicht benötigt' },
    { ...kammer, station_no: '4320', station_name: 'Ischl' },
  ]);
  assert.deepEqual(ergebnis, [{
    station_no: '5290', station_name: 'Kammer', ts_value: 15.2,
    timestamp: '2026-10-11T16:00:00.000+02:00',
  }]);
});

test('erlaubt fehlende Stationen und bewahrt null sowie eine echte Temperatur von 0 °C', () => {
  assert.deepEqual(filtereSeenStationen([]), []);
  const ergebnis = filtereSeenStationen([
    { ...kammer, ts_value: null, timestamp: null },
    { ...kammer, station_no: '4310', station_name: 'Strobl', ts_value: 0 },
  ]);
  assert.equal(ergebnis[0].ts_value, null);
  assert.equal(ergebnis[1].ts_value, 0);
});

test('weist geänderte Strukturen, falsche Messgrößen und ungültige Messwerte zurück', () => {
  for (const roh of [
    { daten: [kammer] }, [null], [{}],
    [{ ...kammer, stationparameter_no: 'W' }],
    [{ ...kammer, ts_value: '15.2' }], [{ ...kammer, ts_value: Infinity }],
    [{ ...kammer, timestamp: 'ungültig' }], [{ ...kammer, timestamp: null }],
  ]) {
    assert.throws(() => filtereSeenStationen(roh));
  }
});

test('GET ruft die feste Quelle ab und liefert JSON mit kurzem Cache', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json([kammer]));
  const antwort = antwortAufzeichnen();
  await hydroOoe({ method: 'GET' } as IncomingMessage, antwort.response);
  assert.equal(antwort.response.statusCode, 200);
  assert.equal(antwort.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assert.match(antwort.headers.get('Cache-Control') ?? '', /s-maxage=60/);
  assert.deepEqual(antwort.daten(), filtereSeenStationen([kammer]));
  assert.equal(abruf.mock.calls[0].arguments[0], 'https://hydro.ooe.gv.at/daten/internet/layers/5/index.json');
  const optionen = abruf.mock.calls[0].arguments[1] as RequestInit;
  assert.ok(optionen.signal instanceof AbortSignal);
});

test('POST wird abgewiesen, ohne die Quelle aufzurufen', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json([]));
  const antwort = antwortAufzeichnen();
  await hydroOoe({ method: 'POST' } as IncomingMessage, antwort.response);
  assert.equal(antwort.response.statusCode, 405);
  assert.equal(antwort.headers.get('Allow'), 'GET');
  assert.equal(abruf.mock.callCount(), 0);
});

test('HTTP-, Netzwerk-, JSON- und Formatfehler liefern 502 ohne technischen Fehlertext', async (t) => {
  for (const abruf of [
    async () => new Response('interner Fehlertext', { status: 503 }),
    async () => { throw new Error('ECONNRESET'); },
    async () => new Response('kein JSON'),
    async () => Response.json({ unerwartet: true }),
  ]) {
    const mock = t.mock.method(globalThis, 'fetch', abruf);
    const antwort = antwortAufzeichnen();
    await hydroOoe({ method: 'GET' } as IncomingMessage, antwort.response);
    assert.equal(antwort.response.statusCode, 502);
    assert.equal(antwort.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(antwort.daten(), {
      fehler: 'Die Messwerte aus Oberösterreich sind gerade nicht verfügbar. Bitte später erneut versuchen.',
    });
    mock.mock.restore();
  }
});

test('Timeout liefert eine verständliche Meldung mit Status 504', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('intern', 'TimeoutError'); });
  const antwort = antwortAufzeichnen();
  await hydroOoe({ method: 'GET' } as IncomingMessage, antwort.response);
  assert.equal(antwort.response.statusCode, 504);
  assert.equal(antwort.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(antwort.daten(), {
    fehler: 'Der Abruf der Messwerte aus Oberösterreich dauert zu lange. Bitte später erneut versuchen.',
  });
});
