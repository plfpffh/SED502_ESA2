/**
 * useSeenAuswahl.ts – gefilterte Seen samt Kennzahlen für die Seenliste
 *
 * Verbindet Stammdaten, Messwerte (SeeDatenContext) und aktuelle Kälteserien (useKaelteserien) mit waehleSeen().
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
import { useKaelteserien } from './useKaelteserien';

export interface SeenAuswahl {
  auswahl: Auswahl;
  isLaden: boolean;
  fehler: { salzburg: string | null; ooe: string | null; kaelteserie: string | null };
  neuLaden: () => void;
}

export function useSeenAuswahl(filter: Filter): SeenAuswahl {
  const daten = useSeeDaten();
  const kaelte = useKaelteserien(seen);

  const auswahl = useMemo(
    () => waehleSeen(seen, daten.messungen, kaelte.kaelteserien, filter),
    [daten.messungen, kaelte.kaelteserien, filter],
  );

  const neuLaden = (): void => {
    daten.neuLaden();
    kaelte.neuLaden();
  };

  return {
    auswahl,
    isLaden: daten.isLaden || (filter.aktivitaet === 'eissport' && kaelte.isLaden),
    fehler: { ...daten.fehler, kaelteserie: kaelte.fehler },
    neuLaden,
  };
}
