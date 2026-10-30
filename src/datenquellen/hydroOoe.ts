/**
 * hydroOoe.ts – Adapter für die Antwort von /api/hydro-ooe
 *
 * Überführt die Messstellen des Proxys in das einheitliche Format SeeMessung.
 * Ordnet den See anhand der Stationsnummer zu und übernimmt den Messstellennamen aus den Stammdaten.
 * Überspringt fehlende oder ungültige Messungen. 0 °C bleibt ein gültiger Messwert.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

// mit Endung, weil auch die Tests (Node) diese Datei laden
import type { See, Station } from '../typen/see.ts';
import type { SeeMessung } from '../typen/messung.ts';
import type { ZuSeeMessungen } from '../typen/schnittstellen.ts';

const QUELLE: Station['quelle'] = 'Hydrographischer Dienst OÖ';

/** Enthält ausschließlich Stationsnummern der OÖ-Quelle. */
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

export const zuSeeMessungenOoe: ZuSeeMessungen = (roh, seen) => {
  if (!Array.isArray(roh)) {
    throw new Error('Die Messwerte aus Oberösterreich haben ein unerwartetes Format.');
  }
  const zuordnung = stationenNachNummer(seen);
  const messungen: SeeMessung[] = [];

  for (const eintrag of roh as unknown[]) {
    if (eintrag === null || typeof eintrag !== 'object' || Array.isArray(eintrag)) continue;
    const { station_no, ts_value, timestamp } = eintrag as Record<string, unknown>;
    if (typeof station_no !== 'string') continue;
    if (typeof ts_value !== 'number' || !Number.isFinite(ts_value)) continue;
    if (typeof timestamp !== 'string') continue;

    const ziel = zuordnung.get(station_no);
    if (ziel === undefined) continue;

    // Die Quelle liefert eine Zeitzone. Ohne sie wäre die Auswertung vom Rechner abhängig.
    if (!/(Z|[+-]\d{2}:\d{2})$/i.test(timestamp)) continue;
    const zeit = Date.parse(timestamp);
    if (!Number.isFinite(zeit)) continue;

    messungen.push({
      seeId: ziel.seeId,
      messstelle: ziel.station.messstelle,
      quelle: QUELLE,
      wassertemperatur: ts_value,
      zeitpunkt: new Date(zeit).toISOString(), // einheitlich UTC, wie im Salzburg-Adapter
    });
  }
  return messungen;
};
