import assert from 'node:assert/strict';
import { test } from 'node:test';
import { baueVerlauf, beschreibeKiFehler, chatStream } from '../src/utils/aiStream.ts';
import { HttpFehler } from '../src/utils/fetchJSON.ts';
import type { Nachricht } from '../src/typen/ai.ts';

const frage: Nachricht = { id: '1', role: 'user', content: 'Wo kann ich baden?' };

function textAntwort(chunks: Uint8Array[]): Response {
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  }));
}

/** Ruft chatStream auf und sammelt, welche Callbacks mit was aufgerufen wurden. */
async function sammle(signal?: AbortSignal) {
  const ergebnis = { text: '', fertig: 0, fehler: null as Error | null };
  await chatStream([frage], (t) => { ergebnis.text += t; }, () => { ergebnis.fertig++; }, (f) => { ergebnis.fehler = f; }, signal);
  return ergebnis;
}

test('sendet nur role und content an /api/ki und setzt den Text zusammen', async (t) => {
  // „ü“ ist in UTF-8 zwei Bytes und hier auf zwei Chunks verteilt
  const bytes = new TextEncoder().encode('Grüß Gott');
  const abruf = t.mock.method(globalThis, 'fetch', async () => textAntwort([bytes.slice(0, 3), bytes.slice(3)]));
  const ergebnis = await sammle();

  assert.deepEqual(ergebnis, { text: 'Grüß Gott', fertig: 1, fehler: null });
  const [url, optionen] = abruf.mock.calls[0].arguments as [string, RequestInit];
  assert.equal(url, '/api/ki');
  assert.deepEqual(JSON.parse(String(optionen.body)), { nachrichten: [{ role: 'user', content: 'Wo kann ich baden?' }] });
});

test('Fehlerantwort von /api/ki: Meldung des Servers wird übernommen', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ fehler: 'Die KI ist gerade ausgelastet.' }, { status: 429 }));
  const ergebnis = await sammle();
  assert.ok(ergebnis.fehler instanceof HttpFehler);
  assert.equal(beschreibeKiFehler(ergebnis.fehler), 'Die KI ist gerade ausgelastet.');
  assert.equal(ergebnis.fertig, 0);
});

test('Abbrechen gilt nicht als Fehler', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => {
    controller.abort();
    throw new DOMException('Abgebrochen', 'AbortError');
  });
  const ergebnis = await sammle(controller.signal);
  assert.deepEqual(ergebnis, { text: '', fertig: 1, fehler: null });
});

test('beschreibeKiFehler: verständliche Meldungen je Fehlerart, nie roher Text', () => {
  assert.match(beschreibeKiFehler(new HttpFehler(429, 'HTTP Fehler 429')), /Zu viele Anfragen/);
  assert.match(beschreibeKiFehler(new HttpFehler(500, 'HTTP Fehler 500')), /nicht verfügbar/);
  assert.match(beschreibeKiFehler(new TypeError('Failed to fetch')), /Verbindung/);
  assert.doesNotMatch(beschreibeKiFehler(new Error('roher interner Text')), /roher/);
});

test('baueVerlauf: Systemanweisung vorne, Verlauf gekürzt, leere Antworten weg', () => {
  const verlauf: Nachricht[] = [
    { id: 'a', role: 'user', content: 'eins' },
    { id: 'b', role: 'assistant', content: '' },
    { id: 'c', role: 'user', content: 'zwei' },
    { id: 'd', role: 'assistant', content: 'drei' },
    { id: 'e', role: 'user', content: 'vier' },
  ];
  const ergebnis = baueVerlauf(verlauf, 'Regeln', 3);
  assert.deepEqual(ergebnis.map((n) => n.content), ['Regeln', 'zwei', 'drei', 'vier']);
  assert.equal(ergebnis[0].role, 'system');
  assert.deepEqual(baueVerlauf(verlauf, undefined, 1).map((n) => n.content), ['vier']);
});
