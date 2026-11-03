/**
 * useBeraterDaten.ts – Messwerte, Prognosen und aktuelle Kälteserien für den KI-Berater
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import { useMemo } from 'react';
import { useSeeDaten } from '../context/SeeDatenContext';
import { seen } from '../daten/seen';
import type { SeeAnsicht } from '../typen/ansicht';
import type { AktuelleKaelteserie } from '../typen/klima';
import type { SeePrognose } from '../typen/prognose';
import { zuAnsicht } from '../utils/seen';
import { useKaelteserien } from './useKaelteserien';
import { usePrognose } from './usePrognose';

export interface BeraterDaten {
  seen: SeeAnsicht[];
  prognosen: SeePrognose[];
  kaelteserien: AktuelleKaelteserie[];
  isLaden: boolean; // Messwerte und Prognosen
  isKaelteserienLaden: boolean; // nur für Eissport nötig
  fehler: { salzburg: string | null; ooe: string | null; prognose: string | null; kaelteserie: string | null };
  neuLaden: () => void;
}

export function useBeraterDaten(): BeraterDaten {
  const messwerte = useSeeDaten();
  const wetter = usePrognose(seen);
  const kaelte = useKaelteserien(seen);
  const ansichten = useMemo(() => seen.map((see) => zuAnsicht(see, messwerte.messungen)), [messwerte.messungen]);
  const neuLaden = (): void => {
    messwerte.neuLaden();
    wetter.neuLaden();
    kaelte.neuLaden();
  };
  return {
    seen: ansichten,
    prognosen: wetter.prognosen,
    kaelteserien: kaelte.kaelteserien,
    isLaden: messwerte.isLaden || wetter.isLaden,
    isKaelteserienLaden: kaelte.isLaden,
    fehler: { ...messwerte.fehler, prognose: wetter.fehler, kaelteserie: kaelte.fehler },
    neuLaden,
  };
}
