import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { test } from 'node:test';
import { apiMiddleware, funktionsname, type Handler } from '../vite-plugin-api.ts';

function antwortAufzeichnen() {
  let body = '';
  const response = {
    statusCode: 200,
    headersSent: false,
    setHeader() {},
    end(inhalt = '') { body = inhalt; },
  } as unknown as ServerResponse;
  return { response, daten: (): unknown => JSON.parse(body) };
}

async function aufrufen(url: string, laden: (name: string) => Promise<Handler | null>) {
  const antwort = antwortAufzeichnen();
  let weitergereicht = false;
  await apiMiddleware(laden)({ url } as IncomingMessage, antwort.response, () => { weitergereicht = true; });
  return { ...antwort, weitergereicht };
}

test('Funktionsname wird aus der URL gelesen, Pfade außerhalb von api/ sind ausgeschlossen', () => {
  assert.equal(funktionsname('/api/hydris-salzburg'), 'hydris-salzburg');
  assert.equal(funktionsname('/api/ki?stream=1'), 'ki');
  assert.equal(funktionsname('/api/hydro-ooe/'), 'hydro-ooe');
  for (const url of ['/api/', '/api/../vite.config', '/api/a/b', '/api/Gross', '/api/%2e%2e', '/seen']) {
    assert.equal(funktionsname(url), null, url);
  }
});

test('Anfragen außerhalb von /api/ gehen unverändert an Vite weiter', async () => {
  const ergebnis = await aufrufen('/seen', async () => assert.fail('darf nicht laden'));
  assert.equal(ergebnis.weitergereicht, true);
});

test('ruft den Handler der passenden Datei auf', async () => {
  const geladen: string[] = [];
  const ergebnis = await aufrufen('/api/hydris-salzburg', async (name) => {
    geladen.push(name);
    return (_request, response) => { response.statusCode = 200; response.end('[]'); };
  });
  assert.deepEqual(geladen, ['hydris-salzburg']);
  assert.equal(ergebnis.response.statusCode, 200);
  assert.equal(ergebnis.weitergereicht, false);
});

test('unbekannte oder ungültige Funktion liefert 404 wie auf Vercel', async () => {
  for (const url of ['/api/gibt-es-nicht', '/api/../geheim']) {
    const ergebnis = await aufrufen(url, async () => null);
    assert.equal(ergebnis.response.statusCode, 404);
    assert.deepEqual(ergebnis.daten(), { fehler: 'Unbekannte API-Funktion.' });
  }
});

test('Fehler im Handler liefert 500 ohne technische Details', async (t) => {
  t.mock.method(console, 'error', () => {});
  const ergebnis = await aufrufen('/api/ki', async () => () => { throw new Error('GEMINI_API_KEY=geheim'); });
  assert.equal(ergebnis.response.statusCode, 500);
  assert.deepEqual(ergebnis.daten(), { fehler: 'Interner Fehler im lokalen API-Server.' });
});
