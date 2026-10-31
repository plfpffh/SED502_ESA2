/**
 * openMeteo.ts – Historische Lufttemperaturen am Standort eines Sees
 *
 * Dokumentation: https://open-meteo.com/en/docs/historical-weather-api
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import type { See } from '../typen/see.ts';
import type { KlimaTag } from '../utils/klima.ts';
import type { Klimakennzahlen } from '../typen/klima.ts';
import { berechneKlimakennzahlen } from '../utils/klima.ts';
import { fetchJSON } from '../utils/fetchJSON.ts';

const ARCHIV_URL = 'https://archive-api.open-meteo.com/v1/archive';
const FORMATFEHLER = 'Die Klimadaten von Open-Meteo haben ein unerwartetes Format.';

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

export function zuKlimaTagen(roh: unknown): KlimaTag[] {
  if (!istObjekt(roh) || !istObjekt(roh.daily)) throw new Error(FORMATFEHLER);
  const { time, temperature_2m_min: minimum, temperature_2m_max: maximum, temperature_2m_mean: mittel } = roh.daily;
  if (!Array.isArray(time) || !Array.isArray(minimum) || !Array.isArray(maximum) || !Array.isArray(mittel)
    || minimum.length !== time.length || maximum.length !== time.length || mittel.length !== time.length) {
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

/** See und Zeitraum laden. */
export async function ladeKlimatage(see: See, von: string, bis: string, signal?: AbortSignal): Promise<KlimaTag[]> {
  if (!istDatum(von) || !istDatum(bis) || von > bis) {
    throw new Error('Der Zeitraum für die Klimadaten ist ungültig.');
  }
  const parameter = new URLSearchParams({
    latitude: String(see.lat),
    longitude: String(see.lng),
    elevation: String(see.seehoeheM),
    start_date: von,
    end_date: bis,
    daily: 'temperature_2m_min,temperature_2m_max,temperature_2m_mean',
    timezone: 'Europe/Vienna',
    temperature_unit: 'celsius',
    models: 'era5',
  });
  const roh = await fetchJSON<unknown>(`${ARCHIV_URL}?${parameter}`, { signal });
  return zuKlimaTagen(roh);
}

/** Ein Winter pro See und der Sommer davor. */
export async function ladeWinterKennzahlen(
  seen: See[], startjahr: number, signal?: AbortSignal,
): Promise<{ kennzahlen: Klimakennzahlen[]; fehler: string | null }> {
  signal?.throwIfAborted();
  const von = `${startjahr}-06-01`;
  const bis = new Date(Date.UTC(startjahr + 1, 2, 0)).toISOString().slice(0, 10);
  const ergebnisse = await Promise.allSettled(seen.map(async (see) => {
    const tage = await ladeKlimatage(see, von, bis, signal);
    return berechneKlimakennzahlen(see.id, startjahr, tage);
  }));
  signal?.throwIfAborted();

  const kennzahlen: Klimakennzahlen[] = [];
  const fehlendeSeen: string[] = [];
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
      ? `Für folgende Seen sind die Klimadaten nicht vollständig verfügbar: ${fehlendeSeen.join(', ')}.`
      : null,
  };
}
