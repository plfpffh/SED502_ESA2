/**
 * useKlimaAlle.ts – Klimakennzahlen des letzten abgeschlossenen Winters für alle Seen
 * 
 * Lädt für jeden See den letzten abgeschlossenen Winter und den vorausgehenden Sommer.
 * Bei Teilausfällen bleiben die übrigen Kennzahlen erhalten.
 * Bricht das Laden ab, sobald sich die Seenliste ändert, erneut geladen oder die Seite verlassen wird.
 * Die vollständige Historie bleibt auf der Detailseite verfügbar.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { useEffect, useState } from 'react';
import { ladeWinterKennzahlen } from '../datenquellen/openMeteo';
import type { Klimakennzahlen } from '../typen/klima';
import type { See } from '../typen/see';
import type { UseKlimaAlle } from '../typen/schnittstellen';
import { letzterAbgeschlossenerWinter } from '../utils/klima';

export function useKlimaAlle(seen: See[]): ReturnType<UseKlimaAlle> {
  const [ergebnis, setErgebnis] = useState<{ kennzahlen: Klimakennzahlen[]; fehler: string | null }>({
    kennzahlen: [], fehler: null,
  });
  const [isLaden, setIsLaden] = useState(seen.length > 0);
  const [zaehler, setZaehler] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const laden = async (): Promise<void> => {
      setIsLaden(true);
      setErgebnis({ kennzahlen: [], fehler: null });
      try {
        const daten = await ladeWinterKennzahlen(seen, letzterAbgeschlossenerWinter(), controller.signal);
        if (!controller.signal.aborted) setErgebnis(daten);
      } catch (fehler) {
        if (!controller.signal.aborted) {
          setErgebnis({ kennzahlen: [], fehler: fehler instanceof Error ? fehler.message : 'Die Klimadaten konnten nicht geladen werden.' });
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
