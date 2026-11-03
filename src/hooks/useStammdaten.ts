/**
 * useStammdaten.ts – Zugriff der Seiten auf die Stammdaten der Seen
 *
 * Drei-Schichten-Modell aus ESA 1: Die Darstellung (seiten/, komponenten/) importiert nichts aus der Datenschicht.
 * Seiten fragen Stammdaten deshalb über diese Hooks ab, wie die Messwerte über useSeeDaten().
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { seen } from '../daten/seen';
import type { See } from '../typen/see';

/** Stammdaten des Sees mit dieser id, null für eine unbekannte id (z.B. vertippte Adresse). */
export function useSeeStammdaten(id: string | undefined): See | null {
  return seen.find((see) => see.id === id) ?? null;
}

/** Anzahl der Seen in der App. */
export function useAnzahlSeen(): number {
  return seen.length;
}
