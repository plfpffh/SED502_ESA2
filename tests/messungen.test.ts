import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { zuSeeMessungenSalzburg } from '../src/datenquellen/hydrisSalzburg.ts';
import { uebersetzeQuelle } from '../src/utils/messungen.ts';

const fuschl = { number: '203653', v: 12.1, dt: 1793221200000 };

test('noch nicht geladen: keine Messungen, kein Fehler', () => {
  assert.deepEqual(uebersetzeQuelle(null, null, zuSeeMessungenSalzburg, seen), { messungen: [], fehler: null });
});

test('geladene Daten werden mit dem Adapter übersetzt', () => {
  const ergebnis = uebersetzeQuelle([fuschl], null, zuSeeMessungenSalzburg, seen);
  assert.equal(ergebnis.fehler, null);
  assert.deepEqual(ergebnis.messungen.map((m) => m.seeId), ['fuschlsee']);
});

test('Ladefehler wird für diese Quelle gemeldet, ohne Messungen', () => {
  const ergebnis = uebersetzeQuelle([fuschl], 'Die Messwerte aus Salzburg sind gerade nicht verfügbar.', zuSeeMessungenSalzburg, seen);
  assert.deepEqual(ergebnis, { messungen: [], fehler: 'Die Messwerte aus Salzburg sind gerade nicht verfügbar.' });
});

test('Formatfehler des Adapters wird abgefangen und als Fehler der Quelle gemeldet', () => {
  const ergebnis = uebersetzeQuelle({ unerwartet: true }, null, zuSeeMessungenSalzburg, seen);
  assert.deepEqual(ergebnis, { messungen: [], fehler: 'Die Messwerte aus Salzburg haben ein unerwartetes Format.' });
});
