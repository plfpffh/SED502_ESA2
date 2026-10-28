/**
 * see.ts – Datenmodell der Datenschicht
 *
 * Beschreibt Stammdaten und Stationszuordnung für Adapter, Logik und Hooks.
 * Live-Messungen stehen getrennt in messung.ts.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

export type Bundesland = 'Salzburg' | 'Oberösterreich';

export type Datenquelle = 'Hydris Salzburg' | 'Hydrographischer Dienst OÖ';

/** Zuordnung einer Messstelle zur Stationsnummer der jeweiligen Datenquelle. */
export interface Station {
  quelle: Datenquelle;
  nummer: string; // ID der Quelle, z.B. Hydris number oder OÖ station_no
  messstelle: string; // gemeinsamer Name, der Adapter übernimmt ihn in SeeMessung
}

/** Stammdaten eines Sees; Messungen werden separat geladen. */
export interface See {
  id: string;
  name: string;
  bundeslaender: Bundesland[];
  flaecheKm2: number;
  maxTiefeM: number;
  seehoeheM: number;
  lat: number; // WGS84, geografische Breite
  lng: number; // WGS84, geografische Länge
  stationen: Station[];
}
