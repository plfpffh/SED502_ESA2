/**
 * klima.ts – Klimakennzahlen aus Open-Meteo
 *
 * Berechnete Kennzahlen eines Sees für einen Winter und den Sommer davor.
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
