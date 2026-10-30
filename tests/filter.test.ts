import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STANDARD_FILTER, wechsleAktivitaet } from '../src/utils/filter.ts';

test('Standard: Baden, alle Seen, sortiert nach Temperatur', () => {
  assert.equal(STANDARD_FILTER.aktivitaet, 'baden');
  assert.equal(STANDARD_FILTER.sortierung, 'temperatur');
  assert.equal(STANDARD_FILTER.mindestTemperatur, null);
  assert.equal(STANDARD_FILTER.mindestKaeltetage, null);
});

test('Eissport: Sortierung Temperatur wird zur Kälteserie, und zurück', () => {
  const eissport = wechsleAktivitaet(STANDARD_FILTER, 'eissport');
  assert.equal(eissport.aktivitaet, 'eissport');
  assert.equal(eissport.sortierung, 'kaelteserie');

  const baden = wechsleAktivitaet(eissport, 'baden');
  assert.equal(baden.sortierung, 'temperatur');
});

test('andere Sortierungen und Filter bleiben beim Wechsel erhalten', () => {
  const filter = { ...STANDARD_FILTER, sortierung: 'name' as const, bundesland: 'Salzburg' as const, mindestTemperatur: 18 };
  const eissport = wechsleAktivitaet(filter, 'eissport');
  assert.equal(eissport.sortierung, 'name');
  assert.equal(eissport.bundesland, 'Salzburg');
  assert.equal(eissport.mindestTemperatur, 18);
});

test('ändert das übergebene Filterobjekt nicht', () => {
  wechsleAktivitaet(STANDARD_FILTER, 'eissport');
  assert.equal(STANDARD_FILTER.aktivitaet, 'baden');
});
