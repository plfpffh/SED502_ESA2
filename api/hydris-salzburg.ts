/**
 * Salzburg-Proxy: Lädt Wassertemperaturen der Salzburger Seen serverseitig (Hydris hat kein CORS).
 * Quelle und Feldnamen geprüft am 28.10.2026. Das undokumentierte Format kann sich ändern.
 *
 * Fehlertoleranz: Ist die Antwort insgesamt unbrauchbar, gibt es einen Fehler.
 * Liefert nur eine einzelne Station keinen gültigen Wert, bekommt sie v = null, die übrigen Seen bleiben sichtbar.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

const QUELL_URL = 'https://www.salzburg.gv.at/wasser/hydro/grafiken/data.json';
// muss zu den Hydris-Stationen in src/daten/seen.ts passen (wird in tests/hydris-salzburg.test.ts geprüft)
export const STATIONSNUMMERN = new Set([
  '205328', // Attersee: Unterach
  '205286', // Mondsee: Limnologisches Institut
  '203646', // Wolfgangsee: St. Gilgen
  '203588', // Wallersee
  '203612', // Obertrumer See
  '203117', // Zeller See
  '203604', // Mattsee
  '203653', // Fuschlsee
  '204131', // Grabensee
]);

/** Eine Station, reduziert auf das, was der Adapter braucht. Feldnamen wie in Hydris. */
export interface HydrisMessstelle {
  number: string;
  v: number | null; // Wassertemperatur in °C (values.WT.Cmd.v)
  dt: number | null; // Messzeitpunkt in ms seit 1970 (values.WT.Cmd.dt)
}

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert);
}

/** Liest values.WT.Cmd; ist die Struktur unerwartet, sind Wert und Zeitpunkt null. */
function leseWassertemperatur(station: Record<string, unknown>): Pick<HydrisMessstelle, 'v' | 'dt'> {
  const values = station.values;
  const wt = istObjekt(values) ? values.WT : undefined;
  const cmd = istObjekt(wt) ? wt.Cmd : undefined;
  if (!istObjekt(cmd) || typeof cmd.v !== 'number' || !Number.isFinite(cmd.v)) {
    return { v: null, dt: null };
  }
  const dt = typeof cmd.dt === 'number' && Number.isFinite(cmd.dt) ? cmd.dt : null;
  // ein Wert ohne Zeitpunkt ist nicht einzuordnen
  return dt === null ? { v: null, dt: null } : { v: cmd.v, dt };
}

export function filtereSeenStationen(roh: unknown): HydrisMessstelle[] {
  if (!Array.isArray(roh)) {
    throw new Error('Die Salzburger Datenquelle liefert kein Stationsarray.');
  }

  const messstellen: HydrisMessstelle[] = [];
  for (const eintrag of roh) {
    if (!istObjekt(eintrag) || typeof eintrag.number !== 'string') continue;
    if (!STATIONSNUMMERN.has(eintrag.number)) continue;
    messstellen.push({ number: eintrag.number, ...leseWassertemperatur(eintrag) });
  }
  return messstellen;
}

export default async function hydrisSalzburg(request: IncomingMessage, response: ServerResponse): Promise<void> {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.statusCode = 405;
    response.end(JSON.stringify({ fehler: 'Die Messwerte können nur mit GET abgerufen werden.' }));
    return;
  }

  try {
    const antwort = await fetch(QUELL_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!antwort.ok) throw new Error(`Salzburger Datenquelle: HTTP ${antwort.status}`);
    const roh: unknown = await antwort.json();
    const messstellen = filtereSeenStationen(roh);

    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
    response.statusCode = 200;
    response.end(JSON.stringify(messstellen));
  } catch (fehler: unknown) {
    const timeout = fehler instanceof Error && ['TimeoutError', 'AbortError'].includes(fehler.name);
    response.statusCode = timeout ? 504 : 502;
    response.end(JSON.stringify({
      fehler: timeout
        ? 'Der Abruf der Messwerte aus Salzburg dauert zu lange. Bitte später erneut versuchen.'
        : 'Die Messwerte aus Salzburg sind gerade nicht verfügbar. Bitte später erneut versuchen.',
    }));
  }
}
