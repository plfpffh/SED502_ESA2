import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { test } from 'node:test';
import ki, { fehlerVonGemini, MAX_NACHRICHTEN, MAX_ZEICHEN, pruefeAnfrage, textAusEreignis, zuGeminiAnfrage } from '../api/ki.ts';

// Ausschnitt eines SSE-Ereignisses von streamGenerateContent?alt=sse
const ereignis = (text: string): string =>
  `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text }] } }] })}\r\n\r\n`;

function sseAntwort(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { status, headers: { 'Content-Type': 'text/event-stream' } });
}

function antwortAufzeichnen() {
  const headers = new Map<string, string>();
  let body = '';
  const response = {
    statusCode: 200,
    headersSent: false,
    writableFinished: false,
    setHeader(name: string, value: string) { headers.set(name, value); },
    on() { return response; },
    write(inhalt: string) { body += inhalt; return true; },
    end(inhalt?: string) { body += inhalt ?? ''; },
    destroy() {},
  } as unknown as ServerResponse;
  return { response, headers, body: (): string => body };
}

const anfrage = (body: unknown, method = 'POST'): IncomingMessage => ({ method, body }) as unknown as IncomingMessage;

test('pruefeAnfrage übernimmt nur role und content', () => {
  const ergebnis = pruefeAnfrage({ nachrichten: [{ id: 'x', role: 'user', content: 'Hallo', extra: 1 }] });
  assert.deepEqual(ergebnis, [{ role: 'user', content: 'Hallo' }]);
});

test('pruefeAnfrage weist ungültige, zu lange und zu viele Nachrichten zurück', () => {
  const user = { role: 'user', content: 'x' };
  for (const body of [null, {}, { nachrichten: [] }, { nachrichten: [{ role: 'admin', content: 'x' }] },
    { nachrichten: [{ role: 'user', content: 3 }] }, { nachrichten: [{ role: 'assistant', content: 'x' }] }]) {
    assert.throws(() => pruefeAnfrage(body), /ungültig/);
  }
  assert.throws(() => pruefeAnfrage({ nachrichten: Array(MAX_NACHRICHTEN + 1).fill(user) }), /ungültig/);
  assert.throws(() => pruefeAnfrage({ nachrichten: [{ role: 'user', content: 'x'.repeat(MAX_ZEICHEN + 1) }] }), /zu lang/);
});

test('zuGeminiAnfrage: system wird systemInstruction, assistant wird model, Verlauf beginnt mit user', () => {
  const anfrage = zuGeminiAnfrage([
    { role: 'system', content: 'Regeln' },
    { role: 'assistant', content: 'abgeschnittene Antwort' },
    { role: 'user', content: 'Frage' },
    { role: 'assistant', content: 'Antwort' },
    { role: 'user', content: 'Nachfrage' },
  ]);
  assert.deepEqual(anfrage.systemInstruction, { parts: [{ text: 'Regeln' }] });
  assert.deepEqual(anfrage.contents.map((c) => c.role), ['user', 'model', 'user']);
  assert.ok(anfrage.generationConfig.maxOutputTokens > 0);
});

test('textAusEreignis liest den Text und überspringt Gedanken und kaputte Ereignisse', () => {
  assert.equal(textAusEreignis(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hallo' }] } }] })), 'Hallo');
  assert.equal(textAusEreignis(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'intern', thought: true }] } }] })), '');
  assert.equal(textAusEreignis('{kaputt'), '');
  assert.equal(textAusEreignis(JSON.stringify({ usageMetadata: {} })), '');
});

test('fehlerVonGemini gibt nie rohe API-Texte weiter', () => {
  assert.equal(fehlerVonGemini(429).status, 429);
  assert.equal(fehlerVonGemini(403).status, 503);
  assert.equal(fehlerVonGemini(500).status, 502);
  assert.match(fehlerVonGemini(429).message, /zu viele Anfragen/);
});

test('ohne API-Key: 503 mit verständlicher Meldung, kein Aufruf bei Gemini', async (t) => {
  delete process.env.GEMINI_API_KEY;
  const abruf = t.mock.method(globalThis, 'fetch', async () => sseAntwort([]));
  const antwort = antwortAufzeichnen();
  await ki(anfrage({ nachrichten: [{ role: 'user', content: 'Hallo' }] }), antwort.response);
  assert.equal(antwort.response.statusCode, 503);
  assert.equal(abruf.mock.callCount(), 0);
});

test('GET wird mit 405 abgelehnt', async () => {
  const antwort = antwortAufzeichnen();
  await ki(anfrage(undefined, 'GET'), antwort.response);
  assert.equal(antwort.response.statusCode, 405);
});

test('streamt nur den Text, auch wenn ein Ereignis auf zwei Chunks verteilt ist', async (t) => {
  process.env.GEMINI_API_KEY = 'test-key';
  t.after(() => delete process.env.GEMINI_API_KEY);
  const teil = ereignis('Grüß ');
  const abruf = t.mock.method(globalThis, 'fetch', async () =>
    sseAntwort([teil.slice(0, 20), teil.slice(20), ereignis('Gott!')]));
  const antwort = antwortAufzeichnen();
  await ki(anfrage({ nachrichten: [{ role: 'user', content: 'Hallo' }] }), antwort.response);

  assert.equal(antwort.body(), 'Grüß Gott!');
  assert.equal(antwort.headers.get('Content-Type'), 'text/plain; charset=utf-8');
  const [url, optionen] = abruf.mock.calls[0].arguments as [string, RequestInit];
  assert.match(url, /:streamGenerateContent\?alt=sse$/);
  assert.equal((optionen.headers as Record<string, string>)['x-goog-api-key'], 'test-key');
});

test('Fehler von Gemini wird als verständliche JSON-Meldung weitergegeben', async (t) => {
  process.env.GEMINI_API_KEY = 'test-key';
  t.after(() => delete process.env.GEMINI_API_KEY);
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: { message: 'Quota exceeded for ...' } }, { status: 429 }));
  const antwort = antwortAufzeichnen();
  await ki(anfrage({ nachrichten: [{ role: 'user', content: 'Hallo' }] }), antwort.response);
  assert.equal(antwort.response.statusCode, 429);
  assert.doesNotMatch(antwort.body(), /Quota/);
  assert.match(antwort.body(), /zu viele Anfragen/);
});
