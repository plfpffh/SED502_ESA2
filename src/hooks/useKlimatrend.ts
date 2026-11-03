/**
 * useKlimatrend.ts – Klimahistorie eines Sees ab Winter 1950/51
 * 
 * Lädt für die Detailseite nur abgeschlossene Winter: frosttage ist der Verlauf ab 1950/51 für Diagramm und Tabelle,
 * kennzahlen enthält die vollständigen Werte des letzten Winters (nur für die KI-Einschätzung).
 * Bei Datenlücken bleiben die auswertbaren Winter erhalten.
 * Ein Seewechsel, erneutes Laden oder Verlassen der Seite bricht laufende
 * Anfragen ab und verhindert veraltete State-Updates.
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import { useEffect, useState } from 'react';
import { ladeKlimatrend } from '../datenquellen/openMeteo';
import type { FrosttageWinter, Klimakennzahlen } from '../typen/klima';
import type { See } from '../typen/see';
import type { UseKlimatrend } from '../typen/schnittstellen';

export function useKlimatrend(see: See): ReturnType<UseKlimatrend> {
  const [ergebnis, setErgebnis] = useState<{
    kennzahlen: Klimakennzahlen[]; frosttage: FrosttageWinter[]; fehler: string | null;
  }>({ kennzahlen: [], frosttage: [], fehler: null });
  const [isLaden, setIsLaden] = useState(true);
  const [zaehler, setZaehler] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const laden = async (): Promise<void> => {
      // StrictMode startet Effekte doppelt: erst nach einem Mikrotask laden, der erste Durchlauf ist dann abgebrochen
      await Promise.resolve();
      if (controller.signal.aborted) return;
      
      setIsLaden(true);
      setErgebnis({ kennzahlen: [], frosttage: [], fehler: null });
      try {
        const daten = await ladeKlimatrend(see, controller.signal);
        if (!controller.signal.aborted) setErgebnis(daten);
      } catch (fehler) {
        if (!controller.signal.aborted) {
          setErgebnis({ kennzahlen: [], frosttage: [], fehler: fehler instanceof Error ? fehler.message : 'Der Klimatrend konnte nicht geladen werden.' });
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
