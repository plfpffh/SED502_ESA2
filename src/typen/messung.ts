import type { Datenquelle } from './see';

/** Gültige Live-Messung einer See-Messstelle. Gemeinsames Format beider Landesquellen. */
export interface SeeMessung {
  seeId: string;
  messstelle: string; // exakt der Name aus der zugeordneten Station
  quelle: Datenquelle;
  wassertemperatur: number; // °C, fehlende Werte werden vom Adapter ausgelassen
  zeitpunkt: string; // ISO-Zeitstempel mit Zeitzone
}
