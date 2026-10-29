/**
 * filter.ts – Standardwerte und Umschalten des Filters der Seenliste
 *
 * Reine Funktionen, das Formular (komponenten/SeenFilter.tsx) ruft sie bei Änderungen auf.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

// mit Endung, weil auch die Tests (Node) diese Datei laden
import type { Aktivitaet, Filter } from '../typen/ansicht.ts';

/** Startwert des Reglers, sobald „alle“ abgewählt wird. */
export const STANDARD_MINDESTTEMPERATUR = 20;

/** Auswahl für den Eissport-Filter (PLANUNG.md, Abschnitt 5), Standard 14. */
export const KAELTETAGE_AUSWAHL = [7, 14, 21, 28] as const;
export const STANDARD_KAELTETAGE = 14;

export const STANDARD_FILTER: Filter = {
  bundesland: 'alle',
  tiefe: 'alle',
  sortierung: 'temperatur',
  aktivitaet: 'baden',
  mindestTemperatur: null,
  mindestKaeltetage: null,
};

/**
 * Wechselt zwischen Baden und Eissport.
 * Die Sortierung nach dem Wert des Modus (Temperatur bzw. Kälteserie) geht mit, andere Sortierungen bleiben.
 */
export function wechsleAktivitaet(filter: Filter, aktivitaet: Aktivitaet): Filter {
  let sortierung = filter.sortierung;
  if (aktivitaet === 'eissport' && sortierung === 'temperatur') {
    sortierung = 'kaelteserie';
  }
  if (aktivitaet === 'baden' && sortierung === 'kaelteserie') {
    sortierung = 'temperatur';
  }
  return { ...filter, aktivitaet, sortierung };
}
