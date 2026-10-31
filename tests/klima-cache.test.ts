import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { seen } from '../src/daten/seen.ts';
import type { Klimakennzahlen } from '../src/typen/klima.ts';
import { klimaCacheSchluessel, liesKlimaCache, speichereKlimaCache } from '../src/utils/klimaCache.ts';
import { ladeKlimatrend, ladeWinterKennzahlen } from '../src/datenquellen/openMeteo.ts';
import { HttpFehler } from '../src/utils/fetchJSON.ts';

function testSpeicher() {
  const eintraege = new Map<string, string>();
  return {
    getItem: (key: string): string | null => eintraege.get(key) ?? null,
    setItem: (key: string, text: string): void => { eintraege.set(key, text); },
  };
}

function browserCache(t: TestContext) {
  const speicher = testSpeicher();
  const vorher = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { localStorage: speicher }, configurable: true });
  t.after(() => {
    if (vorher) Object.defineProperty(globalThis, 'window', vorher);
    else Reflect.deleteProperty(globalThis, 'window');
  });
  return speicher;
}

const KENNZAHL: Klimakennzahlen = {
  seeId: seen[0].id, winter: '1952/53', frosttage: 0, eistage: 0,
  laengsteKaelteserie: 0, kaeltesumme: 0, hitzetage: 0,
};

test('Klima-Cache: erhält echte Nullwerte und wird nach 24 Stunden ungültig', (t) => {
  const speicher = testSpeicher();
  const jetzt = 100000000;
  const uhr = t.mock.method(Date, 'now', () => jetzt);
  speichereKlimaCache('test', [KENNZAHL], speicher);
  assert.deepEqual(liesKlimaCache('test', speicher), [KENNZAHL]);
  uhr.mock.restore();
  t.mock.method(Date, 'now', () => jetzt + 24 * 60 * 60 * 1000);
  assert.equal(liesKlimaCache('test', speicher), null);
});

test('Klima-Cache: beschädigte, unvollständige und zukünftig datierte Einträge werden ignoriert', () => {
  const speicher = testSpeicher();
  for (const text of [
    'kein JSON', 'null', '{}',
    JSON.stringify({ zeitpunkt: Date.now(), kennzahlen: [{}] }),
    JSON.stringify({ zeitpunkt: Date.now(), kennzahlen: [{ ...KENNZAHL, frosttage: null }] }),
    JSON.stringify({ zeitpunkt: Date.now() + 86400000, kennzahlen: [KENNZAHL] }),
  ]) {
    speicher.setItem('test', text);
    assert.equal(liesKlimaCache('test', speicher), null);
  }
});

test('Klima-Cache: fehlender, gesperrter oder voller Speicher verursacht keinen Ladefehler', () => {
  const gesperrt = {
    getItem: (): string | null => { throw new Error('Gesperrt'); },
    setItem: (): void => { throw new Error('Voll'); },
  };
  assert.equal(liesKlimaCache('test', null), null);
  assert.equal(liesKlimaCache('test', gesperrt), null);
  assert.doesNotThrow(() => speichereKlimaCache('test', [KENNZAHL], null));
  assert.doesNotThrow(() => speichereKlimaCache('test', [KENNZAHL], gesperrt));
});

test('Klima-Cache: Seen, Zeiträume und geänderte Koordinaten erhalten unterschiedliche Schlüssel', () => {
  const schluessel = klimaCacheSchluessel(seen[0], 1950, 2025);
  assert.notEqual(schluessel, klimaCacheSchluessel(seen[1], 1950, 2025));
  assert.notEqual(schluessel, klimaCacheSchluessel(seen[0], 2025, 2025));
  assert.notEqual(schluessel, klimaCacheSchluessel({ ...seen[0], lat: seen[0].lat + 0.1 }, 1950, 2025));
  assert.notEqual(schluessel, klimaCacheSchluessel({ ...seen[0], seehoeheM: seen[0].seehoeheM + 1 }, 1950, 2025));
});

function historischeAntwort() {
  const time: string[] = [];
  const datum = new Date('1950-06-01T00:00:00Z');
  while (datum < new Date('1953-03-01T00:00:00Z')) {
    time.push(datum.toISOString().slice(0, 10));
    datum.setUTCDate(datum.getUTCDate() + 1);
  }
  return { daily: {
    time, temperature_2m_min: time.map(() => -2), temperature_2m_max: time.map(() => 0), temperature_2m_mean: time.map(() => -1),
  } };
}

test('Klima-Cache: wiederholter Trendabruf und anschließende Seenliste benötigen keine weiteren API-Aufrufe', async (t) => {
  browserCache(t);
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(historischeAntwort()));
  const heute = new Date('1953-10-31T12:00:00+01:00');
  const erst = await ladeKlimatrend(seen[0], undefined, heute);
  const wiederholt = await ladeKlimatrend(seen[0], undefined, heute);
  assert.deepEqual(wiederholt, erst);
  assert.equal(abruf.mock.callCount(), 1);
  const liste = await ladeWinterKennzahlen([seen[0]], 1952);
  assert.deepEqual(liste.kennzahlen, [erst.kennzahlen.at(-1)]);
  assert.equal(abruf.mock.callCount(), 1);
});

test('Klima-Cache: HTTP 429 bleibt erneut abrufbar und erhält eine verständliche Meldung', async (t) => {
  browserCache(t);
  const abruf = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }));
  for (let versuch = 0; versuch < 2; versuch++) {
    await assert.rejects(ladeKlimatrend(seen[0], undefined, new Date('1953-10-31')), (fehler: unknown) => {
      assert.ok(fehler instanceof HttpFehler);
      assert.equal(fehler.status, 429);
      assert.match(fehler.message, /Open-Meteo.*Anfragelimit/);
      return true;
    });
  }
  assert.equal(abruf.mock.callCount(), 2);
});

test('Klima-Cache: unvollständige Historien werden nicht als erfolgreicher Cache gespeichert', async (t) => {
  browserCache(t);
  const daten = historischeAntwort();
  daten.daily.temperature_2m_mean[0] = Number.NaN;
  // Das Sommermittel wird nicht benötigt, der letzte Wintertag hingegen schon.
  daten.daily.temperature_2m_mean[daten.daily.time.length - 1] = Number.NaN;
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json(daten));
  const heute = new Date('1953-10-31');
  const ergebnis = await ladeKlimatrend(seen[0], undefined, heute);
  assert.ok(ergebnis.fehler);
  await ladeKlimatrend(seen[0], undefined, heute);
  assert.equal(abruf.mock.callCount(), 2);
});
