/**
 * useBeraterDaten.ts – Messwerte und Prognosen für den KI-Berater
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import { useMemo } from 'react';
import { useSeeDaten } from '../context/SeeDatenContext';
import { seen } from '../daten/seen';
import { zuAnsicht } from '../utils/seen';
import { usePrognose } from './usePrognose';

export function useBeraterDaten() {
  const messwerte = useSeeDaten();
  const wetter = usePrognose(seen);
  const ansichten = useMemo(() => seen.map((see) => zuAnsicht(see, messwerte.messungen)), [messwerte.messungen]);
  const neuLaden = (): void => {
    messwerte.neuLaden();
    wetter.neuLaden();
  };
  return {
    seen: ansichten,
    prognosen: wetter.prognosen,
    isLaden: messwerte.isLaden || wetter.isLaden,
    fehler: { ...messwerte.fehler, prognose: wetter.fehler },
    neuLaden,
  };
}
