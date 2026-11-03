/**
 * prognose.ts – Lufttemperatur-Prognose für den KI-Berater
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

/** Lufttemperatur-Prognose für einen Tag. Null bedeutet einen fehlenden Wert. */
export interface Prognosetag {
  datum: string; // YYYY-MM-DD, Ortszeit des Sees
  temperaturMin: number | null; // °C
  temperaturMax: number | null; // °C
}

/** Prognose am Standort eines Sees für den KI-Berater. */
export interface SeePrognose {
  seeId: string;
  tage: Prognosetag[];
}
