/**
 * useSeeDetail.ts – Stammdaten und zentrale Messwerte für die Detailansicht
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import { useMemo } from 'react';
import { useSeeDaten } from '../context/SeeDatenContext';
import type { SeeAnsicht } from '../typen/ansicht';
import type { See } from '../typen/see';
import { zuAnsicht } from '../utils/seen';

export interface SeeDetailDaten {
  see: SeeAnsicht;
  isLaden: boolean;
  fehler: { salzburg: string | null; ooe: string | null }; // nur Quellen, die der See tatsächlich hat
  neuLaden: () => void;
}

export function useSeeDetail(see: See): SeeDetailDaten {
  const daten = useSeeDaten();
  const ansicht = useMemo(() => zuAnsicht(see, daten.messungen), [see, daten.messungen]);
  const hatSalzburg = see.stationen.some((station) => station.quelle === 'Hydris Salzburg');
  const hatOoe = see.stationen.some((station) => station.quelle === 'Hydrographischer Dienst OÖ');

  return {
    see: ansicht,
    isLaden: daten.isLaden,
    fehler: {
      salzburg: hatSalzburg ? daten.fehler.salzburg : null,
      ooe: hatOoe ? daten.fehler.ooe : null,
    },
    neuLaden: daten.neuLaden,
  };
}
