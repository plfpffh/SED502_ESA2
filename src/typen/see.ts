/**
 * see.ts – Datenmodell der Datenschicht
 *
 * Beschreibt die Rohdaten, so wie sie gespeichert bzw. geladen werden.
 * Darf nur von daten/ und utils/ verwendet werden, nie direkt von Komponenten oder Seiten.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

export type Bundesland = 'Salzburg' | 'Oberösterreich';

export type Datenquelle = 'Hydris Salzburg' | 'Hydrographischer Dienst OÖ';

/** Ein einzelner Messwert einer Messstelle am See. */
export interface Messwert {
  messstelle: string;
  quelle: Datenquelle;
  wassertemperatur: number; // °C
  zeitpunkt: string; // ISO-Datum, z.B. '2026-09-25T18:00'
}

/** Stammdaten eines Sees inkl. Momentaufnahme der Wassertemperatur. */
export interface See {
  id: string;
  name: string;
  bundeslaender: Bundesland[];
  flaecheKm2: number;
  maxTiefeM: number;
  seehoeheM: number;
  messwerte: Messwert[];
}
