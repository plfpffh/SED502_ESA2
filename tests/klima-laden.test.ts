import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { ladeWinterKennzahlen } from '../src/datenquellen/openMeteo.ts';

function winterAntwort(startjahr = 2025) {
  const time: string[] = [];
  const datum = new Date(Date.UTC(startjahr, 5, 1));
  const ende = new Date(Date.UTC(startjahr + 1, 2, 1));
  while (datum < ende) {
    time.push(datum.toISOString().slice(0, 10));
    datum.setUTCDate(datum.getUTCDate() + 1);
  }
  return { daily: {
    time,
    temperature_2m_min: time.map(() => -2),
    temperature_2m_max: time.map(() => 0),
    temperature_2m_mean: time.map(() => -1),
  } };
}

test('Winter laden: startet beide Seen parallel und ordnet Ergebnisse trotz unterschiedlicher Dauer korrekt zu', async (t) => {
  let freigeben: (antwort: Response) => void = () => {};
  const ersteAntwort = new Promise<Response>((resolve) => { freigeben = resolve; });
  const abruf = t.mock.method(globalThis, 'fetch', async (url: string | URL | Request) => {
    const latitude = new URL(String(url)).searchParams.get('latitude');
    return latitude === String(seen[0].lat) ? ersteAntwort : Response.json(winterAntwort());
  });

  const laden = ladeWinterKennzahlen(seen.slice(0, 2), 2025);
  assert.equal(abruf.mock.callCount(), 2);
  freigeben(Response.json(winterAntwort()));
  const ergebnis = await laden;
  assert.equal(ergebnis.fehler, null);
  assert.deepEqual(ergebnis.kennzahlen.map((wert) => wert.seeId), seen.slice(0, 2).map((see) => see.id));
  assert.ok(ergebnis.kennzahlen.every((wert) => wert.winter === '2025/26' && wert.laengsteKaelteserie === 90));
});

test('Winter laden: Teilausfälle und unvollständige Daten lassen die übrigen Seen bestehen', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request) => {
    const latitude = new URL(String(url)).searchParams.get('latitude');
    if (latitude === String(seen[0].lat)) return new Response('', { status: 503 });
    const daten = winterAntwort();
    if (latitude === String(seen[1].lat)) {
      daten.daily.time.pop();
      daten.daily.temperature_2m_min.pop();
      daten.daily.temperature_2m_max.pop();
      daten.daily.temperature_2m_mean.pop();
    }
    return Response.json(daten);
  });

  const ergebnis = await ladeWinterKennzahlen(seen.slice(0, 3), 2025);
  assert.deepEqual(ergebnis.kennzahlen.map((wert) => wert.seeId), [seen[2].id]);
  assert.ok(ergebnis.fehler?.includes(seen[0].name));
  assert.ok(ergebnis.fehler?.includes(seen[1].name));
  assert.ok(!ergebnis.fehler?.includes(seen[2].name));
});

test('Winter laden: ein erneuter Abruf kann nach einem vollständigen Ausfall wieder Daten liefern', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }));
  const fehler = await ladeWinterKennzahlen(seen.slice(0, 2), 2025);
  assert.deepEqual(fehler.kennzahlen, []);
  assert.ok(fehler.fehler);
  abruf.mock.restore();

  t.mock.method(globalThis, 'fetch', async () => Response.json(winterAntwort()));
  const ergebnis = await ladeWinterKennzahlen(seen.slice(0, 2), 2025);
  assert.equal(ergebnis.kennzahlen.length, 2);
  assert.equal(ergebnis.fehler, null);
});

test('Winter laden: eine leere Seenliste benötigt keine API-Anfragen', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(winterAntwort()));
  assert.deepEqual(await ladeWinterKennzahlen([], 2025), { kennzahlen: [], fehler: null });
  assert.equal(abruf.mock.callCount(), 0);
});

test('Winter laden: fordert nur den Sommer davor und den vollständigen Winter inklusive Schalttag an', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(winterAntwort(2023)));
  const ergebnis = await ladeWinterKennzahlen([seen[0]], 2023);
  const url = new URL(String(abruf.mock.calls[0].arguments[0]));
  assert.equal(url.searchParams.get('start_date'), '2023-06-01');
  assert.equal(url.searchParams.get('end_date'), '2024-02-29');
  assert.equal(ergebnis.kennzahlen[0].winter, '2023/24');
  assert.equal(ergebnis.kennzahlen[0].laengsteKaelteserie, 91);
});

test('Winter laden: ein bereits abgebrochener Vorgang startet keine Anfragen', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(winterAntwort()));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(ladeWinterKennzahlen([seen[0]], 2025, controller.signal), { name: 'AbortError' });
  assert.equal(abruf.mock.callCount(), 0);
});

test('Winter laden: Abbruchsignal erreicht alle laufenden Anfragen und wird nicht als Teilausfall behandelt', async (t) => {
  const controller = new AbortController();
  const abruf = t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, optionen?: RequestInit) => {
    assert.equal(optionen?.signal, controller.signal);
    return new Promise<Response>((_resolve, reject) => {
      controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true });
    });
  });
  const laden = ladeWinterKennzahlen(seen.slice(0, 2), 2025, controller.signal);
  controller.abort();
  await assert.rejects(laden, { name: 'AbortError' });
  assert.equal(abruf.mock.callCount(), 2);
});
