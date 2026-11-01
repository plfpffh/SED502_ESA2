import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { zuSeeMessungenOoe } from '../src/datenquellen/hydroOoe.ts';
import { uebersetzeQuelle } from '../src/utils/messungen.ts';
import { waehleSeen } from '../src/utils/seen.ts';

const timestamp = '2026-10-29T10:15:00.000+01:00';
const kammer = { station_no: '5290', station_name: 'Name der Quelle', ts_value: 14.5, timestamp };

test('OÖ: ordnet Stationsnummern zu und verwendet die Namen aus den Stammdaten', () => {
  const ergebnis = zuSeeMessungenOoe([kammer, { ...kammer, station_no: '4310', ts_value: 12.3 }], seen);
  assert.deepEqual(ergebnis, [
    { seeId: 'attersee', messstelle: 'Kammer', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 14.5, zeitpunkt: '2026-10-29T09:15:00.000Z' },
    { seeId: 'wolfgangsee', messstelle: 'Strobl', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 12.3, zeitpunkt: '2026-10-29T09:15:00.000Z' },
  ]);
});

test('OÖ: unterscheidet gleichnamige Messstellen am Mondsee über die Quelle', () => {
  const [messung] = zuSeeMessungenOoe([{ ...kammer, station_no: '5020' }], seen);
  assert.equal(messung.seeId, 'mondsee');
  assert.equal(messung.messstelle, 'Limnologisches Institut');
  assert.equal(messung.quelle, 'Hydrographischer Dienst OÖ');
});

test('OÖ: lässt fehlende und ungültige Messungen aus, eine echte 0 °C bleibt erhalten', () => {
  const ergebnis = zuSeeMessungenOoe([
    null, 'kein Objekt', [], {},
    { ...kammer, ts_value: null },
    { ...kammer, ts_value: Number.NaN },
    { ...kammer, ts_value: Infinity },
    { ...kammer, ts_value: '14.5' },
    { ...kammer, timestamp: null },
    { ...kammer, timestamp: 'ungültig' },
    { ...kammer, timestamp: '2026-10-29T10:15:00' }, // ohne Zeitzone
    { ...kammer, timestamp: '2026-10-29T10:15:00+99:99' },
    { ...kammer, station_no: 5290 },
    { ...kammer, station_no: '4320' }, // Ischl, nicht Wolfgangsee
    { ...kammer, station_no: '1230', ts_value: 0, timestamp: '2026-10-29T09:15:00Z' },
  ], seen);
  assert.deepEqual(ergebnis, [
    { seeId: 'holzoestersee', messstelle: 'Holzöster', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 0, zeitpunkt: '2026-10-29T09:15:00.000Z' },
  ]);
});

test('OÖ: ignoriert eine Stationsnummer, die nur zu einer anderen Quelle gehört', () => {
  const nurSalzburg = [{
    ...seen[0],
    stationen: [{ quelle: 'Hydris Salzburg' as const, nummer: '5290', messstelle: 'Andere Station' }],
  }];
  assert.deepEqual(zuSeeMessungenOoe([kammer], nurSalzburg), []);
});

test('OÖ: leeres Array ist erlaubt, Antworten ohne Array ergeben einen Formatfehler', () => {
  assert.deepEqual(zuSeeMessungenOoe([], seen), []);
  for (const roh of [null, undefined, {}, 'text', { fehler: 'nicht verfügbar' }]) {
    assert.throws(() => zuSeeMessungenOoe(roh, seen), /Oberösterreich.*unerwartetes Format/);
  }
});

test('OÖ: alle zehn Stationen gelangen über die gemeinsame Verarbeitung in die Seenansichten', () => {
  const stationen = seen.flatMap((see) => see.stationen).filter((s) => s.quelle === 'Hydrographischer Dienst OÖ');
  const roh = stationen.map((s) => ({ ...kammer, station_no: s.nummer }));
  const ergebnis = uebersetzeQuelle(roh, null, zuSeeMessungenOoe, seen);
  assert.equal(ergebnis.fehler, null);
  assert.equal(ergebnis.messungen.length, 10);

  const auswahl = waehleSeen(seen, ergebnis.messungen, [], {
    bundesland: 'alle', tiefe: 'alle', sortierung: 'temperatur',
    aktivitaet: 'baden', mindestTemperatur: null, mindestKaeltetage: null,
  });
  assert.equal(auswahl.seen.length, 14);
  assert.equal(auswahl.seen.filter((see) => see.temperatur !== null).length, 8);
  assert.equal(auswahl.seen.find((see) => see.id === 'attersee')?.temperatur, 14.5);
  assert.equal(auswahl.seen.find((see) => see.id === 'fuschlsee')?.temperatur, null);
});
