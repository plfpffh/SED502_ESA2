import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { ladePrognosen, zuPrognosetagen } from '../src/datenquellen/openMeteo.ts';

const HEUTE = new Date('2026-11-01T12:00:00+01:00');

function antwort(von = '2026-11-01') {
  const datum = new Date(`${von}T00:00:00Z`);
  const time = Array.from({ length: 7 }, () => {
    const tag = datum.toISOString().slice(0, 10);
    datum.setUTCDate(datum.getUTCDate() + 1);
    return tag;
  });
  return { daily: { time, temperature_2m_min: [0, 1, 2, 3, 4, 5, 6], temperature_2m_max: [7, 8, 9, 10, 11, 12, 13] } };
}

test('Prognose: ordnet Minimum und Maximum den Tagen zu und erhält 0 °C', () => {
  const tage = zuPrognosetagen(antwort());
  assert.equal(tage.length, 7);
  assert.deepEqual(tage[0], { datum: '2026-11-01', temperaturMin: 0, temperaturMax: 7 });
  assert.deepEqual(tage.at(-1), { datum: '2026-11-07', temperaturMin: 6, temperaturMax: 13 });
});

test('Prognose: fehlende und ungültige Temperaturen werden null und nicht 0', () => {
  assert.deepEqual(zuPrognosetagen({ daily: {
    time: ['2026-11-01', '2026-11-02', '2026-11-03'],
    temperature_2m_min: [null, '2', Number.NaN], temperature_2m_max: [Infinity, undefined, false],
  } }), [
    { datum: '2026-11-01', temperaturMin: null, temperaturMax: null },
    { datum: '2026-11-02', temperaturMin: null, temperaturMax: null },
    { datum: '2026-11-03', temperaturMin: null, temperaturMax: null },
  ]);
});

test('Prognose: unerwartete Formate, ungleiche Arrays und ungültige oder doppelte Tage werden abgewiesen', () => {
  for (const roh of [
    null, [], {}, { daily: null },
    { daily: { ...antwort().daily, temperature_2m_min: [0] } },
    { daily: { ...antwort().daily, temperature_2m_max: undefined } },
    { daily: { time: ['2026-02-30'], temperature_2m_min: [0], temperature_2m_max: [3] } },
    { daily: { time: ['2026-11-01', '2026-11-01'], temperature_2m_min: [0, 1], temperature_2m_max: [3, 4] } },
  ]) assert.throws(() => zuPrognosetagen(roh), /Wetterprognose.*unerwartetes Format/);
});

test('Prognose: fordert sieben Tage in °C mit Koordinaten, Seehöhe, Wiener Zeitzone und Abbruchsignal an', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(antwort()));
  const signal = new AbortController().signal;
  // In Wien ist bereits der 1. November, obwohl das UTC-Datum noch Oktober zeigt.
  const ergebnis = await ladePrognosen([seen[0]], signal, true, new Date('2026-10-31T23:30:00Z'));
  const [adresse, optionen] = abruf.mock.calls[0].arguments;
  const url = new URL(String(adresse));
  assert.equal(url.origin + url.pathname, 'https://api.open-meteo.com/v1/forecast');
  assert.equal(url.searchParams.get('latitude'), String(seen[0].lat));
  assert.equal(url.searchParams.get('longitude'), String(seen[0].lng));
  assert.equal(url.searchParams.get('elevation'), String(seen[0].seehoeheM));
  assert.equal(url.searchParams.get('forecast_days'), '7');
  assert.equal(url.searchParams.get('daily'), 'temperature_2m_min,temperature_2m_max');
  assert.equal(url.searchParams.get('temperature_unit'), 'celsius');
  assert.equal(url.searchParams.get('timezone'), 'Europe/Vienna');
  assert.equal(url.searchParams.has('apikey'), false);
  assert.equal(optionen?.signal, signal);
  assert.equal(ergebnis.fehler, null);
  assert.equal(ergebnis.prognosen[0].seeId, seen[0].id);
  assert.equal(ergebnis.prognosen[0].tage[0].datum, '2026-11-01');
});

test('Prognose: erfolgreiche Seen und vorhandene Tageswerte bleiben bei Teilausfällen erhalten', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request) => {
    const latitude = new URL(String(url)).searchParams.get('latitude');
    if (latitude === String(seen[0].lat)) return new Response('', { status: 429 });
    const daten = antwort();
    if (latitude === String(seen[1].lat)) {
      daten.daily.time.shift(); daten.daily.temperature_2m_min.shift(); daten.daily.temperature_2m_max.shift();
    }
    return Response.json(daten);
  });
  const ergebnis = await ladePrognosen(seen.slice(0, 3), undefined, true, HEUTE);
  assert.deepEqual(ergebnis.prognosen.map((prognose) => prognose.seeId), [seen[1].id, seen[2].id]);
  assert.equal(ergebnis.prognosen[0].tage.length, 7);
  assert.deepEqual(ergebnis.prognosen[0].tage[0], { datum: '2026-11-01', temperaturMin: null, temperaturMax: null });
  assert.equal(ergebnis.prognosen[0].tage[1].temperaturMin, 1);
  assert.match(ergebnis.fehler ?? '', /Anfragelimit/);
  assert.ok(ergebnis.fehler?.includes(seen[0].name));
  assert.ok(ergebnis.fehler?.includes(seen[1].name));
  assert.ok(!ergebnis.fehler?.includes(seen[2].name));
});

test('Prognose: leere Seenlisten brauchen keinen Abruf, leere Antworten werden als fehlend gemeldet', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json({ daily: {
    time: [], temperature_2m_min: [], temperature_2m_max: [],
  } }));
  assert.deepEqual(await ladePrognosen([], undefined, true, HEUTE), { prognosen: [], fehler: null });
  assert.equal(abruf.mock.callCount(), 0);
  const ergebnis = await ladePrognosen([seen[0]], undefined, true, HEUTE);
  assert.deepEqual(ergebnis.prognosen, []);
  assert.ok(ergebnis.fehler?.includes(seen[0].name));
});

test('Prognose: Netzwerk- und Formatfehler bleiben auf den betroffenen See begrenzt', async (t) => {
  for (const laden of [
    async () => { throw new TypeError('Failed to fetch'); },
    async () => Response.json({ daily: null }),
  ]) {
    const mock = t.mock.method(globalThis, 'fetch', laden);
    const ergebnis = await ladePrognosen([seen[0]], undefined, true, HEUTE);
    assert.deepEqual(ergebnis.prognosen, []);
    assert.ok(ergebnis.fehler?.includes(seen[0].name));
    mock.mock.restore();
  }
});

test('Prognose: der Cache endet nach 30 Minuten, neu laden und ein Tageswechsel erzwingen frische Daten', async (t) => {
  let jetzt = 1000000;
  let datum = '2026-11-01';
  t.mock.method(Date, 'now', () => jetzt);
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(antwort(datum)));
  const erste = await ladePrognosen([seen[0]], undefined, true, HEUTE);
  assert.deepEqual(await ladePrognosen([seen[0]], undefined, false, HEUTE), erste);
  assert.equal(abruf.mock.callCount(), 1);
  jetzt += 30 * 60 * 1000;
  await ladePrognosen([seen[0]], undefined, false, HEUTE);
  assert.equal(abruf.mock.callCount(), 2);
  await ladePrognosen([seen[0]], undefined, true, HEUTE);
  assert.equal(abruf.mock.callCount(), 3);
  datum = '2026-11-02';
  const naechsterTag = await ladePrognosen([seen[0]], undefined, false, new Date('2026-11-02T00:01:00+01:00'));
  assert.equal(abruf.mock.callCount(), 4);
  assert.equal(naechsterTag.prognosen[0].tage[0].datum, datum);
});

test('Prognose: sieben Kalendertage bleiben auch über den Jahreswechsel korrekt', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json(antwort('2026-12-30')));
  const ergebnis = await ladePrognosen([seen[0]], undefined, true, new Date('2026-12-30T12:00:00+01:00'));
  assert.equal(ergebnis.prognosen[0].tage[0].datum, '2026-12-30');
  assert.equal(ergebnis.prognosen[0].tage.at(-1)?.datum, '2027-01-05');
});

test('Prognose: Abbruch erreicht alle Anfragen und ein bereits abgebrochener Vorgang lädt nichts', async (t) => {
  const controller = new AbortController();
  const abruf = t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, optionen?: RequestInit) => {
    assert.equal(optionen?.signal, controller.signal);
    return new Promise<Response>((_resolve, reject) => {
      controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true });
    });
  });
  const laden = ladePrognosen(seen.slice(0, 2), controller.signal, true, HEUTE);
  controller.abort();
  await assert.rejects(laden, { name: 'AbortError' });
  assert.equal(abruf.mock.callCount(), 2);
  await assert.rejects(ladePrognosen(seen.slice(0, 2), controller.signal, true, HEUTE), { name: 'AbortError' });
  assert.equal(abruf.mock.callCount(), 2);
});
