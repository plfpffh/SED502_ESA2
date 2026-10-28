/**
 * useFetch.ts – wiederverwendbarer Hook für GET-Anfragen (Kompendium Modul 04, Abschnitt 8.1)
 *
 * Liefert die drei Zustände loading (isLaden), success (daten) und error (fehler).
 * Beim Verlassen der Seite oder bei neuer url wird die laufende Anfrage abgebrochen.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { useEffect, useState } from 'react';
import { fetchJSON } from '../utils/fetchJSON';

export interface UseFetchErgebnis<T> {
  daten: T | null;
  isLaden: boolean;
  fehler: string | null;
  neuLaden: () => void;
}

export function useFetch<T>(url: string): UseFetchErgebnis<T> {
  const [daten, setDaten] = useState<T | null>(null);
  const [isLaden, setIsLaden] = useState<boolean>(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [zaehler, setZaehler] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();

    const laden = async (): Promise<void> => {
      setIsLaden(true);
      setFehler(null);
      try {
        const ergebnis = await fetchJSON<T>(url, { signal: controller.signal });
        if (!controller.signal.aborted) setDaten(ergebnis);
      } catch (err) {
        if (controller.signal.aborted) return; // abgebrochen, kein State-Update mehr
        setFehler(err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden.');
      } finally {
        if (!controller.signal.aborted) setIsLaden(false);
      }
    };

    void laden();

    return () => controller.abort();
  }, [url, zaehler]);

  const neuLaden = (): void => setZaehler((z) => z + 1);

  return { daten, isLaden, fehler, neuLaden };
}
