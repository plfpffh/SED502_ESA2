/**
 * usePrognose.ts – 7-Tage Vorhersage für die Lufttemperaturen für den KI-Berater
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import { useEffect, useState } from 'react';
import { ladePrognosen } from '../datenquellen/openMeteo';
import type { See } from '../typen/see';
import type { SeePrognose } from '../typen/prognose';
import type { UsePrognose } from '../typen/schnittstellen';

export function usePrognose(seen: See[]): ReturnType<UsePrognose> {
  const [ergebnis, setErgebnis] = useState<{ prognosen: SeePrognose[]; fehler: string | null }>({
    prognosen: [], fehler: null,
  });
  const [isLaden, setIsLaden] = useState(seen.length > 0);
  const [zaehler, setZaehler] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const laden = async (): Promise<void> => {
      // StrictMode startet Effekte doppelt: erst nach einem Mikrotask laden, der erste Durchlauf ist dann abgebrochen
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setIsLaden(true);
      setErgebnis({ prognosen: [], fehler: null });
      try {
        // zaehler > 0: nach neuLaden den Zwischenspeicher umgehen
        const daten = await ladePrognosen(seen, controller.signal, zaehler > 0);
        if (!controller.signal.aborted) setErgebnis(daten);
      } catch (fehler) {
        if (!controller.signal.aborted) {
          setErgebnis({ prognosen: [], fehler: fehler instanceof Error ? fehler.message : 'Die Wetterprognose konnte nicht geladen werden.' });
        }
      } finally {
        if (!controller.signal.aborted) setIsLaden(false);
      }
    };
    void laden();
    return () => controller.abort();
  }, [seen, zaehler]);

  const neuLaden = (): void => setZaehler((wert) => wert + 1);
  return { ...ergebnis, isLaden, neuLaden };
}
