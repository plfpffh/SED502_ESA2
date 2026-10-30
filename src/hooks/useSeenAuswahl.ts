/**
 * useSeenAuswahl.ts – gefilterte Seen samt Kennzahlen für die Seenliste
 *
 * Verbindet Stammdaten, Messwerte (SeeDatenContext) und Klimawerte (useKlimaAlle) mit waehleSeen().
 * So bekommt die Seite nur fertige SeeAnsicht-Objekte und liest die Stammdaten nicht selbst.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { useMemo } from 'react';
import { useSeeDaten } from '../context/SeeDatenContext';
import { seen } from '../daten/seen';
import type { Auswahl, Filter } from '../typen/ansicht';
import { waehleSeen } from '../utils/seen';
import { useKlimaAlle } from './useKlimaAlle';

export interface SeenAuswahl {
  auswahl: Auswahl;
  isLaden: boolean;
  fehler: { salzburg: string | null; ooe: string | null; klima: string | null };
  neuLaden: () => void;
}

export function useSeenAuswahl(filter: Filter): SeenAuswahl {
  const daten = useSeeDaten();
  const klima = useKlimaAlle(seen);

  const auswahl = useMemo(
    () => waehleSeen(seen, daten.messungen, klima.kennzahlen, filter),
    [daten.messungen, klima.kennzahlen, filter],
  );

  const neuLaden = (): void => {
    daten.neuLaden();
    klima.neuLaden();
  };

  return {
    auswahl,
    isLaden: daten.isLaden || klima.isLaden,
    fehler: { ...daten.fehler, klima: klima.fehler },
    neuLaden,
  };
}
