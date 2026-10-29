/**
 * messungen.ts – Antwort einer Datenquelle in Messungen übersetzen (Logikschicht)
 *
 * Reine Funktion ohne React, damit sie in Node testbar ist. Ein Lade- oder Formatfehler
 * betrifft nur die jeweilige Quelle, die andere Quelle zeigt weiterhin Werte.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

// mit Endung, weil auch die Tests (Node) diese Datei laden
import type { See } from '../typen/see.ts';
import type { SeeMessung } from '../typen/messung.ts';
import type { ZuSeeMessungen } from '../typen/schnittstellen.ts';

export interface QuellErgebnis {
  messungen: SeeMessung[];
  fehler: string | null;
}

/**
 * Übersetzt die geladenen Rohdaten einer Quelle mit ihrem Adapter.
 * daten null und kein Fehler bedeutet: noch nicht geladen.
 */
export function uebersetzeQuelle(
  daten: unknown,
  ladefehler: string | null,
  adapter: ZuSeeMessungen,
  seen: See[],
): QuellErgebnis {
  if (ladefehler !== null) {
    return { messungen: [], fehler: ladefehler };
  }
  if (daten === null) {
    return { messungen: [], fehler: null };
  }
  try {
    return { messungen: adapter(daten, seen), fehler: null };
  } catch (err) {
    return { messungen: [], fehler: err instanceof Error ? err.message : 'Unbekannter Fehler beim Auswerten.' };
  }
}
