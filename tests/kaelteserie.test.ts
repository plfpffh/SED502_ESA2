import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { begrenzt, ladeAktuelleKaelteserien, ladePrognosen } from '../src/datenquellen/openMeteo.ts';
import { berechneAktuelleKaelteserie, gesternInWien } from '../src/utils/klima.ts';
import type { KlimaTag } from '../src/utils/klima.ts';

/** Tage ab von mit den gegebenen Tagesmitteln. */
function tage(von: string, mittel: (number | null)[]): KlimaTag[] {
  const datum = new Date(`${von}T00:00:00Z`);
  return mittel.map((wert) => {
    const tag = { datum: datum.toISOString().slice(0, 10), minimum: null, maximum: null, mittel: wert };
    datum.setUTCDate(datum.getUTCDate() + 1);
    return tag;
  });
}

test('gestern in Österreich, auch kurz nach Mitternacht und über den Jahreswechsel', () => {
  assert.equal(gesternInWien(new Date('2026-11-03T12:00:00Z')), '2026-11-02');
  // 23:30 UTC ist in Wien schon der 4. November
  assert.equal(gesternInWien(new Date('2026-11-03T23:30:00Z')), '2026-11-03');
  assert.equal(gesternInWien(new Date('2027-01-01T10:00:00Z')), '2026-12-31');
});

test('Kälteserie zählt rückwärts ab gestern bis zum ersten Tag mit Tagesmittel ab 0 °C', () => {
  const daten = tage('2027-01-01', [-3, 1, -2, -4, -1, -0.5]); // bis 2027-01-06
  assert.equal(berechneAktuelleKaelteserie(daten, '2027-01-06'), 4);
  assert.equal(berechneAktuelleKaelteserie(daten, '2027-01-02'), 0); // 1 °C: keine Serie
  assert.equal(berechneAktuelleKaelteserie(tage('2027-01-01', [0]), '2027-01-01'), 0); // 0 °C zählt nicht
});

test('Kälteserie: fehlender Wert für gestern ergibt null, eine Lücke davor beendet die Zählung', () => {
  assert.equal(berechneAktuelleKaelteserie(tage('2027-01-01', [-2, -2, null]), '2027-01-03'), null);
  assert.equal(berechneAktuelleKaelteserie(tage('2027-01-01', [-2, null, -2, -2]), '2027-01-04'), 2);
  assert.equal(berechneAktuelleKaelteserie([], '2027-01-04'), null);
});

test('lädt für jeden See die letzten 92 Tage aus der Forecast-API und wertet bis gestern aus', async (t) => {
  const zeiten = tage('2027-01-01', Array(15).fill(-1)).map((tag) => tag.datum); // bis 2027-01-15 (heute)
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json({
    daily: { time: zeiten, temperature_2m_mean: [...Array(14).fill(-1), 2] }, // heute (2 °C) zählt nicht
  }));
  const ergebnis = await ladeAktuelleKaelteserien(seen.slice(0, 2), undefined, true, new Date('2027-01-15T12:00:00+01:00'));

  assert.equal(abruf.mock.callCount(), 2);
  const url = new URL(String(abruf.mock.calls[0].arguments[0]));
  assert.equal(url.origin + url.pathname, 'https://api.open-meteo.com/v1/forecast');
  assert.equal(url.searchParams.get('daily'), 'temperature_2m_mean');
  assert.equal(url.searchParams.get('past_days'), '92');
  assert.equal(url.searchParams.get('timezone'), 'Europe/Vienna');
  assert.deepEqual(ergebnis.kaelteserien, [
    { seeId: seen[0].id, tage: 14, bis: '2027-01-14' },
    { seeId: seen[1].id, tage: 14, bis: '2027-01-14' },
  ]);
  assert.equal(ergebnis.fehler, null);
});

test('fällt ein See aus, bleiben die übrigen; bei 429 kommt der Hinweis auf das Anfragelimit', async (t) => {
  let aufruf = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    aufruf++;
    return aufruf === 1
      ? new Response('', { status: 429 })
      : Response.json({ daily: { time: ['2027-01-14'], temperature_2m_mean: [-1] } });
  });
  const ergebnis = await ladeAktuelleKaelteserien(seen.slice(0, 2), undefined, true, new Date('2027-01-15T12:00:00+01:00'));
  assert.deepEqual(ergebnis.kaelteserien.map((k) => k.seeId), [seen[1].id]);
  assert.match(ergebnis.fehler ?? '', /Anfragelimit.*aktuelle Kälteserie nicht verfügbar.*/);
  assert.ok(ergebnis.fehler?.includes(seen[0].name));
});

test('ein bereits abgebrochener Vorgang startet keine Anfragen', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json({}));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(ladeAktuelleKaelteserien(seen, controller.signal), { name: 'AbortError' });
  assert.equal(abruf.mock.callCount(), 0);
});

test('höchstens 4 Open-Meteo-Anfragen gleichzeitig, auch wenn Prognose und Kälteserien zusammen laden', async (t) => {
  let gleichzeitig = 0;
  let maximum = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    gleichzeitig++;
    maximum = Math.max(maximum, gleichzeitig);
    await new Promise((fertig) => setTimeout(fertig, 5));
    gleichzeitig--;
    return Response.json({ daily: { time: [], temperature_2m_mean: [], temperature_2m_min: [], temperature_2m_max: [] } });
  });
  await Promise.all([ladePrognosen(seen, undefined, true), ladeAktuelleKaelteserien(seen)]);
  assert.equal(maximum, 4);
});

test('begrenzt gibt Ergebnis und Fehler unverändert weiter und gibt den Platz danach frei', async () => {
  assert.equal(await begrenzt(async () => 42), 42);
  await assert.rejects(begrenzt(async () => { throw new Error('kaputt'); }), /kaputt/);
  const ergebnisse = await Promise.all(Array.from({ length: 10 }, (_, i) => begrenzt(async () => i)));
  assert.deepEqual(ergebnisse, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('Kälteserien kommen beim zweiten Aufruf aus dem Zwischenspeicher, neuLaden fragt erneut an', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ daily: { time: ['2027-02-09'], temperature_2m_mean: [-1] } }));
  const heute = new Date('2027-02-10T12:00:00+01:00');
  const erst = await ladeAktuelleKaelteserien(seen.slice(2, 3), undefined, true, heute);
  const wieder = await ladeAktuelleKaelteserien(seen.slice(2, 3), undefined, false, heute);
  assert.deepEqual(wieder, erst);
  assert.equal(abruf.mock.callCount(), 1);
  await ladeAktuelleKaelteserien(seen.slice(2, 3), undefined, true, heute);
  assert.equal(abruf.mock.callCount(), 2);
});

test('gestern in Wien auch rund um die Zeitumstellung und am Monatsanfang', () => {
  assert.equal(gesternInWien(new Date('2026-03-29T12:00:00Z')), '2026-03-28');
  assert.equal(gesternInWien(new Date('2026-03-01T00:30:00+01:00')), '2026-02-28');
});
