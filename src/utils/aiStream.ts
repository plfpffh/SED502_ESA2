/**
 * aiStream.ts – liest die Antwort von /api/ki Chunk für Chunk (Kompendium Modul 05, Abschnitt 3.2)
 *
 * Abweichung vom Kompendium: Der Browser ruft nicht die LLM-API direkt auf, sondern den eigenen Endpunkt /api/ki.
 * Der API-Key bleibt dadurch auf dem Server. /api/ki liefert bereits reinen Text, deshalb wird hier kein
 * anbieterspezifisches SSE-Format gelesen.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

// mit Endung, weil auch die Tests (Node) diese Datei laden
import type { Nachricht } from '../typen/ai.ts';
import type { ChatStream } from '../typen/schnittstellen.ts';
import { HttpFehler } from './fetchJSON.ts';

/** Liest die Meldung { fehler } aus einer Fehlerantwort von /api/ki, sonst null. */
async function meldungAusAntwort(antwort: Response): Promise<string | null> {
  try {
    const body: unknown = await antwort.json();
    if (body !== null && typeof body === 'object' && 'fehler' in body && typeof body.fehler === 'string') {
      return body.fehler;
    }
  } catch {
    // kein JSON
  }
  return null;
}

/**
 * Sendet den Verlauf an /api/ki und gibt jeden empfangenen Textteil an onChunk weiter.
 * Ein Abbruch über signal (Button „Abbrechen“) gilt nicht als Fehler, sondern beendet die Antwort mit onFertig.
 */
export const chatStream: ChatStream = async (nachrichten, onChunk, onFertig, onFehler, signal) => {
  try {
    const antwort = await fetch('/api/ki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // an die API gehen nur role und content, nicht die id aus dem lokalen Verlauf
      body: JSON.stringify({ nachrichten: nachrichten.map(({ role, content }) => ({ role, content })) }),
      signal,
    });
    if (!antwort.ok) {
      throw new HttpFehler(antwort.status, (await meldungAusAntwort(antwort)) ?? `HTTP Fehler ${antwort.status}`);
    }

    const reader = antwort.body?.getReader();
    if (!reader) throw new Error('Kein Stream verfügbar.');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // stream: true, damit Umlaute, die auf zwei Chunks verteilt sind, richtig dekodiert werden
      const text = decoder.decode(value, { stream: true });
      if (text) onChunk(text);
    }
    onFertig();
  } catch (fehler: unknown) {
    if (signal?.aborted) {
      onFertig();
      return;
    }
    onFehler(fehler instanceof Error ? fehler : new Error('Unbekannter Fehler.'));
  }
};

/**
 * Übersetzt einen Fehler in eine verständliche Meldung (Kompendium Modul 05, Abschnitt 6.3).
 * Meldungen von /api/ki sind bereits verständlich und werden übernommen, rohe Fehlertexte nie.
 */
export function beschreibeKiFehler(fehler: Error): string {
  if (fehler instanceof HttpFehler) {
    if (fehler.message.startsWith('HTTP Fehler')) {
      return fehler.status === 429
        ? 'Zu viele Anfragen. Bitte einen Moment warten und erneut versuchen.'
        : 'Die KI ist gerade nicht verfügbar. Bitte später erneut versuchen.';
    }
    return fehler.message;
  }
  if (fehler instanceof TypeError) {
    // fetch() wirft TypeError, wenn keine Verbindung besteht oder der Stream abreißt
    return 'Die Verbindung zur KI ist unterbrochen. Bitte die Internetverbindung prüfen und erneut versuchen.';
  }
  return 'Bei der Antwort der KI ist ein Fehler aufgetreten. Bitte erneut versuchen.';
}

/**
 * Baut den Verlauf für die Anfrage: optional die Systemanweisung, dann die letzten maxNachrichten Nachrichten.
 * Leere Nachrichten (z.B. eine abgebrochene Antwort ohne Text) werden nicht mitgeschickt.
 */
export function baueVerlauf(verlauf: Nachricht[], systemPrompt: string | undefined, maxNachrichten: number): Nachricht[] {
  const gekuerzt = verlauf.filter((n) => n.content.trim() !== '').slice(-maxNachrichten);
  return systemPrompt ? [{ id: 'system', role: 'system', content: systemPrompt }, ...gekuerzt] : gekuerzt;
}
