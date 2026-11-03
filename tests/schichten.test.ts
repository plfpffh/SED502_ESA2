import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Drei-Schichten-Modell aus ESA 1 (README, Abschnitt Architektur): prüft die Importe aller Dateien in src/
const SRC = join(import.meta.dirname, '..', 'src');

function importeIn(ordner: string): { datei: string; ziel: string }[] {
  return readdirSync(join(SRC, ordner)).flatMap((datei) => {
    const text = readFileSync(join(SRC, ordner, datei), 'utf8');
    return [...text.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((treffer) => ({ datei: `${ordner}/${datei}`, ziel: treffer[1] }));
  });
}

function verstoesse(ordner: string[], verboten: RegExp): string[] {
  return ordner.flatMap(importeIn).filter(({ ziel }) => verboten.test(ziel)).map(({ datei, ziel }) => `${datei} → ${ziel}`);
}

test('Darstellung (seiten, komponenten) greift nicht auf die Datenschicht zu', () => {
  assert.deepEqual(verstoesse(['seiten', 'komponenten'], /\/(daten|datenquellen)\//), []);
});

test('Logik (utils) ist reines TypeScript: kein React, keine Hooks, keine Komponenten, keine Datenschicht', () => {
  assert.deepEqual(verstoesse(['utils'], /^react|\/(hooks|komponenten|seiten|context|daten|datenquellen)\//), []);
});

test('Datenschicht (daten, datenquellen) kennt weder Darstellung noch Hooks', () => {
  assert.deepEqual(verstoesse(['daten', 'datenquellen'], /^react|\/(hooks|komponenten|seiten|context)\//), []);
});
