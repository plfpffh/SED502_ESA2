/**
 * useKlimatrend.ts – Klimahistorie eines Sees ab Winter 1950/51
 * 
 * Lädt für die Detailseite nur abgeschlossene Winter.
 * Bei Datenlücken bleiben die auswertbaren Winter erhalten.
 * Ein Seewechsel, erneutes Laden oder Verlassen der Seite bricht laufende
 * Anfragen ab und verhindert veraltete State-Updates.
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import { useEffect, useState } from 'react';
import { ladeKlimatrend } from '../datenquellen/openMeteo';
import type { Klimakennzahlen } from '../typen/klima';
import type { See } from '../typen/see';
import type { UseKlimatrend } from '../typen/schnittstellen';

export function useKlimatrend(see: See): ReturnType<UseKlimatrend> {
  const [ergebnis, setErgebnis] = useState<{ kennzahlen: Klimakennzahlen[]; fehler: string | null }>({
    kennzahlen: [], fehler: null,
  });
  const [isLaden, setIsLaden] = useState(true);
  const [zaehler, setZaehler] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const laden = async (): Promise<void> => {
      setIsLaden(true);
      setErgebnis({ kennzahlen: [], fehler: null });
      try {
        const daten = await ladeKlimatrend(see, controller.signal);
        if (!controller.signal.aborted) setErgebnis(daten);
      } catch (fehler) {
        if (!controller.signal.aborted) {
          setErgebnis({ kennzahlen: [], fehler: fehler instanceof Error ? fehler.message : 'Der Klimatrend konnte nicht geladen werden.' });
        }
      } finally {
        if (!controller.signal.aborted) setIsLaden(false);
      }
    };

    void laden();
    return () => controller.abort();
  }, [see, zaehler]);

  const neuLaden = (): void => setZaehler((wert) => wert + 1);
  return { ...ergebnis, isLaden, neuLaden };
}
