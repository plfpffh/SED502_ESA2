/**
 * OÖ-Proxy: Lädt Wassertemperaturen der OÖ Seen serverseitig.
 * Quelle und Feldnamen geprüft am 11.10.2026. Das undokumentierte Format kann sich ändern.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

const QUELL_URL = 'https://hydro.ooe.gv.at/daten/internet/layers/5/index.json';
const STATIONSNUMMERN = new Set([
  '5290', '5210', // Attersee: Kammer, Unterach
  '4510',         // Traunsee: Ebensee
  '5020',         // Mondsee
  '4310',         // Wolfgangsee: Strobl (4320 ist die Ischl)
  '4190', '4130', // Hallstätter See: Steeg, Lahn
  '5005',         // Irrsee
  '6120',         // Almsee
  '1230',         // Holzöstersee
]);

interface HydroOoeMessstelle {
  station_no: string;
  station_name: string;
  ts_value: number | null;
  timestamp: string | null;
}

export function filtereSeenStationen(roh: unknown): HydroOoeMessstelle[] {
  if (!Array.isArray(roh)) {
    throw new Error('Die OÖ-Datenquelle liefert kein Stationsarray.');
  }

  const messstellen: HydroOoeMessstelle[] = [];
  for (const eintrag of roh) {
    if (eintrag === null || typeof eintrag !== 'object' || Array.isArray(eintrag)) {
      throw new Error('Die OÖ-Datenquelle enthält einen ungültigen Stationseintrag.');
    }
    const station = eintrag as Record<string, unknown>;
    if (typeof station.station_no !== 'string' || station.station_no.length === 0) {
      throw new Error('In den OÖ-Daten fehlt eine Stationsnummer.');
    }
    if (!STATIONSNUMMERN.has(station.station_no)) continue;
    if (station.stationparameter_no !== 'WT') {
      throw new Error('Eine ausgewählte OÖ-Station liefert keine Wassertemperatur.');
    }
    if (
      typeof station.station_name !== 'string' ||
      (station.ts_value !== null &&
        (typeof station.ts_value !== 'number' || !Number.isFinite(station.ts_value))) ||
      (station.timestamp !== null &&
        (typeof station.timestamp !== 'string' || !Number.isFinite(Date.parse(station.timestamp)))) ||
      (station.ts_value !== null && station.timestamp === null)
    ) {
      throw new Error('Eine OÖ-Messstelle hat ein unerwartetes Datenformat.');
    }
    messstellen.push({
      station_no: station.station_no,
      station_name: station.station_name,
      ts_value: station.ts_value,
      timestamp: station.timestamp,
    });
  }
  return messstellen;
}

export default async function hydroOoe(request: IncomingMessage, response: ServerResponse): Promise<void> {
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
    if (!antwort.ok) throw new Error(`OÖ-Datenquelle: HTTP ${antwort.status}`);
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
        ? 'Der Abruf der Messwerte aus Oberösterreich dauert zu lange. Bitte später erneut versuchen.'
        : 'Die Messwerte aus Oberösterreich sind gerade nicht verfügbar. Bitte später erneut versuchen.',
    }));
  }
}
