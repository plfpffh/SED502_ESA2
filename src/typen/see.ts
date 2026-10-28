/**
 * see.ts – Datenmodell der Datenschicht
 *
 * Beschreibt die Stammdaten der Seen und ihre Messstellen.
 * Darf nur von daten/, datenquellen/ und utils/ verwendet werden, nie direkt von Komponenten oder Seiten.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

export type Bundesland = 'Salzburg' | 'Oberösterreich';

export type Datenquelle = 'Hydris Salzburg' | 'Hydrographischer Dienst OÖ';

/** Eine Messstelle am See, über die Nummer der jeweiligen Datenquelle zugeordnet. */
export interface Station {
  quelle: Datenquelle;
  nummer: string; // Hydris: number, OÖ: station_no
  messstelle: string; // z.B. 'Kammer'
}

/** Stammdaten eines Sees. Messwerte kommen live über die Datenquellen (siehe typen/messung.ts). */
export interface See {
  id: string;
  name: string;
  bundeslaender: Bundesland[];
  flaecheKm2: number;
  maxTiefeM: number;
  seehoeheM: number;
  lat: number; // WGS84, Seemitte
  lng: number;
  stationen: Station[];
}
