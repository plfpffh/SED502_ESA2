/**
 * useKaelteserien.ts – aktuelle Kälteserie bis gestern für alle Seen (Eissport-Modus der Seenliste)
 *
 * Für die Frage „Kann ich jetzt eislaufen?“ zählt, wie viele Tage am Stück bis gestern das Tagesmittel unter 0 °C
 * lag (früher: längste Serie des letzten Winters). Laufende Abrufe werden bei neuer Seenliste, neuLaden oder beim
 * Verlassen der Seite abgebrochen (AbortController).
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

import { useEffect, useState } from 'react';
import { ladeAktuelleKaelteserien } from '../datenquellen/openMeteo';
import type { AktuelleKaelteserie } from '../typen/klima';
import type { See } from '../typen/see';
import type { UseKaelteserien } from '../typen/schnittstellen';

export function useKaelteserien(seen: See[]): ReturnType<UseKaelteserien> {
  const [ergebnis, setErgebnis] = useState<{ kaelteserien: AktuelleKaelteserie[]; fehler: string | null }>({
    kaelteserien: [], fehler: null,
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
      setErgebnis({ kaelteserien: [], fehler: null });
      try {
        // zaehler > 0: nach neuLaden den Zwischenspeicher umgehen
        const daten = await ladeAktuelleKaelteserien(seen, controller.signal, zaehler > 0);
        if (!controller.signal.aborted) setErgebnis(daten);
      } catch (fehler) {
        if (!controller.signal.aborted) {
          setErgebnis({
            kaelteserien: [],
            fehler: fehler instanceof Error ? fehler.message : 'Die aktuellen Kälteserien konnten nicht geladen werden.',
          });
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
