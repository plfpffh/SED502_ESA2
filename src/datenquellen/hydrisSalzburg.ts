/**
 * hydrisSalzburg.ts – Adapter für die Antwort von /api/hydris-salzburg
 *
 * Übersetzt die Messstellen des Proxys ({ number, v, dt }) in das gemeinsame Format SeeMessung.
 * Zuordnung über Quelle und Stationsnummer aus den Stammdaten, messstelle kommt aus der Station.
 * Fehlende oder ungültige Werte werden ausgelassen, eine Antwort ohne Array gilt als Formatfehler.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

// mit Endung, weil auch die Tests (Node) diese Datei laden
import type { See, Station } from '../typen/see.ts';
import type { SeeMessung } from '../typen/messung.ts';
import type { ZuSeeMessungen } from '../typen/schnittstellen.ts';

const QUELLE: Station['quelle'] = 'Hydris Salzburg';

/** Stationsnummer → See und Station, nur Hydris-Stationen. */
function stationenNachNummer(seen: See[]): Map<string, { seeId: string; station: Station }> {
  const zuordnung = new Map<string, { seeId: string; station: Station }>();
  for (const see of seen) {
    for (const station of see.stationen) {
      if (station.quelle === QUELLE) {
        zuordnung.set(station.nummer, { seeId: see.id, station });
      }
    }
  }
  return zuordnung;
}

function istEndlicheZahl(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert);
}

export const zuSeeMessungenSalzburg: ZuSeeMessungen = (roh, seen) => {
  if (!Array.isArray(roh)) {
    throw new Error('Die Messwerte aus Salzburg haben ein unerwartetes Format.');
  }
  const zuordnung = stationenNachNummer(seen);
  const messungen: SeeMessung[] = [];

  for (const eintrag of roh as unknown[]) {
    if (eintrag === null || typeof eintrag !== 'object') continue;
    const { number, v, dt } = eintrag as Record<string, unknown>;
    if (typeof number !== 'string' || !istEndlicheZahl(v) || !istEndlicheZahl(dt)) continue;

    const ziel = zuordnung.get(number);
    if (ziel === undefined) continue;

    messungen.push({
      seeId: ziel.seeId,
      messstelle: ziel.station.messstelle,
      quelle: QUELLE,
      wassertemperatur: v,
      zeitpunkt: new Date(dt).toISOString(), // UTC mit Zone Z
    });
  }
  return messungen;
};
