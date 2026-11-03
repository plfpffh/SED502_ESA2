/**
 * KI-Proxy: Leitet einen Chatverlauf an Google Gemini weiter und streamt die Antwort als reinen Text zurück.
 * Der API-Key (GEMINI_API_KEY) wird nur hier gelesen und verlässt nie den Server (README: Warum der API-Key nicht im Browser liegt).
 *
 * Anfrage:  POST /api/ki  { nachrichten: { role: 'system' | 'user' | 'assistant', content: string }[] }
 * Antwort:  text/plain, Stück für Stück, sobald Gemini liefert. Fehler vor dem Stream als JSON { fehler }.
 * Gemini antwortet mit Server-Sent Events (streamGenerateContent?alt=sse), daraus wird hier nur der Text gelesen.
 * So bleiben utils/aiStream.ts und hooks/useAI.ts unabhängig vom Anbieter.
 * Format der Gemini-API geprüft am 29.10.2026 (https://ai.google.dev/api/generate-content).
 *
 * Kosten begrenzen: höchstens MAX_NACHRICHTEN Nachrichten und MAX_ZEICHEN Zeichen pro Anfrage,
 * die Länge der Antwort begrenzt MAX_AUSGABE_TOKENS. Der Browser kann diese Grenzen nicht ändern.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

// kostenloses Kontingent laut https://aistudio.google.com/docs/pricing (29.10.2026). Flash Lite erlaubt 500 Anfragen pro Tag,
// gemini-3.6-flash nur 20 (Limits in AI Studio). gemini-2.5-flash gibt es für neue Keys nicht mehr.
export const STANDARD_MODELL = 'gemini-3.5-flash-lite';
export const MAX_NACHRICHTEN = 21; // Systemanweisung plus 20 Nachrichten Verlauf (maxNachrichten in useAI)
export const MAX_ZEICHEN = 20_000;
const MAX_AUSGABE_TOKENS = 2048;
const MAX_BODY_BYTES = 64 * 1024;

type Rolle = 'system' | 'user' | 'assistant';

export interface KiNachricht {
  role: Rolle;
  content: string;
}

/** Anfrage im Format der Gemini-API (generateContent). */
export interface GeminiAnfrage {
  systemInstruction?: { parts: { text: string }[] };
  contents: { role: 'user' | 'model'; parts: { text: string }[] }[];
  generationConfig: { maxOutputTokens: number };
}

/** Fehler mit HTTP-Status und einer Meldung, die Nutzer*innen angezeigt werden darf. */
class AnfrageFehler extends Error {
  readonly status: number;

  constructor(status: number, meldung: string) {
    super(meldung);
    this.status = status;
  }
}

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert);
}

/** Prüft den Body der Anfrage. Daten aus dem Browser sind nicht vertrauenswürdig. */
export function pruefeAnfrage(body: unknown): KiNachricht[] {
  const nachrichten = istObjekt(body) ? body.nachrichten : undefined;
  if (!Array.isArray(nachrichten) || nachrichten.length === 0 || nachrichten.length > MAX_NACHRICHTEN) {
    throw new AnfrageFehler(400, 'Die Anfrage an die KI ist ungültig.');
  }
  const geprueft = nachrichten.map((n: unknown): KiNachricht => {
    if (!istObjekt(n) || typeof n.content !== 'string' || !['system', 'user', 'assistant'].includes(String(n.role))) {
      throw new AnfrageFehler(400, 'Die Anfrage an die KI ist ungültig.');
    }
    return { role: n.role as Rolle, content: n.content };
  });
  if (geprueft.reduce((summe, n) => summe + n.content.length, 0) > MAX_ZEICHEN) {
    throw new AnfrageFehler(413, 'Die Anfrage an die KI ist zu lang. Bitte den Verlauf zurücksetzen.');
  }
  if (geprueft.at(-1)?.role !== 'user') {
    throw new AnfrageFehler(400, 'Die Anfrage an die KI ist ungültig.');
  }
  return geprueft;
}

/** Übersetzt den Verlauf in das Gemini-Format: system wird zur systemInstruction, assistant heißt dort model. */
export function zuGeminiAnfrage(nachrichten: KiNachricht[]): GeminiAnfrage {
  const system = nachrichten.filter((n) => n.role === 'system').map((n) => ({ text: n.content }));
  const verlauf = nachrichten.filter((n) => n.role !== 'system');
  // Gemini erwartet, dass der Verlauf mit einer Nachricht der Nutzer*in beginnt
  const start = verlauf.findIndex((n) => n.role === 'user');
  return {
    ...(system.length > 0 ? { systemInstruction: { parts: system } } : {}),
    contents: verlauf.slice(start).map((n) => ({
      role: n.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: n.content }],
    })),
    generationConfig: { maxOutputTokens: MAX_AUSGABE_TOKENS },
  };
}

// finishReason-Werte, mit denen Gemini eine Antwort aus Sicherheits- oder Urheberrechtsgründen abbricht
const BLOCKIER_GRUENDE = new Set(['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'RECITATION']);

export interface GeminiEreignis {
  text: string; // Text aus candidates[0].content.parts[].text ohne Denk-Teile (thought), sonst ''
  blockiert: boolean;
}

/** Liest Text und Blockierung aus einem SSE-Ereignis von Gemini. Kaputte Ereignisse ergeben leeren Text. */
export function leseEreignis(daten: string): GeminiEreignis {
  let ereignis: unknown;
  try {
    ereignis = JSON.parse(daten);
  } catch {
    return { text: '', blockiert: false };
  }
  const kandidat = istObjekt(ereignis) && Array.isArray(ereignis.candidates) ? ereignis.candidates[0] : undefined;
  const inhalt = istObjekt(kandidat) ? kandidat.content : undefined;
  const teile = istObjekt(inhalt) && Array.isArray(inhalt.parts) ? inhalt.parts : [];
  const text = teile
    .filter((teil): teil is Record<string, unknown> => istObjekt(teil) && typeof teil.text === 'string' && teil.thought !== true)
    .map((teil) => teil.text as string)
    .join('');
  // blockiert: entweder die ganze Anfrage (promptFeedback.blockReason, dann ohne candidates) oder die Antwort (finishReason)
  const feedback = istObjekt(ereignis) ? ereignis.promptFeedback : undefined;
  const blockiert =
    (istObjekt(feedback) && typeof feedback.blockReason === 'string') ||
    (istObjekt(kandidat) && BLOCKIER_GRUENDE.has(String(kandidat.finishReason)));
  return { text, blockiert };
}

/** Verständliche Meldung je nach Status von Gemini; der rohe Fehlertext der API wird nie weitergegeben. */
export function fehlerVonGemini(status: number): AnfrageFehler {
  if (status === 429) {
    return new AnfrageFehler(429, 'Die KI ist gerade ausgelastet (zu viele Anfragen). Bitte in einer Minute erneut versuchen.');
  }
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    // ungültiger Key oder unbekanntes Modell: ein Konfigurationsproblem auf unserer Seite
    return new AnfrageFehler(503, 'Die KI ist gerade nicht verfügbar (Konfiguration). Bitte später erneut versuchen.');
  }
  return new AnfrageFehler(502, 'Die KI ist gerade nicht erreichbar. Bitte später erneut versuchen.');
}

/**
 * Liest den JSON-Body. Auf Vercel ist er bereits als request.body gelesen,
 * im Vite-Dev-Server (vite-plugin-api.ts) wird er hier aus dem Stream gelesen.
 * MAX_BODY_BYTES greift nur im Dev-Server, auf Vercel gilt das Limit der Plattform. MAX_NACHRICHTEN und
 * MAX_ZEICHEN prüft pruefeAnfrage in beiden Fällen.
 */
async function leseBody(request: IncomingMessage): Promise<unknown> {
  const vorab = (request as IncomingMessage & { body?: unknown }).body;
  if (vorab !== undefined) {
    return typeof vorab === 'string' ? JSON.parse(vorab) : vorab;
  }
  // erst alle Bytes sammeln, dann dekodieren: ein Umlaut kann auf zwei Datenblöcke verteilt sein
  const teile: Buffer[] = [];
  let bytes = 0;
  for await (const teil of request) {
    const puffer = Buffer.isBuffer(teil) ? teil : Buffer.from(String(teil));
    bytes += puffer.length;
    if (bytes > MAX_BODY_BYTES) throw new AnfrageFehler(413, 'Die Anfrage an die KI ist zu lang.');
    teile.push(puffer);
  }
  return JSON.parse(Buffer.concat(teile).toString('utf8'));
}

function sendeFehler(response: ServerResponse, status: number, meldung: string): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify({ fehler: meldung }));
}

/** Hinweis am Ende einer Antwort, die Gemini mittendrin abgebrochen hat, damit sie nicht vollständig wirkt. */
export const ABBRUCH_HINWEIS = '\n\n(Die KI hat die Antwort an dieser Stelle abgebrochen.)';

/**
 * Liest den SSE-Stream von Gemini und schreibt nur den Text in die Antwort.
 * Blockiert Gemini, bevor Text geschrieben wurde, gibt es einen Fehler (422) statt einer leeren Antwort.
 * Blockiert Gemini mitten in der Antwort, endet sie mit dem bisherigen Text und ABBRUCH_HINWEIS.
 * Kommt gar kein Text (z.B. Tokenlimit schon beim Nachdenken erreicht), gibt es einen Fehler (502).
 */
async function streameText(quelle: ReadableStream<Uint8Array>, response: ServerResponse): Promise<void> {
  const decoder = new TextDecoder();
  let puffer = '';
  let geschrieben = false;

  /** Verarbeitet eine SSE-Zeile; true, wenn die Antwort damit endet. */
  const verarbeite = (zeile: string): boolean => {
    if (!zeile.startsWith('data:')) return false;
    const { text, blockiert } = leseEreignis(zeile.slice(5).trim());
    if (text) {
      response.write(text);
      geschrieben = true;
    }
    if (!blockiert) return false;
    if (!geschrieben) {
      throw new AnfrageFehler(422, 'Die KI hat diese Anfrage nicht beantwortet (vom Anbieter blockiert). Bitte die Frage anders formulieren.');
    }
    response.write(ABBRUCH_HINWEIS);
    return true;
  };

  for await (const teil of quelle) {
    puffer += decoder.decode(teil, { stream: true });
    // ein Chunk kann mitten in einer Zeile enden: die letzte, unvollständige Zeile bleibt im Puffer
    const zeilen = puffer.split('\n');
    puffer = zeilen.pop() ?? '';
    for (const zeile of zeilen) {
      if (verarbeite(zeile)) return;
    }
  }
  // letzte Zeile ohne abschließenden Zeilenumbruch nicht verlieren
  puffer += decoder.decode();
  if (verarbeite(puffer)) return;
  if (!geschrieben) {
    throw new AnfrageFehler(502, 'Die KI hat keine Antwort geliefert. Bitte erneut versuchen.');
  }
}

export default async function ki(request: IncomingMessage, response: ServerResponse): Promise<void> {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendeFehler(response, 405, 'Die KI kann nur mit POST angefragt werden.');
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendeFehler(response, 503, 'Die KI ist nicht eingerichtet (GEMINI_API_KEY fehlt).');
    return;
  }

  // bricht der Browser ab (z.B. „Abbrechen“), wird auch die Anfrage an Gemini abgebrochen
  const abbruch = new AbortController();
  response.on('close', () => {
    if (!response.writableFinished) abbruch.abort();
  });

  try {
    let nachrichten: KiNachricht[];
    try {
      nachrichten = pruefeAnfrage(await leseBody(request));
    } catch (fehler: unknown) {
      throw fehler instanceof AnfrageFehler ? fehler : new AnfrageFehler(400, 'Die Anfrage an die KI ist ungültig.');
    }

    const modell = process.env.GEMINI_MODEL || STANDARD_MODELL;
    const antwort = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modell)}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(zuGeminiAnfrage(nachrichten)),
        signal: AbortSignal.any([abbruch.signal, AbortSignal.timeout(60_000)]),
      },
    );
    if (!antwort.ok || !antwort.body) {
      // Details nur im Server-Log, nie an den Browser
      console.error(`[api/ki] Gemini antwortet mit HTTP ${antwort.status}`);
      throw fehlerVonGemini(antwort.status);
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    await streameText(antwort.body, response);
    response.end();
  } catch (fehler: unknown) {
    if (abbruch.signal.aborted) return; // Browser hat abgebrochen, niemand wartet mehr auf eine Antwort
    if (response.headersSent) {
      // mitten im Stream: Verbindung schließen, damit der Browser den Abbruch als Fehler erkennt
      response.destroy();
      return;
    }
    if (fehler instanceof AnfrageFehler) {
      sendeFehler(response, fehler.status, fehler.message);
      return;
    }
    const timeout = fehler instanceof Error && fehler.name === 'TimeoutError';
    sendeFehler(response, timeout ? 504 : 502, timeout
      ? 'Die KI braucht zu lange für eine Antwort. Bitte erneut versuchen.'
      : 'Die KI ist gerade nicht erreichbar. Bitte später erneut versuchen.');
  }
}
