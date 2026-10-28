/**
 * messung.ts – gemeinsames Format aller Adapter in datenquellen/
 *
 * Jede Datenquelle wird in dieses Format übersetzt. Danach ist egal, woher ein Messwert stammt.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

import type { Datenquelle } from './see';

/** Ein aktueller Messwert einer Messstelle. */
export interface SeeMessung {
  seeId: string;
  messstelle: string;
  quelle: Datenquelle;
  wassertemperatur: number; // °C
  zeitpunkt: string; // ISO-Datum
}
