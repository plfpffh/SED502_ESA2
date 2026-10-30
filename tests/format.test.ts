import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  NICHT_VORHANDEN,
  formatiereKaelteserie,
  formatiereTemperatur,
  formatiereZahl,
  formatiereZeitpunkt,
} from '../src/utils/format.ts';

test('Zahlen und Temperaturen mit Dezimalkomma', () => {
  assert.equal(formatiereZahl(46.2), '46,2');
  assert.equal(formatiereTemperatur(12.5), '12,5 °C');
});

test('fehlende Werte werden nie als 0 angezeigt', () => {
  assert.equal(formatiereTemperatur(null), NICHT_VORHANDEN);
  assert.equal(formatiereKaelteserie(null), NICHT_VORHANDEN);
  assert.equal(formatiereTemperatur(0), '0 °C');
  assert.equal(formatiereKaelteserie(0), '0 Tage am Stück unter 0 °C');
});

test('Kälteserie in Einzahl und Mehrzahl', () => {
  assert.equal(formatiereKaelteserie(1), '1 Tag am Stück unter 0 °C');
  assert.equal(formatiereKaelteserie(14), '14 Tage am Stück unter 0 °C');
});

test('Zeitpunkt in Wiener Zeit', () => {
  // 21:00 UTC am 28.10.2026 ist 22:00 in Wien (Winterzeit)
  assert.match(formatiereZeitpunkt('2026-10-28T21:00:00.000Z'), /28\.10\.2026.*22:00/);
});
