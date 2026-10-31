import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Klimakennzahlen } from '../src/typen/klima.ts';
import { frosttageVerlauf } from '../src/utils/klima.ts';

function kennzahlen(winter: string, frosttage: number): Klimakennzahlen {
  return { seeId: 'attersee', winter, frosttage, eistage: 0, laengsteKaelteserie: 0, kaeltesumme: 0, hitzetage: 0 };
}

test('Diagramm: ergänzt eine Datenlücke mit null und erhält echte 0 Frosttage', () => {
  assert.deepEqual(frosttageVerlauf([kennzahlen('1950/51', 0), kennzahlen('1952/53', 45)], 1950, 1952), [
    { winter: '1950/51', frosttage: 0 },
    { winter: '1951/52', frosttage: null },
    { winter: '1952/53', frosttage: 45 },
  ]);
});

test('Diagramm: ordnet unsortierte Kennzahlen chronologisch und lässt fremde Zeiträume aus', () => {
  const daten = [kennzahlen('1952/53', 45), kennzahlen('1949/50', 70), kennzahlen('1950/51', 60)];
  const vorher = structuredClone(daten);
  assert.deepEqual(frosttageVerlauf(daten, 1950, 1952).map((punkt) => punkt.frosttage), [60, null, 45]);
  assert.deepEqual(daten, vorher);
});

test('Diagramm: auch fehlende Winter am Anfang und Ende bleiben sichtbar', () => {
  assert.deepEqual(frosttageVerlauf([kennzahlen('1951/52', 30)], 1950, 1952), [
    { winter: '1950/51', frosttage: null },
    { winter: '1951/52', frosttage: 30 },
    { winter: '1952/53', frosttage: null },
  ]);
  assert.ok(frosttageVerlauf([], 1950, 1952).every((punkt) => punkt.frosttage === null));
});
