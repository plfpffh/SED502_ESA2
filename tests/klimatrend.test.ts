import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import { ladeKlimatrend } from '../src/datenquellen/openMeteo.ts';
import { berechneKlimatrend } from '../src/utils/klima.ts';
import type { KlimaTag } from '../src/utils/klima.ts';
import { HttpFehler } from '../src/utils/fetchJSON.ts';

const HEUTE = new Date('1953-10-31T12:00:00+01:00');

/** Drei vollständige Winter, darunter das Schaltjahr 1952. */
function tageswerte(): KlimaTag[] {
  const tage: KlimaTag[] = [];
  const datum = new Date('1950-06-01T00:00:00Z');
  while (datum < new Date('1953-03-01T00:00:00Z')) {
    tage.push({ datum: datum.toISOString().slice(0, 10), minimum: -2, maximum: 0, mittel: -1 });
    datum.setUTCDate(datum.getUTCDate() + 1);
  }
  return tage;
}

function apiAntwort(tage = tageswerte()) {
  return { daily: {
    time: tage.map((tag) => tag.datum),
    temperature_2m_min: tage.map((tag) => tag.minimum),
    temperature_2m_max: tage.map((tag) => tag.maximum),
    temperature_2m_mean: tage.map((tag) => tag.mittel),
  } };
}

test('Klimatrend: vollständige Winter sind chronologisch, ohne Vermischung ihrer Kennzahlen', () => {
  const tage = tageswerte();
  const letzterWintertag = tage.find((tag) => tag.datum === '1953-02-28');
  assert.ok(letzterWintertag);
  letzterWintertag.mittel = 0;
  const vorher = structuredClone(tage);
  const ergebnis = berechneKlimatrend('attersee', 1950, 1952, tage);
  assert.deepEqual(ergebnis.map((wert) => wert.winter), ['1950/51', '1951/52', '1952/53']);
  assert.deepEqual(ergebnis.map((wert) => wert.frosttage), [90, 91, 90]);
  assert.deepEqual(ergebnis.map((wert) => wert.laengsteKaelteserie), [90, 91, 89]);
  assert.deepEqual(ergebnis.map((wert) => wert.kaeltesumme), [-90, -91, -89]);
  assert.ok(ergebnis.every((wert) => wert.seeId === 'attersee'));
  assert.deepEqual(tage, vorher);
});

test('Klimatrend: eine Datenlücke entfernt nur den betroffenen Winter, spätere Winter bleiben erhalten', () => {
  const tage = tageswerte().filter((tag) => tag.datum !== '1952-02-29');
  const ergebnis = berechneKlimatrend('attersee', 1950, 1952, tage);
  assert.deepEqual(ergebnis.map((wert) => wert.winter), ['1950/51', '1952/53']);
  assert.deepEqual(berechneKlimatrend('attersee', 1950, 1952, []), []);
});

test('Klimatrend: lädt die gesamte Historie in einer Anfrage und reicht das Abbruchsignal weiter', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(apiAntwort()));
  const signal = new AbortController().signal;
  const ergebnis = await ladeKlimatrend(seen[0], signal, HEUTE);
  assert.equal(abruf.mock.callCount(), 1);
  const [adresse, optionen] = abruf.mock.calls[0].arguments;
  const url = new URL(String(adresse));
  assert.equal(url.searchParams.get('latitude'), String(seen[0].lat));
  assert.equal(url.searchParams.get('longitude'), String(seen[0].lng));
  assert.equal(url.searchParams.get('start_date'), '1950-06-01');
  assert.equal(url.searchParams.get('end_date'), '1953-02-28');
  assert.equal(optionen?.signal, signal);
  assert.equal(ergebnis.kennzahlen.length, 3);
  assert.equal(ergebnis.fehler, null);
});

test('Klimatrend: vor dem 1. März endet die Historie beim Winter des Vorjahres', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(apiAntwort()));
  const ergebnis = await ladeKlimatrend(seen[0], undefined, new Date('1953-02-28T23:59:59+01:00'));
  const url = new URL(String(abruf.mock.calls[0].arguments[0]));
  assert.equal(url.searchParams.get('end_date'), '1952-02-29');
  assert.deepEqual(ergebnis.kennzahlen.map((wert) => wert.winter), ['1950/51', '1951/52']);
});

test('Klimatrend: unvollständige Winter erzeugen einen Hinweis, gültige Kennzahlen bleiben bestehen', async (t) => {
  const tage = tageswerte().filter((tag) => tag.datum !== '1951-06-01');
  t.mock.method(globalThis, 'fetch', async () => Response.json(apiAntwort(tage)));
  const ergebnis = await ladeKlimatrend(seen[0], undefined, HEUTE);
  assert.deepEqual(ergebnis.kennzahlen.map((wert) => wert.winter), ['1950/51', '1952/53']);
  assert.match(ergebnis.fehler ?? '', /1 Winter.*nicht vollständig/);
});

test('Klimatrend: eine leere Antwort wird als fehlende Historie und nicht als fehlerfreier Trend behandelt', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json(apiAntwort([])));
  const ergebnis = await ladeKlimatrend(seen[0], undefined, HEUTE);
  assert.deepEqual(ergebnis.kennzahlen, []);
  assert.match(ergebnis.fehler ?? '', /3 Winter.*nicht vollständig/);
});

test('Klimatrend: HTTP-, Netzwerk- und Formatfehler werden weitergegeben', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }));
  await assert.rejects(ladeKlimatrend(seen[0], undefined, HEUTE), (fehler: unknown) => {
    assert.ok(fehler instanceof HttpFehler);
    assert.equal(fehler.status, 429);
    return true;
  });
  abruf.mock.restore();

  const netzwerk = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(ladeKlimatrend(seen[0], undefined, HEUTE), { name: 'TypeError' });
  netzwerk.mock.restore();

  t.mock.method(globalThis, 'fetch', async () => Response.json({ daily: null }));
  await assert.rejects(ladeKlimatrend(seen[0], undefined, HEUTE), /unerwartetes Format/);
});

test('Klimatrend: erneutes Laden kann nach einem Fehler wieder Daten liefern', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  await assert.rejects(ladeKlimatrend(seen[0], undefined, HEUTE));
  abruf.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => Response.json(apiAntwort()));
  const ergebnis = await ladeKlimatrend(seen[0], undefined, HEUTE);
  assert.equal(ergebnis.kennzahlen.length, 3);
  assert.equal(ergebnis.fehler, null);
});

test('Klimatrend: Abbruch verhindert den Abruf oder verwirft bereits geladene Daten', async (t) => {
  const controller = new AbortController();
  controller.abort();
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(apiAntwort()));
  await assert.rejects(ladeKlimatrend(seen[0], controller.signal, HEUTE), { name: 'AbortError' });
  assert.equal(abruf.mock.callCount(), 0);
  abruf.mock.restore();

  const spaeterAbbruch = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => {
    spaeterAbbruch.abort();
    return Response.json(apiAntwort());
  });
  await assert.rejects(ladeKlimatrend(seen[0], spaeterAbbruch.signal, HEUTE), { name: 'AbortError' });
});
