import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { zuAnsicht } from '../src/utils/seen.ts';
import { baueSeeEinschaetzung } from '../src/utils/seeEinschaetzung.ts';
import { KI_REGELN } from '../src/utils/kiRegeln.ts';
import type { Klimakennzahlen } from '../src/typen/klima.ts';

const HEUTE = new Date('2026-11-01T12:00:00+01:00');
const see = zuAnsicht(seen[0], [{
  seeId: seen[0].id, messstelle: 'Kammer', quelle: 'Hydrographischer Dienst OÖ',
  wassertemperatur: 0, zeitpunkt: '2026-11-01T10:00:00Z',
}]);

function kennzahl(winter: string, seeId = seen[0].id): Klimakennzahlen {
  return { seeId, winter, frosttage: 50, eistage: 10, laengsteKaelteserie: 14, kaeltesumme: -30, hitzetage: 12 };
}

function seedaten(prompt: string) {
  return JSON.parse(prompt.split('\nSeedaten:\n')[1]);
}

test('See-Einschätzung: erhält echte 0 °C und übermittelt fehlende Einzelwerte ausdrücklich als fehlend', () => {
  const daten = seedaten(baueSeeEinschaetzung(see, [kennzahl('2025/26')], null, HEUTE));
  assert.equal(daten.wassertemperatur.mittelwertVerfuegbarerMessstellen, 0);
  assert.equal(daten.wassertemperatur.messstellen.length, 3);
  assert.equal(daten.wassertemperatur.messstellen[0].temperatur, 0);
  // 10:00 UTC ist 11:00 in Wien (Winterzeit), wie auf der Detailseite
  assert.equal(daten.wassertemperatur.messstellen[0].messzeitpunkt, '01.11.2026, 11:00 (Wiener Zeit)');
  assert.equal(daten.wassertemperatur.messstellen[1].temperatur, null);
  assert.equal(daten.wassertemperatur.messstellen[1].messzeitpunkt, null);
  assert.match(daten.wassertemperatur.messstellen[1].status, /Kein Messwert.*nicht schätzen/);
});

test('See-Einschätzung: historische Kennzahlen sind dem richtigen See und abgeschlossenen Winter zugeordnet', () => {
  const daten = seedaten(baueSeeEinschaetzung(see, [
    kennzahl('2026/27'), kennzahl('2024/25'), kennzahl('2025/26', 'traunsee'), kennzahl('2025/26'),
  ], null, HEUTE));
  assert.equal(daten.klima.letzterAbgeschlossenerWinter, '2025/26');
  assert.equal(daten.klima.kennzahlenLetzterWinter.seeId, seen[0].id);
  assert.deepEqual(daten.klima.frosttageProWinter.map((wert: { winter: string }) => wert.winter), ['2024/25', '2025/26']);
  assert.match(daten.klima.quelle, /Lufttemperatur/);
});

test('See-Einschätzung: ersetzt einen fehlenden letzten Winter nicht durch ein älteres Jahr', () => {
  const daten = seedaten(baueSeeEinschaetzung(see, [kennzahl('2024/25')], 'Ein Winter fehlt.', HEUTE));
  assert.equal(daten.klima.letzterAbgeschlossenerWinter, '2025/26');
  assert.equal(daten.klima.kennzahlenLetzterWinter, null);
  assert.equal(daten.klima.status, 'Teilweise verfügbar');
  assert.equal(daten.klima.hinweis, 'Ein Winter fehlt.');
});

test('See-Einschätzung: ohne Messwerte und Klimadaten werden keine Zahlen erfunden', () => {
  const daten = seedaten(baueSeeEinschaetzung(zuAnsicht(seen[0], []), [], 'Nicht erreichbar.', HEUTE));
  assert.equal(daten.wassertemperatur.status, 'Keine Messwerte verfügbar');
  assert.equal(daten.wassertemperatur.mittelwertVerfuegbarerMessstellen, null);
  assert.equal(daten.klima.status, 'Keine Klimakennzahlen verfügbar');
  assert.equal(daten.klima.kennzahlenLetzterWinter, null);
  assert.deepEqual(daten.klima.frosttageProWinter, []);
});

test('See-Einschätzung: verändert die übergebenen Kennzahlen und die Seeansicht nicht', () => {
  const klima = [kennzahl('2025/26'), kennzahl('2024/25')];
  const vorher = structuredClone({ see, klima });
  baueSeeEinschaetzung(see, klima, null, HEUTE);
  assert.deepEqual({ see, klima }, vorher);
});

test('See-Einschätzung: vollständige Historie bleibt mit Systemregeln innerhalb des Proxy-Zeichenlimits', () => {
  const klima = Array.from({ length: 76 }, (_, index) => {
    const jahr = 1950 + index;
    return kennzahl(`${jahr}/${String(jahr + 1).slice(-2)}`);
  });
  const prompt = baueSeeEinschaetzung(see, klima, null, HEUTE);
  assert.equal(seedaten(prompt).klima.frosttageProWinter.length, 76);
  assert.ok(prompt.length + KI_REGELN.length < 20000);
  assert.match(prompt, /keine heutigen Eisbedingungen/);
  assert.match(prompt, /Wetterprognosen, Eisdicke und offizielle Freigaben liegen hier nicht vor/);
});
