/**
 * useAI.ts – Verlauf, Streaming-Zustand und Fehler eines KI-Chats (Kompendium Modul 05, Abschnitt 4.1)
 *
 * Wie im Kompendium, mit drei Ergänzungen aus PLANUNG.md, Abschnitt 7:
 *  - abbrechen() beendet eine laufende Antwort (AbortController), der bisher empfangene Text bleibt stehen
 *  - jede Nachricht hat eine stabile id als React-Listenkey
 *  - Fehler werden mit beschreibeKiFehler() in verständliche Meldungen übersetzt
 * Wird von Christoph Hauser (Person B) in SeeDetail und KiBerater verwendet.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Nachricht } from '../typen/ai';
import type { UseAI } from '../typen/schnittstellen';
import { baueVerlauf, beschreibeKiFehler, chatStream } from '../utils/aiStream';

export const useAI: UseAI = (optionen = {}) => {
  const { systemPrompt, maxNachrichten = 20 } = optionen;

  const [nachrichten, setNachrichten] = useState<Nachricht[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Seite verlassen: laufende Antwort abbrechen
  useEffect(() => () => controllerRef.current?.abort(), []);

  const sendeNachricht = useCallback(
    async (inhalt: string): Promise<void> => {
      if (!inhalt.trim() || isStreaming) return;

      const frage: Nachricht = { id: crypto.randomUUID(), role: 'user', content: inhalt.trim() };
      const antwortId = crypto.randomUUID();
      const verlauf = baueVerlauf([...nachrichten, frage], systemPrompt, maxNachrichten);

      // leere Antwort vorbereiten, in die der Stream schreibt
      setNachrichten((alt) => [...alt, frage, { id: antwortId, role: 'assistant', content: '' }]);
      setFehler(null);
      setIsStreaming(true);

      const controller = new AbortController();
      controllerRef.current = controller;
      // eine Antwort ohne Text (Abbruch vor dem ersten Chunk, Fehler) wird entfernt, ein Teil der Antwort bleibt
      const beenden = (): void => {
        setNachrichten((alt) => alt.filter((n) => n.id !== antwortId || n.content !== ''));
        setIsStreaming(false);
      };

      await chatStream(
        verlauf,
        (text) =>
          setNachrichten((alt) => alt.map((n) => (n.id === antwortId ? { ...n, content: n.content + text } : n))),
        beenden,
        (err) => {
          setFehler(beschreibeKiFehler(err));
          beenden();
        },
        controller.signal,
      );
      if (controllerRef.current === controller) controllerRef.current = null;
    },
    [nachrichten, isStreaming, systemPrompt, maxNachrichten],
  );

  const abbrechen = useCallback((): void => {
    controllerRef.current?.abort();
  }, []);

  const zuruecksetzen = useCallback((): void => {
    controllerRef.current?.abort();
    setNachrichten([]);
    setFehler(null);
    setIsStreaming(false);
  }, []);

  return { nachrichten, isStreaming, fehler, sendeNachricht, abbrechen, zuruecksetzen };
};
