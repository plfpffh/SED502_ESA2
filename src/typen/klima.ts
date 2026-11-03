/**
 * klima.ts – Klimakennzahlen aus Open-Meteo
 *
 * Berechnete Kennzahlen eines Sees für einen Winter und den Sommer davor, dazu der Frosttage-Verlauf (Detailseite)
 * und die aktuelle Kälteserie bis gestern (Eissport-Modus, aus der Forecast-API).
 * Werden in utils/klima.ts berechnet, nie von der KI.
 * Projektdefinition: Winter = Dezember bis Februar, Sommer = Juni bis August.
 * '2025/26' bezeichnet Dezember 2025 bis Februar 2026 und den Sommer 2025.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

export interface Klimakennzahlen {
  seeId: string;
  winter: string; // z.B. '2025/26'
  frosttage: number; // Tagesminimum < 0 °C
  eistage: number; // Tagesmaximum < 0 °C
  laengsteKaelteserie: number; // Tage am Stück mit Tagesmittel < 0 °C
  kaeltesumme: number; // Summe der negativen Tagesmittel, also <= 0 (°C · Tage)
  hitzetage: number; // Tagesmaximum >= 30 °C im Sommer vor dem Winter
}

// Für nicht auswertbare Zeiträume wird kein Kennzahlenobjekt erzeugt.
// Eine 0 bedeutet einen berechneten Wert, nicht fehlende Klimadaten.

/**
 * Frosttage eines Winters für den langen Verlauf auf der Detailseite.
 * Braucht nur das Tagesminimum und ist deshalb bei Open-Meteo ein Drittel so teuer wie alle Kennzahlen.
 */
export type FrosttageWinter = Pick<Klimakennzahlen, 'winter' | 'frosttage'>;

/** Aktuelle Kälteserie eines Sees für den Eissport-Modus der Seenliste. */
export interface AktuelleKaelteserie {
  seeId: string;
  tage: number; // Tage am Stück bis einschließlich bis mit Tagesmittel der Luft unter 0 °C; 0 = bis war nicht unter 0 °C
  bis: string; // letzter ausgewerteter Tag (gestern in Österreich), YYYY-MM-DD
}
