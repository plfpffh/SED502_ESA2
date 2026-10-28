/**
 * klima.ts – Klimakennzahlen aus Open-Meteo
 *
 * Werden in utils/klima.ts berechnet, nie von der KI.
 * Begriffe nach meteorologischer Definition: Frosttag Tmin < 0 °C, Eistag Tmax < 0 °C, Hitzetag Tmax ≥ 30 °C.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

/** Kennzahlen eines Winters (bzw. des Sommers davor) für einen See. */
export interface Klimakennzahlen {
  seeId: string;
  winter: string; // z.B. '2025/26'
  frosttage: number; // Tagesminimum < 0 °C
  eistage: number; // Tagesmaximum < 0 °C
  laengsteKaelteserie: number; // längste Serie von Tagen mit Tagesmittel < 0 °C
  kaeltesumme: number; // Summe der negativen Tagesmittel
  hitzetage: number; // Tagesmaximum ≥ 30 °C (Sommer davor)
}
