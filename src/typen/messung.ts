/**
 * messung.ts – gemeinsames Format aller Adapter in datenquellen/
 *
 * Jede Datenquelle wird in dieses Format übersetzt. Danach ist egal, woher ein Messwert stammt.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

import type { Datenquelle } from './see.ts';

/** Gültige Live-Messung einer See-Messstelle. Gemeinsames Format beider Landesquellen. */
export interface SeeMessung {
  seeId: string;
  messstelle: string; // exakt der Name aus der zugeordneten Station
  quelle: Datenquelle;
  wassertemperatur: number; // °C, fehlende Werte werden vom Adapter ausgelassen
  zeitpunkt: string; // ISO-Zeitstempel mit Zeitzone
}
