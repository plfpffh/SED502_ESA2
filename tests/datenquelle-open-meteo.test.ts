import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { ladeKlimatage, zuKlimaTagen } from '../src/datenquellen/openMeteo.ts';
import { berechneKlimakennzahlen } from '../src/utils/klima.ts';
import { HttpFehler } from '../src/utils/fetchJSON.ts';

function antwort() {
  return {
    daily: {
      time: ['2025-12-31', '2026-01-01'],
      temperature_2m_min: [-3, 0],
      temperature_2m_max: [1, 4],
      temperature_2m_mean: [-1, 2],
    },
  };
}

test('Open-Meteo: ordnet die parallelen Arrays tageweise zu und erhält 0 °C', () => {
  assert.deepEqual(zuKlimaTagen(antwort()), [
    { datum: '2025-12-31', minimum: -3, maximum: 1, mittel: -1 },
    { datum: '2026-01-01', minimum: 0, maximum: 4, mittel: 2 },
  ]);
});

test('Open-Meteo: fehlende und ungültige Temperaturen werden null, nicht 0', () => {
  const roh = {
    daily: {
      time: ['2026-01-01', '2026-01-02'],
      temperature_2m_min: [null, Number.NaN],
      temperature_2m_max: ['4', Infinity],
      temperature_2m_mean: [false, undefined],
    },
  };
  assert.deepEqual(zuKlimaTagen(roh), [
    { datum: '2026-01-01', minimum: null, maximum: null, mittel: null },
    { datum: '2026-01-02', minimum: null, maximum: null, mittel: null },
  ]);
});

test('Open-Meteo: unerwartete Antworten und unterschiedlich lange Arrays sind Formatfehler', () => {
  for (const roh of [
    null, [], {}, { error: true, reason: 'Fehler' }, { daily: null },
    { daily: { ...antwort().daily, temperature_2m_mean: undefined } },
    { daily: { ...antwort().daily, temperature_2m_min: [-3] } },
    { daily: { ...antwort().daily, temperature_2m_max: [1] } },
    { daily: { ...antwort().daily, temperature_2m_mean: [-1] } },
  ]) {
    assert.throws(() => zuKlimaTagen(roh), /Open-Meteo.*unerwartetes Format/);
  }
});

test('Open-Meteo: ungültige Kalendertage und doppelte Datumswerte sind Formatfehler', () => {
  for (const time of [
    ['2025-12-31', '2026-02-30'],
    ['2025-12-31', '2026-13-01'],
    ['2025-12-31', '01.01.2026'],
    ['2025-12-31', null],
    ['2025-12-31', '2025-12-31'],
  ]) {
    assert.throws(() => zuKlimaTagen({ daily: { ...antwort().daily, time } }), /unerwartetes Format/);
  }
});

test('Open-Meteo: leere Arrays und Lücken werden nicht mit erfundenen Tageswerten aufgefüllt', () => {
  assert.deepEqual(zuKlimaTagen({ daily: {
    time: [], temperature_2m_min: [], temperature_2m_max: [], temperature_2m_mean: [],
  } }), []);
  const tage = zuKlimaTagen({ daily: { ...antwort().daily, time: ['2025-12-31', '2026-01-02'] } });
  assert.equal(tage.length, 2);
  assert.equal(berechneKlimakennzahlen('attersee', 2025, tage), null);
});

test('Open-Meteo: lädt ERA5 in °C für Koordinaten, Seehöhe und Zeitraum und reicht das Abbruchsignal weiter', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(antwort()));
  const see = seen[0];
  const signal = new AbortController().signal;

  const tage = await ladeKlimatage(see, '2025-12-31', '2026-01-01', signal);
  assert.deepEqual(tage, zuKlimaTagen(antwort()));
  const [adresse, optionen] = abruf.mock.calls[0].arguments;
  const url = new URL(String(adresse));
  assert.equal(url.origin + url.pathname, 'https://archive-api.open-meteo.com/v1/archive');
  assert.equal(url.searchParams.get('latitude'), String(see.lat));
  assert.equal(url.searchParams.get('longitude'), String(see.lng));
  assert.equal(url.searchParams.get('elevation'), String(see.seehoeheM));
  assert.equal(url.searchParams.get('start_date'), '2025-12-31');
  assert.equal(url.searchParams.get('end_date'), '2026-01-01');
  assert.equal(url.searchParams.get('daily'), 'temperature_2m_min,temperature_2m_max,temperature_2m_mean');
  assert.equal(url.searchParams.get('timezone'), 'Europe/Vienna');
  assert.equal(url.searchParams.get('temperature_unit'), 'celsius');
  assert.equal(url.searchParams.get('models'), 'era5');
  assert.equal(url.searchParams.has('apikey'), false);
  assert.equal(optionen?.signal, signal);
});

test('Open-Meteo: ungültige Zeiträume lösen keine API-Anfrage aus', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(antwort()));
  for (const [von, bis] of [
    ['2026-01-02', '2026-01-01'],
    ['2026-02-30', '2026-03-01'],
    ['2026-01-01', 'ungültig'],
  ]) {
    await assert.rejects(ladeKlimatage(seen[0], von, bis), /Zeitraum.*ungültig/);
  }
  assert.equal(abruf.mock.callCount(), 0);
});

test('Open-Meteo: HTTP-Fehler, Netzwerkfehler und Abbrüche werden weitergegeben', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: true, reason: 'Rate limit' }, { status: 429 }),
  );
  await assert.rejects(ladeKlimatage(seen[0], '2025-12-31', '2026-01-01'), (fehler: unknown) => {
    assert.ok(fehler instanceof HttpFehler);
    assert.equal(fehler.status, 429);
    return true;
  });
  abruf.mock.restore();

  for (const fehler of [new TypeError('Failed to fetch'), new DOMException('Abgebrochen', 'AbortError')]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => { throw fehler; });
    await assert.rejects(ladeKlimatage(seen[0], '2025-12-31', '2026-01-01'), (ergebnis) => ergebnis === fehler);
    mock.mock.restore();
  }
});

test('Open-Meteo: vollständige API-Tagesdaten lassen sich direkt zu Klimakennzahlen berechnen', () => {
  const time: string[] = [];
  for (const datum = new Date('2025-06-01T00:00:00Z'); datum < new Date('2026-03-01T00:00:00Z'); datum.setUTCDate(datum.getUTCDate() + 1)) {
    time.push(datum.toISOString().slice(0, 10));
  }
  const minimum = time.map(() => 1);
  const maximum = time.map(() => 20);
  const mittel = time.map(() => 10);
  maximum[time.indexOf('2025-06-01')] = 30;
  for (const datum of ['2025-12-31', '2026-01-01']) {
    const index = time.indexOf(datum);
    minimum[index] = -3;
    maximum[index] = -1;
    mittel[index] = -2;
  }
  const tage = zuKlimaTagen({ daily: {
    time, temperature_2m_min: minimum, temperature_2m_max: maximum, temperature_2m_mean: mittel,
  } });
  assert.deepEqual(berechneKlimakennzahlen('attersee', 2025, tage), {
    seeId: 'attersee', winter: '2025/26', frosttage: 2, eistage: 2,
    laengsteKaelteserie: 2, kaeltesumme: -4, hitzetage: 1,
  });
});
