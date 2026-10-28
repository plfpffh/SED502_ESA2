import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { test } from 'node:test';
import hydrisSalzburg, { filtereSeenStationen, STATIONSNUMMERN } from '../api/hydris-salzburg.ts';
import { seen } from '../src/daten/seen.ts';

// Ausschnitt eines echten Eintrags aus data.json (28.10.2026)
const fuschl = {
  altitude: 663.0, latlng: [47.797, 13.299], name: 'Fuschl am See (Seepegel)', number: '203653',
  plots: { '_Seen.WT': 'Fuschl am See (Seepegel)' },
  values: { WT: { Cmd: { v: 12.6, unit: '°C', dt: 1.793196e12, classification: '10–15°C' } } },
  WTO_OBJECT: 'Fuschlsee',
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

test('Stationsliste des Proxys passt zu den Hydris-Stationen in den Stammdaten', () => {
  const ausStammdaten = seen
    .flatMap((see) => see.stationen)
    .filter((station) => station.quelle === 'Hydris Salzburg')
    .map((station) => station.nummer);
  assert.deepEqual([...STATIONSNUMMERN].sort(), ausStammdaten.sort());
});

test('liefert nur geplante Seenstationen und nur Nummer, Wert und Zeitpunkt', () => {
  const ergebnis = filtereSeenStationen([
    fuschl,
    { ...fuschl, number: '126029', name: 'Annaberg_NLV', values: { LT: { Cmd: { v: 12.1, dt: 1.793196e12 } } } },
    'kein Objekt',
    { name: 'ohne Nummer' },
  ]);
  assert.deepEqual(ergebnis, [{ number: '203653', v: 12.6, dt: 1793196000000 }]);
});

test('erlaubt fehlende Stationen und bewahrt eine echte Temperatur von 0 °C', () => {
  assert.deepEqual(filtereSeenStationen([]), []);
  const [ergebnis] = filtereSeenStationen([{ ...fuschl, values: { WT: { Cmd: { v: 0, dt: 1.793196e12 } } } }]);
  assert.equal(ergebnis.v, 0);
});

test('eine Station mit unbrauchbarem Wert bekommt null, die übrigen bleiben erhalten', () => {
  const kaputt = [
    { values: {} },
    { values: { WT: { Cmd: { v: 'zwölf', dt: 1.793196e12 } } } },
    { values: { WT: { Cmd: { v: Number.NaN, dt: 1.793196e12 } } } },
    { values: { WT: { Cmd: { v: 12.6 } } } }, // Wert ohne Zeitpunkt
  ];
  for (const teil of kaputt) {
    const ergebnis = filtereSeenStationen([{ ...fuschl, ...teil }, { ...fuschl, number: '203604' }]);
    assert.deepEqual(ergebnis, [
      { number: '203653', v: null, dt: null },
      { number: '203604', v: 12.6, dt: 1793196000000 },
    ]);
  }
});

test('weist eine Antwort ohne Stationsarray zurück', () => {
  for (const roh of [null, {}, 'text', { stationen: [] }]) {
    assert.throws(() => filtereSeenStationen(roh), /kein Stationsarray/);
  }
});

test('GET ruft die feste Quelle ab und liefert JSON mit kurzem Cache', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json([fuschl]));
  const antwort = antwortAufzeichnen();
  await hydrisSalzburg({ method: 'GET' } as IncomingMessage, antwort.response);
  assert.equal(abruf.mock.calls[0].arguments[0], 'https://www.salzburg.gv.at/wasser/hydro/grafiken/data.json');
  assert.equal(antwort.response.statusCode, 200);
  assert.equal(antwort.headers.get('Cache-Control'), 'public, max-age=0, s-maxage=60');
  assert.deepEqual(antwort.daten(), [{ number: '203653', v: 12.6, dt: 1793196000000 }]);
});

test('POST wird abgewiesen, ohne die Quelle aufzurufen', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json([]));
  const antwort = antwortAufzeichnen();
  await hydrisSalzburg({ method: 'POST' } as IncomingMessage, antwort.response);
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
    await hydrisSalzburg({ method: 'GET' } as IncomingMessage, antwort.response);
    assert.equal(antwort.response.statusCode, 502);
    assert.equal(antwort.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(antwort.daten(), {
      fehler: 'Die Messwerte aus Salzburg sind gerade nicht verfügbar. Bitte später erneut versuchen.',
    });
    mock.mock.restore();
  }
});

test('Timeout liefert eine verständliche Meldung mit Status 504', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('intern', 'TimeoutError'); });
  const antwort = antwortAufzeichnen();
  await hydrisSalzburg({ method: 'GET' } as IncomingMessage, antwort.response);
  assert.equal(antwort.response.statusCode, 504);
  assert.equal(antwort.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(antwort.daten(), {
    fehler: 'Der Abruf der Messwerte aus Salzburg dauert zu lange. Bitte später erneut versuchen.',
  });
});
