/**
 * useBeraterAnfrage.ts – Anfrage an die KI für den KI-Berater: prüfen, Prompt bauen, senden, abbrechen
 *
 * Kapselt die Logik der Seite KiBerater (Kompendium Modul 04: Logik in Custom Hooks, Komponenten schlank halten).
 * Nutzt useAI für das Streaming und die gemeinsamen KI-Regeln als Systemprompt.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { useState } from 'react';
import type { BeraterDaten } from './useBeraterDaten';
import { useAI } from './useAI';
import { baueBeraterAnfrage, hatBeraterDaten } from '../utils/kiBerater';
import type { BeraterWunsch } from '../utils/kiBerater';
import { KI_REGELN } from '../utils/kiRegeln';

export interface BeraterAnfrage {
  anfrage: BeraterWunsch | null; // zuletzt gesendeter Wunsch, null vor der ersten Anfrage
  anfrageNummer: number; // zählt hoch, damit die Antwort pro Anfrage neu erscheint
  antwort: string;
  isStreaming: boolean;
  kiFehler: string | null;
  formularFehler: string | null;
  abgebrochen: boolean;
  anfordern: (wunsch: BeraterWunsch) => void;
  abbrechen: () => void;
}

export function useBeraterAnfrage(daten: BeraterDaten): BeraterAnfrage {
  const ki = useAI({ systemPrompt: KI_REGELN, maxNachrichten: 1 });
  const [anfrage, setAnfrage] = useState<BeraterWunsch | null>(null);
  const [anfrageNummer, setAnfrageNummer] = useState(0);
  const [formularFehler, setFormularFehler] = useState<string | null>(null);
  const [abgebrochen, setAbgebrochen] = useState(false);

  const anfordern = (wunsch: BeraterWunsch): void => {
    if (daten.isLaden || ki.isStreaming) return;
    setFormularFehler(null);
    if (!hatBeraterDaten(wunsch, daten.seen, daten.prognosen)) {
      setFormularFehler('Für diese Auswahl fehlen Messwerte und Prognosen.');
      return;
    }
    let prompt: string;
    try {
      // undefined: heute bleibt beim Standardwert, damit die Kälteserien als letztes Argument übergeben werden können
      prompt = baueBeraterAnfrage(wunsch, daten.seen, daten.prognosen, undefined, daten.kaelteserien);
    } catch (fehler) {
      setFormularFehler(fehler instanceof Error ? fehler.message : 'Bitte prüfe deine Eingaben.');
      return;
    }
    ki.zuruecksetzen();
    setAnfrage({ ...wunsch });
    setAnfrageNummer((nummer) => nummer + 1);
    setAbgebrochen(false);
    void ki.sendeNachricht(prompt);
  };

  const abbrechen = (): void => {
    setAbgebrochen(true);
    ki.abbrechen();
  };

  return {
    anfrage,
    anfrageNummer,
    antwort: ki.nachrichten.filter((nachricht) => nachricht.role === 'assistant').at(-1)?.content ?? '',
    isStreaming: ki.isStreaming,
    kiFehler: ki.fehler,
    formularFehler,
    abgebrochen,
    anfordern,
    abbrechen,
  };
}
