import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Filter } from '../src/typen/ansicht.ts';
import type { Klimakennzahlen } from '../src/typen/klima.ts';
import type { SeeMessung } from '../src/typen/messung.ts';
import type { See } from '../src/typen/see.ts';
import { waehleSeen, zuAnsicht } from '../src/utils/seen.ts';

const attersee: See = {
  id: 'attersee', name: 'Attersee', bundeslaender: ['Oberösterreich'],
  flaecheKm2: 46.2, maxTiefeM: 169, seehoeheM: 469, lat: 47.87, lng: 13.54,
  stationen: [
    { quelle: 'Hydrographischer Dienst OÖ', nummer: '5290', messstelle: 'Kammer' },
    { quelle: 'Hydrographischer Dienst OÖ', nummer: '5210', messstelle: 'Unterach' },
    { quelle: 'Hydris Salzburg', nummer: '205328', messstelle: 'Unterach (Seepegel)' },
  ],
};
const fuschlsee: See = {
  id: 'fuschlsee', name: 'Fuschlsee', bundeslaender: ['Salzburg'],
  flaecheKm2: 2.65, maxTiefeM: 67.3, seehoeheM: 663, lat: 47.8, lng: 13.28,
  stationen: [{ quelle: 'Hydris Salzburg', nummer: '203653', messstelle: 'Fuschl am See (Seepegel)' }],
};
const almsee: See = {
  id: 'almsee', name: 'Almsee', bundeslaender: ['Oberösterreich'],
  flaecheKm2: 0.85, maxTiefeM: 9, seehoeheM: 589, lat: 47.75, lng: 13.96,
  stationen: [{ quelle: 'Hydrographischer Dienst OÖ', nummer: '6120', messstelle: 'Almsee' }],
};
const seen = [attersee, fuschlsee, almsee];

const zeitpunkt = '2026-10-28T10:00:00+01:00';
const messungen: SeeMessung[] = [
  { seeId: 'attersee', quelle: 'Hydrographischer Dienst OÖ', messstelle: 'Kammer', wassertemperatur: 14, zeitpunkt },
  { seeId: 'attersee', quelle: 'Hydris Salzburg', messstelle: 'Unterach (Seepegel)', wassertemperatur: 13, zeitpunkt },
  { seeId: 'fuschlsee', quelle: 'Hydris Salzburg', messstelle: 'Fuschl am See (Seepegel)', wassertemperatur: 12.6, zeitpunkt },
];

function kennzahlen(seeId: string, winter: string, laengsteKaelteserie: number): Klimakennzahlen {
  return { seeId, winter, frosttage: 0, eistage: 0, laengsteKaelteserie, kaeltesumme: 0, hitzetage: 0 };
}

const baden: Filter = {
  bundesland: 'alle', tiefe: 'alle', sortierung: 'temperatur',
  aktivitaet: 'baden', mindestTemperatur: null, mindestKaeltetage: null,
};
const eissport: Filter = { ...baden, aktivitaet: 'eissport', sortierung: 'kaelteserie' };

const namen = (filter: Filter, klima: Klimakennzahlen[] = []): string[] =>
  waehleSeen(seen, messungen, klima, filter).seen.map((see) => see.id);

test('zuAnsicht zeigt alle Stationen, fehlende Messung mit null', () => {
  const ansicht = zuAnsicht(attersee, messungen);
  assert.deepEqual(ansicht.messstellen, [
    { name: 'Kammer', quelle: 'Hydrographischer Dienst OÖ', temperatur: 14, zeitpunkt },
    { name: 'Unterach', quelle: 'Hydrographischer Dienst OÖ', temperatur: null, zeitpunkt: null },
    { name: 'Unterach (Seepegel)', quelle: 'Hydris Salzburg', temperatur: 13, zeitpunkt },
  ]);
  assert.equal(ansicht.temperatur, 13.5); // nur vorhandene Werte
  assert.equal(ansicht.laengsteKaelteserie, null);
});

test('gleicher Messstellenname wird über die Quelle unterschieden (Mondsee)', () => {
  const mondsee: See = {
    ...almsee, id: 'mondsee', name: 'Mondsee',
    stationen: [
      { quelle: 'Hydrographischer Dienst OÖ', nummer: '5020', messstelle: 'Limnologisches Institut' },
      { quelle: 'Hydris Salzburg', nummer: '205286', messstelle: 'Limnologisches Institut' },
    ],
  };
  const nurSalzburg: SeeMessung[] = [
    { seeId: 'mondsee', quelle: 'Hydris Salzburg', messstelle: 'Limnologisches Institut', wassertemperatur: 15, zeitpunkt },
  ];
  assert.deepEqual(zuAnsicht(mondsee, nurSalzburg).messstellen.map((m) => m.temperatur), [null, 15]);
});

test('ohne Messungen bleibt der See sichtbar, Temperatur null', () => {
  const ansicht = zuAnsicht(almsee, messungen);
  assert.equal(ansicht.temperatur, null);
  assert.equal(ansicht.badeEinschaetzung, null);
  assert.deepEqual(ansicht.messstellen.map((m) => m.temperatur), [null]);
});

test('Baden: Sortierung nach Temperatur, See ohne Wert am Ende, Mindestwert lässt ihn sichtbar', () => {
  assert.deepEqual(namen(baden), ['attersee', 'fuschlsee', 'almsee']);
  assert.deepEqual(namen({ ...baden, mindestTemperatur: 13 }), ['attersee', 'almsee']);
});

test('Eissport: Kälteserie aus dem jüngsten Winter, Filter und Sortierung', () => {
  const klima = [
    kennzahlen('attersee', '2024/25', 30),
    kennzahlen('attersee', '2025/26', 5),
    kennzahlen('almsee', '2025/26', 21),
  ];
  const auswahl = waehleSeen(seen, messungen, klima, eissport);
  assert.deepEqual(auswahl.seen.map((see) => [see.id, see.laengsteKaelteserie]), [
    ['almsee', 21],
    ['attersee', 5],
    ['fuschlsee', null],
  ]);
  assert.deepEqual(namen({ ...eissport, mindestKaeltetage: 14 }, klima), ['almsee', 'fuschlsee']);
});

test('Eissport filtert nicht nach Wassertemperatur', () => {
  assert.deepEqual(namen({ ...eissport, mindestTemperatur: 30 }), ['attersee', 'fuschlsee', 'almsee']);
});

test('Statistik und Gesamtanzahl beziehen sich auf die Auswahl', () => {
  const auswahl = waehleSeen(seen, messungen, [], { ...baden, bundesland: 'Salzburg' });
  assert.equal(auswahl.gesamtanzahl, 3);
  assert.equal(auswahl.statistik.anzahl, 1);
  assert.equal(auswahl.statistik.waermsterSee?.id, 'fuschlsee');
});
