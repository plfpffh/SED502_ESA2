/**
 * SeeDatenContext.ts – gemeinsame Messwerte für alle Seiten (Kompendium Modul 04, Abschnitt 7)
 *
 * Die Messungen werden einmal im SeeDatenProvider geladen. Seenliste, Detailseite und KI-Berater
 * lesen sie über useSeeDaten(), ohne Prop Drilling und ohne bei jedem Seitenwechsel neu zu laden.
 * Provider und Hook liegen in getrennten Dateien, weil Fast Refresh nur Dateien mit ausschließlich
 * Komponenten aktualisieren kann.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { createContext, useContext } from 'react';
import type { UseSeeMessungen } from '../typen/schnittstellen';

export type SeeDaten = ReturnType<UseSeeMessungen>;

export const SeeDatenContext = createContext<SeeDaten | null>(null);

export function useSeeDaten(): SeeDaten {
  const context = useContext(SeeDatenContext);
  if (!context) {
    throw new Error('useSeeDaten muss innerhalb von SeeDatenProvider verwendet werden.');
  }
  return context;
}
