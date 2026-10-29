import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { zuSeeMessungenSalzburg } from '../src/datenquellen/hydrisSalzburg.ts';

// Format wie es /api/hydris-salzburg liefert (Ausschnitt vom 28.10.2026)
const dt = 1793221200000;
const fuschl = { number: '203653', v: 12.1, dt };

test('ordnet Stationen über die Nummer dem See zu, Messstelle kommt aus den Stammdaten', () => {
  assert.deepEqual(zuSeeMessungenSalzburg([fuschl, { number: '205328', v: 13.8, dt }], seen), [
    { seeId: 'fuschlsee', messstelle: 'Fuschl am See (Seepegel)', quelle: 'Hydris Salzburg', wassertemperatur: 12.1, zeitpunkt: '2026-10-28T21:00:00.000Z' },
    { seeId: 'attersee', messstelle: 'Unterach (Seepegel)', quelle: 'Hydris Salzburg', wassertemperatur: 13.8, zeitpunkt: '2026-10-28T21:00:00.000Z' },
  ]);
});

test('Mondsee: Salzburger Station gehört zur Quelle Hydris, nicht zur gleichnamigen OÖ-Station', () => {
  const [messung] = zuSeeMessungenSalzburg([{ number: '205286', v: 13.2, dt }], seen);
  assert.equal(messung.seeId, 'mondsee');
  assert.equal(messung.quelle, 'Hydris Salzburg');
  assert.equal(messung.messstelle, 'Limnologisches Institut');
});

test('Stationen ohne gültigen Wert werden ausgelassen, 0 °C bleibt erhalten', () => {
  const ergebnis = zuSeeMessungenSalzburg(
    [
      { number: '203653', v: null, dt: null }, // vom Proxy als ungültig markiert
      { number: '203604', v: 13.5, dt: null },
      { number: '203612', v: Number.NaN, dt },
      { number: '203588', v: '12', dt },
      { number: '999999', v: 12, dt }, // nicht in den Stammdaten
      { number: 203117, v: 12, dt }, // Nummer als Zahl statt Text
      null,
      'kein Objekt',
      { number: '204131', v: 0, dt },
    ],
    seen,
  );
  assert.deepEqual(ergebnis.map((m) => [m.seeId, m.wassertemperatur]), [['grabensee', 0]]);
});

test('ignoriert OÖ-Stationen mit gleicher Nummer in den Stammdaten', () => {
  const nurOoe = [{ ...seen[1], stationen: [{ quelle: 'Hydrographischer Dienst OÖ' as const, nummer: '203653', messstelle: 'X' }] }];
  assert.deepEqual(zuSeeMessungenSalzburg([fuschl], nurOoe), []);
});

test('leere Antwort ergibt keine Messungen, eine Antwort ohne Array ist ein Formatfehler', () => {
  assert.deepEqual(zuSeeMessungenSalzburg([], seen), []);
  for (const roh of [null, undefined, {}, 'text', { fehler: 'x' }]) {
    assert.throws(() => zuSeeMessungenSalzburg(roh, seen), /unerwartetes Format/);
  }
});

test('jede Hydris-Station der Stammdaten kann zugeordnet werden', () => {
  const nummern = seen.flatMap((see) => see.stationen).filter((s) => s.quelle === 'Hydris Salzburg').map((s) => s.nummer);
  const ergebnis = zuSeeMessungenSalzburg(nummern.map((number) => ({ number, v: 10, dt })), seen);
  assert.equal(ergebnis.length, nummern.length);
});
