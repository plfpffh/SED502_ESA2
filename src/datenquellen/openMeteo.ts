/**
 * openMeteo.ts – Lufttemperaturen am Standort der Seen: Historie (Archiv), 7-Tage-Vorhersage und aktuelle
 * Kälteserie (Forecast-API mit past_days). Alle Abrufe laufen über begrenzt() (höchstens 4 gleichzeitig).
 *
 * Dokumentationen:
 * Historische Daten: https://open-meteo.com/en/docs/historical-weather-api
 * Vorhersagedaten: https://open-meteo.com/en/docs
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import type { See } from '../typen/see.ts';
import type { KlimaTag } from '../utils/klima.ts';
import type { AktuelleKaelteserie, FrosttageWinter, Klimakennzahlen } from '../typen/klima.ts';
import type { Prognosetag, SeePrognose } from '../typen/prognose.ts';
import {
  berechneAktuelleKaelteserie, berechneFrosttageVerlauf, berechneKlimakennzahlen, gesternInWien, letzterAbgeschlossenerWinter,
} from '../utils/klima.ts';
import { fetchJSON, HttpFehler } from '../utils/fetchJSON.ts';
import {
  frosttageCacheSchluessel, klimaCacheSchluessel, liesFrosttageCache, liesKlimaCache, speichereFrosttageCache, speichereKlimaCache,
} from '../utils/klimaCache.ts';
import { prognoseTage } from '../utils/prognose.ts';

const ARCHIV_URL = 'https://archive-api.open-meteo.com/v1/archive';
const PROGNOSE_URL = 'https://api.open-meteo.com/v1/forecast';
const PROGNOSE_DAUER = 30 * 60 * 1000;
const prognoseCache = new Map<string, { zeitpunkt: number; prognose: SeePrognose }>();
const FORMATFEHLER = 'Die Klimadaten von Open-Meteo haben ein unerwartetes Format.';
const LIMITMELDUNG = 'Open-Meteo Anfragelimit erreicht, bitte warten und später erneut versuchen.';
const UNERREICHBAR = 'Open-Meteo ist gerade nicht erreichbar (überlastet oder gestört). Bitte später erneut versuchen.';

/**
 * Übersetzt HTTP-Fehler von Open-Meteo in verständliche Meldungen, der Status bleibt erhalten.
 * Open-Meteo schickt seine Begründung im Feld reason, fetchJSON würde sonst „HTTP Fehler 503: …“ anzeigen.
 */
function verstaendlich(fehler: unknown): unknown {
  if (!(fehler instanceof HttpFehler)) return fehler;
  return new HttpFehler(fehler.status, fehler.status === 429 ? LIMITMELDUNG : UNERREICHBAR);
}

/**
 * Open-Meteo lehnt zu viele gleichzeitige Anfragen ab (HTTP 429 „Too many concurrent requests“), unabhängig vom
 * Minutenkontingent. Prognose und Kälteserien starten je 14 Anfragen, auf der Beraterseite beide gleichzeitig. Deshalb laufen höchstens
 * MAX_GLEICHZEITIG Abrufe parallel, die übrigen warten. Ein frei werdender Platz geht direkt an den nächsten.
 */
const MAX_GLEICHZEITIG = 4;
let laufend = 0;
const warteschlange: (() => void)[] = [];

export async function begrenzt<T>(abruf: () => Promise<T>): Promise<T> {
  if (laufend < MAX_GLEICHZEITIG) laufend++;
  else await new Promise<void>((weiter) => warteschlange.push(weiter));
  try {
    return await abruf();
  } finally {
    const naechster = warteschlange.shift();
    if (naechster) naechster();
    else laufend--;
  }
}

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert);
}

function istDatum(wert: unknown): wert is string {
  if (typeof wert !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false;
  const datum = new Date(`${wert}T00:00:00Z`);
  return Number.isFinite(datum.getTime()) && datum.toISOString().slice(0, 10) === wert;
}

/** Fehlende und ungültige Temperaturen mit null erkennbar machen. */
function zuTemperatur(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) ? wert : null;
}

/** nurMinimum: Es wurde nur das Tagesminimum angefragt, Maximum und Mittel sind dann null. */
export function zuKlimaTagen(roh: unknown, nurMinimum = false): KlimaTag[] {
  if (!istObjekt(roh) || !istObjekt(roh.daily)) throw new Error(FORMATFEHLER);
  const { time, temperature_2m_min: minimum } = roh.daily;
  const maximum = nurMinimum ? [] : roh.daily.temperature_2m_max;
  const mittel = nurMinimum ? [] : roh.daily.temperature_2m_mean;
  if (!Array.isArray(time) || !Array.isArray(minimum) || !Array.isArray(maximum) || !Array.isArray(mittel)
    || minimum.length !== time.length
    || (!nurMinimum && (maximum.length !== time.length || mittel.length !== time.length))) {
    throw new Error(FORMATFEHLER);
  }

  const bekannteTage = new Set<string>();
  return time.map((datum: unknown, index) => {
    if (!istDatum(datum) || bekannteTage.has(datum)) throw new Error(FORMATFEHLER);
    bekannteTage.add(datum);
    return {
      datum,
      minimum: zuTemperatur(minimum[index]),
      maximum: zuTemperatur(maximum[index]),
      mittel: zuTemperatur(mittel[index]),
    };
  });
}

/**
 * See und Zeitraum laden. Open-Meteo berechnet die Kosten nach Tagen und Variablen (Tage / 14 · Variablen / 10)
 * bei einem Limit von 600 pro Minute und 5.000 pro Stunde. nurMinimum drittelt die Kosten langer Zeiträume.
 */
export async function ladeKlimatage(
  see: See, von: string, bis: string, signal?: AbortSignal, nurMinimum = false,
): Promise<KlimaTag[]> {
  if (!istDatum(von) || !istDatum(bis) || von > bis) {
    throw new Error('Der Zeitraum für die Klimadaten ist ungültig.');
  }
  const parameter = new URLSearchParams({
    latitude: String(see.lat),
    longitude: String(see.lng),
    elevation: String(see.seehoeheM),
    start_date: von,
    end_date: bis,
    daily: nurMinimum ? 'temperature_2m_min' : 'temperature_2m_min,temperature_2m_max,temperature_2m_mean',
    timezone: 'Europe/Vienna',
    temperature_unit: 'celsius',
    models: 'era5',
  });
  try {
    const roh = await begrenzt(() => fetchJSON<unknown>(`${ARCHIV_URL}?${parameter}`, { signal }));
    return zuKlimaTagen(roh, nurMinimum);
  } catch (fehler) {
    throw verstaendlich(fehler);
  }
}

/** Ein Winter pro See und der Sommer davor. */
export async function ladeWinterKennzahlen(
  seen: See[], startjahr: number, signal?: AbortSignal,
): Promise<{ kennzahlen: Klimakennzahlen[]; fehler: string | null }> {
  signal?.throwIfAborted();
  const von = `${startjahr}-06-01`;
  const bis = new Date(Date.UTC(startjahr + 1, 2, 0)).toISOString().slice(0, 10);
  const ergebnisse = await Promise.allSettled(seen.map(async (see) => {
    const schluessel = klimaCacheSchluessel(see, startjahr, startjahr);
    const gespeichert = liesKlimaCache(schluessel);
    if (gespeichert) return gespeichert[0];
    const tage = await ladeKlimatage(see, von, bis, signal);
    signal?.throwIfAborted();
    const kennzahl = berechneKlimakennzahlen(see.id, startjahr, tage);
    if (kennzahl) speichereKlimaCache(schluessel, [kennzahl]);
    return kennzahl;
  }));
  signal?.throwIfAborted();

  const kennzahlen: Klimakennzahlen[] = [];
  const fehlendeSeen: string[] = [];
  const limitErreicht = ergebnisse.some((ergebnis) =>
    ergebnis.status === 'rejected' && ergebnis.reason instanceof HttpFehler && ergebnis.reason.status === 429,
  );
  ergebnisse.forEach((ergebnis, index) => {
    if (ergebnis.status === 'fulfilled' && ergebnis.value !== null) {
      kennzahlen.push(ergebnis.value);
    } else {
      fehlendeSeen.push(seen[index].name);
    }
  });
  return {
    kennzahlen,
    fehler: fehlendeSeen.length > 0
      ? `${limitErreicht ? `${LIMITMELDUNG} ` : ''}Für folgende Seen sind die Klimadaten nicht vollständig verfügbar: ${fehlendeSeen.join(', ')}.`
      : null,
  };
}

/**
 * Klima-Historie eines Sees für die Detailseite (ohne den noch laufenden Winter).
 * Der lange Verlauf ab 1950 enthält nur die Frosttage, die vollständigen Kennzahlen gibt es für den letzten Winter.
 * Beides wird parallel geladen. Bei wiederholtem Aufruf kommen beide aus dem Zwischenspeicher (24 Stunden).
 */
export async function ladeKlimatrend(
  see: See, signal?: AbortSignal, heute = new Date(),
): Promise<{ kennzahlen: Klimakennzahlen[]; frosttage: FrosttageWinter[]; fehler: string | null }> {
  signal?.throwIfAborted();
  const startjahr = 1950;
  const endjahr = letzterAbgeschlossenerWinter(heute);
  // allSettled: Scheitert der lange Verlauf (z.B. 429), bleiben die Kennzahlen des letzten Winters erhalten
  const [verlauf, letzterWinter] = await Promise.allSettled([
    ladeFrosttageVerlauf(see, startjahr, endjahr, signal),
    ladeWinterKennzahlen([see], endjahr, signal),
  ]);
  signal?.throwIfAborted();
  // ladeWinterKennzahlen wirft nur bei Abbruch, der oben schon behandelt ist
  const winter = letzterWinter.status === 'fulfilled' ? letzterWinter.value : { kennzahlen: [], fehler: null };
  const winterText = `${endjahr}/${String(endjahr + 1).slice(-2)}`;
  const winterHinweis = winter.fehler
    ? `${winter.fehler.startsWith(LIMITMELDUNG) ? `${LIMITMELDUNG} ` : ''}Die Kennzahlen des Winters ${winterText} sind nicht vollständig verfügbar.`
    : null;

  if (verlauf.status === 'rejected') {
    // ohne Verlauf und ohne Kennzahlen gibt es nichts anzuzeigen: Fehler weitergeben (z.B. 429 mit Limit-Hinweis)
    if (winter.kennzahlen.length === 0) throw verlauf.reason;
    const grund = verlauf.reason;
    const meldung = grund instanceof HttpFehler || (grund instanceof Error && grund.name === 'Error')
      ? grund.message : 'Der Frosttage-Verlauf ist gerade nicht erreichbar.';
    return { kennzahlen: winter.kennzahlen, frosttage: [], fehler: meldung };
  }

  const frosttage = verlauf.value;
  const fehlendeWinter = endjahr - startjahr + 1 - frosttage.length;
  const hinweise = [
    fehlendeWinter > 0
      ? `Für ${fehlendeWinter} Winter sind die Klimadaten nicht vollständig verfügbar. Diese Zeiträume wurden nicht ausgewertet.`
      : null,
    winterHinweis,
  ].filter((hinweis) => hinweis !== null);
  return { kennzahlen: winter.kennzahlen, frosttage, fehler: hinweise.length > 0 ? hinweise.join(' ') : null };
}

/** Frosttage aller Winter ab startjahr, nur aus dem Tagesminimum. Vollständige Verläufe werden 24 Stunden gespeichert. */
async function ladeFrosttageVerlauf(
  see: See, startjahr: number, endjahr: number, signal?: AbortSignal,
): Promise<FrosttageWinter[]> {
  const schluessel = frosttageCacheSchluessel(see, startjahr, endjahr);
  const gespeichert = liesFrosttageCache(schluessel);
  if (gespeichert) return gespeichert;
  const bis = new Date(Date.UTC(endjahr + 1, 2, 0)).toISOString().slice(0, 10);
  const tage = await ladeKlimatage(see, `${startjahr}-12-01`, bis, signal, true);
  signal?.throwIfAborted();
  const verlauf = berechneFrosttageVerlauf(startjahr, endjahr, tage);
  if (verlauf.length === endjahr - startjahr + 1) speichereFrosttageCache(schluessel, verlauf);
  return verlauf;
}

/** Tagesmittel aus einer Antwort der Forecast-API (daily=temperature_2m_mean). */
export function zuTagesmitteln(roh: unknown): KlimaTag[] {
  if (!istObjekt(roh) || !istObjekt(roh.daily)) throw new Error(FORMATFEHLER);
  const { time, temperature_2m_mean: mittel } = roh.daily;
  if (!Array.isArray(time) || !Array.isArray(mittel) || mittel.length !== time.length) throw new Error(FORMATFEHLER);
  return time.map((datum: unknown, index) => {
    if (!istDatum(datum)) throw new Error(FORMATFEHLER);
    return { datum, minimum: null, maximum: null, mittel: zuTemperatur(mittel[index]) };
  });
}

const KAELTESERIE_DAUER = 30 * 60 * 1000;
const kaelteserieCache = new Map<string, { zeitpunkt: number; serie: AktuelleKaelteserie }>();

/**
 * Aktuelle Kälteserie je See für den Eissport-Modus der Seenliste: Tagesmittel der letzten 92 Tage
 * aus der Forecast-API (past_days), ausgewertet bis gestern. Fällt ein See aus, bleiben die übrigen erhalten.
 * Ergebnisse bleiben 30 Minuten im Speicher, solange sie bis gestern reichen; neuLaden umgeht ihn.
 * Mehr als 92 Tage kann die Serie wegen des Fensters nicht zählen, für die Grenze von 14 Tagen ohne Bedeutung.
 */
export async function ladeAktuelleKaelteserien(
  seen: See[], signal?: AbortSignal, neuLaden = false, heute = new Date(),
): Promise<{ kaelteserien: AktuelleKaelteserie[]; fehler: string | null }> {
  signal?.throwIfAborted();
  const bis = gesternInWien(heute);
  const ergebnisse = await Promise.allSettled(seen.map(async (see): Promise<AktuelleKaelteserie | null> => {
    const schluessel = [see.id, see.lat, see.lng, see.seehoeheM].join(':');
    const gespeichert = kaelteserieCache.get(schluessel);
    const alter = gespeichert ? Date.now() - gespeichert.zeitpunkt : Infinity;
    if (!neuLaden && gespeichert && alter >= 0 && alter < KAELTESERIE_DAUER && gespeichert.serie.bis === bis) {
      return gespeichert.serie;
    }
    const parameter = new URLSearchParams({
      latitude: String(see.lat), longitude: String(see.lng), elevation: String(see.seehoeheM),
      daily: 'temperature_2m_mean', past_days: '92', forecast_days: '1',
      timezone: 'Europe/Vienna', temperature_unit: 'celsius',
    });
    let roh: unknown;
    try {
      roh = await begrenzt(() => fetchJSON<unknown>(`${PROGNOSE_URL}?${parameter}`, { signal }));
    } catch (fehler) {
      throw verstaendlich(fehler);
    }
    const tage = berechneAktuelleKaelteserie(zuTagesmitteln(roh), bis);
    if (tage === null) return null;
    const serie = { seeId: see.id, tage, bis };
    kaelteserieCache.set(schluessel, { zeitpunkt: Date.now(), serie });
    return serie;
  }));
  signal?.throwIfAborted();

  const kaelteserien: AktuelleKaelteserie[] = [];
  const fehlendeSeen: string[] = [];
  ergebnisse.forEach((ergebnis, index) => {
    if (ergebnis.status === 'fulfilled' && ergebnis.value !== null) kaelteserien.push(ergebnis.value);
    else fehlendeSeen.push(seen[index].name);
  });
  const limitErreicht = ergebnisse.some((ergebnis) =>
    ergebnis.status === 'rejected' && ergebnis.reason instanceof HttpFehler && ergebnis.reason.status === 429,
  );
  return {
    kaelteserien,
    fehler: fehlendeSeen.length > 0
      ? `${limitErreicht ? `${LIMITMELDUNG} ` : ''}Für folgende Seen ist die aktuelle Kälteserie nicht verfügbar: ${fehlendeSeen.join(', ')}.`
      : null,
  };
}

/** Tagesminimum und -maximum aus einer Antwort der Forecast-API (daily=temperature_2m_min,temperature_2m_max). */
export function zuPrognosetagen(roh: unknown): Prognosetag[] {
  const fehler = 'Die Wetterprognose von Open-Meteo hat ein unerwartetes Format.';
  if (!istObjekt(roh) || !istObjekt(roh.daily)) throw new Error(fehler);
  const { time, temperature_2m_min: minimum, temperature_2m_max: maximum } = roh.daily;
  if (!Array.isArray(time) || !Array.isArray(minimum) || !Array.isArray(maximum)
    || minimum.length !== time.length || maximum.length !== time.length) throw new Error(fehler);

  const bekannteTage = new Set<string>();
  return time.map((datum: unknown, index) => {
    if (!istDatum(datum) || bekannteTage.has(datum)) throw new Error(fehler);
    bekannteTage.add(datum);
    return { datum, temperaturMin: zuTemperatur(minimum[index]), temperaturMax: zuTemperatur(maximum[index]) };
  });
}

/**
 * Sieben Tage Lufttemperatur (Minimum, Maximum) je See für den KI-Berater, ab heute in Wien.
 * Vollständige Prognosen bleiben 30 Minuten im Speicher, solange sie mit heute beginnen; neuLaden umgeht ihn.
 * Seen mit Lücken werden geliefert und zusätzlich in fehler genannt, Seen ganz ohne Werte fehlen.
 */
export async function ladePrognosen(
  seen: See[], signal?: AbortSignal, neuLaden = false, heute = new Date(),
): Promise<{ prognosen: SeePrognose[]; fehler: string | null }> {
  signal?.throwIfAborted();
  const tage = prognoseTage(heute);
  const ergebnisse = await Promise.allSettled(seen.map(async (see) => {
    const schluessel = [see.id, see.lat, see.lng, see.seehoeheM].join(':');
    const gespeichert = prognoseCache.get(schluessel);
    const alter = gespeichert ? Date.now() - gespeichert.zeitpunkt : Infinity;
    if (!neuLaden && gespeichert && alter >= 0 && alter < PROGNOSE_DAUER
      && gespeichert.prognose.tage[0]?.datum === tage[0]) return gespeichert.prognose;

    const parameter = new URLSearchParams({
      latitude: String(see.lat), longitude: String(see.lng), elevation: String(see.seehoeheM),
      daily: 'temperature_2m_min,temperature_2m_max', forecast_days: '7',
      timezone: 'Europe/Vienna', temperature_unit: 'celsius',
    });
    let roh: unknown;
    try {
      roh = await begrenzt(() => fetchJSON<unknown>(`${PROGNOSE_URL}?${parameter}`, { signal }));
    } catch (fehler) {
      throw verstaendlich(fehler);
    }
    signal?.throwIfAborted();
    const nachDatum = new Map(zuPrognosetagen(roh).map((tag) => [tag.datum, tag]));
    const prognose: SeePrognose = {
      seeId: see.id,
      tage: tage.map((datum) => nachDatum.get(datum) ?? { datum, temperaturMin: null, temperaturMax: null }),
    };
    if (!prognose.tage.some((tag) => tag.temperaturMin !== null || tag.temperaturMax !== null)) return null;
    if (prognose.tage.every((tag) => tag.temperaturMin !== null && tag.temperaturMax !== null)) {
      prognoseCache.set(schluessel, { zeitpunkt: Date.now(), prognose });
    }
    return prognose;
  }));
  signal?.throwIfAborted();

  const prognosen: SeePrognose[] = [];
  const fehlendeSeen: string[] = [];
  const limitErreicht = ergebnisse.some((ergebnis) =>
    ergebnis.status === 'rejected' && ergebnis.reason instanceof HttpFehler && ergebnis.reason.status === 429,
  );
  ergebnisse.forEach((ergebnis, index) => {
    if (ergebnis.status === 'fulfilled' && ergebnis.value !== null) {
      prognosen.push(ergebnis.value);
      if (ergebnis.value.tage.every((tag) => tag.temperaturMin !== null && tag.temperaturMax !== null)) return;
    }
    fehlendeSeen.push(seen[index].name);
  });
  return {
    prognosen,
    fehler: fehlendeSeen.length > 0
      ? `${limitErreicht ? `${LIMITMELDUNG} ` : ''}Für folgende Seen ist die Wetterprognose nicht vollständig verfügbar: ${fehlendeSeen.join(', ')}.`
      : null,
  };
}
