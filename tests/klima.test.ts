import assert from 'node:assert/strict';
import { test } from 'node:test';
import { berechneKlimakennzahlen } from '../src/utils/klima.ts';
import type { KlimaTag } from '../src/utils/klima.ts';

/** Vollständiges Kalenderjahr und Folgewinter, zunächst ohne Frost oder Hitze. */
function tageswerte(startjahr = 2025): KlimaTag[] {
  const tage: KlimaTag[] = [];
  const datum = new Date(Date.UTC(startjahr, 0, 1));
  const ende = new Date(Date.UTC(startjahr + 1, 2, 1));
  while (datum < ende) {
    tage.push({ datum: datum.toISOString().slice(0, 10), minimum: 1, maximum: 20, mittel: 10 });
    datum.setUTCDate(datum.getUTCDate() + 1);
  }
  return tage;
}

function aendereTag(tage: KlimaTag[], datum: string, werte: Partial<Omit<KlimaTag, 'datum'>>): void {
  const tag = tage.find((tag) => tag.datum === datum);
  assert.ok(tag, `Testdatum ${datum} fehlt`);
  Object.assign(tag, werte);
}

test('Klima: berechnet Kennzahlen mit den vereinbarten Temperaturgrenzen', () => {
  const tage = tageswerte();
  aendereTag(tage, '2025-12-01', { minimum: -2, maximum: 0, mittel: -0.5 });
  aendereTag(tage, '2025-12-02', { minimum: -4, maximum: -1, mittel: -2.5 });
  aendereTag(tage, '2025-12-03', { minimum: -1, maximum: 1, mittel: 0 });
  aendereTag(tage, '2025-12-04', { minimum: 0, maximum: 2, mittel: 1 });
  aendereTag(tage, '2025-06-01', { maximum: 30 });
  aendereTag(tage, '2025-07-15', { maximum: 35 });
  aendereTag(tage, '2025-08-31', { maximum: 29.9 });

  assert.deepEqual(berechneKlimakennzahlen('attersee', 2025, tage), {
    seeId: 'attersee', winter: '2025/26', frosttage: 3, eistage: 1,
    laengsteKaelteserie: 2, kaeltesumme: -3, hitzetage: 2,
  });
});

test('Klima: vollständige Daten ohne Frost oder Hitze ergeben echte Nullwerte', () => {
  assert.deepEqual(berechneKlimakennzahlen('attersee', 2025, tageswerte()), {
    seeId: 'attersee', winter: '2025/26', frosttage: 0, eistage: 0,
    laengsteKaelteserie: 0, kaeltesumme: 0, hitzetage: 0,
  });
});

test('Klima: Kälteserie läuft über den Jahreswechsel und wird bei 0 °C unterbrochen', () => {
  const tage = tageswerte();
  for (const datum of ['2025-12-30', '2025-12-31', '2026-01-01']) {
    aendereTag(tage, datum, { minimum: -4, maximum: 0, mittel: -2 });
  }
  aendereTag(tage, '2026-01-02', { minimum: -1, maximum: 1, mittel: 0 });
  aendereTag(tage, '2026-01-03', { minimum: -4, maximum: 0, mittel: -2 });
  // Der letzte Wintertag muss ebenfalls in die längste Serie einfließen.
  for (const datum of ['2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28']) {
    aendereTag(tage, datum, { minimum: -3, maximum: -1, mittel: -2 });
  }
  const ergebnis = berechneKlimakennzahlen('attersee', 2025, tage);
  assert.equal(ergebnis?.laengsteKaelteserie, 4);
  assert.equal(ergebnis?.kaeltesumme, -16);
});

test('Klima: wertet unsortierte Daten aus und ignoriert Tage außerhalb der Jahreszeiten', () => {
  const tage = tageswerte();
  aendereTag(tage, '2025-01-01', { minimum: -10, maximum: -5, mittel: -7 });
  aendereTag(tage, '2025-05-31', { maximum: 35 });
  aendereTag(tage, '2025-09-01', { maximum: 35 });
  aendereTag(tage, '2025-11-30', { minimum: -10, maximum: -5, mittel: -7 });
  tage.reverse();
  const vorher = structuredClone(tage);

  const ergebnis = berechneKlimakennzahlen('attersee', 2025, tage);
  assert.equal(ergebnis?.frosttage, 0);
  assert.equal(ergebnis?.hitzetage, 0);
  assert.deepEqual(tage, vorher);
});

test('Klima: berücksichtigt den Schalttag und verlangt vollständige Zeiträume', () => {
  const tage = tageswerte(2023);
  aendereTag(tage, '2024-02-29', { minimum: -3, maximum: -1, mittel: -2 });
  assert.equal(berechneKlimakennzahlen('attersee', 2023, tage)?.eistage, 1);

  for (const fehlendesDatum of ['2023-06-01', '2023-08-31', '2023-12-01', '2024-02-29']) {
    assert.equal(berechneKlimakennzahlen('attersee', 2023,
      tage.filter((tag) => tag.datum !== fehlendesDatum)), null);
  }
  assert.equal(berechneKlimakennzahlen('attersee', 2023, []), null);
});

test('Klima: fehlende oder nicht endliche benötigte Temperaturen ergeben keine Kennzahlen', () => {
  for (const feld of ['minimum', 'maximum', 'mittel'] as const) {
    for (const wert of [null, Number.NaN, Infinity]) {
      const tage = tageswerte();
      aendereTag(tage, '2026-01-15', { [feld]: wert });
      assert.equal(berechneKlimakennzahlen('attersee', 2025, tage), null);
    }
  }
  for (const wert of [null, Number.NaN, Infinity]) {
    const tage = tageswerte();
    aendereTag(tage, '2025-07-15', { maximum: wert });
    assert.equal(berechneKlimakennzahlen('attersee', 2025, tage), null);
  }
});

test('Klima: im Sommer genügt das Maximum, fehlendes Minimum und Mittel sind erlaubt', () => {
  const tage = tageswerte();
  aendereTag(tage, '2025-07-15', { minimum: null, mittel: null, maximum: 30 });
  assert.equal(berechneKlimakennzahlen('attersee', 2025, tage)?.hitzetage, 1);
});
