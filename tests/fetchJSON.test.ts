import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchJSON, HttpFehler } from '../src/utils/fetchJSON.ts';

test('liefert die JSON-Antwort und reicht url und Optionen an fetch weiter', async (t) => {
  const abruf = t.mock.method(globalThis, 'fetch', async () => Response.json([{ id: 1 }]));
  const signal = new AbortController().signal;
  const daten = await fetchJSON<{ id: number }[]>('/api/test', { signal });
  assert.deepEqual(daten, [{ id: 1 }]);
  assert.equal(abruf.mock.calls[0].arguments[0], '/api/test');
  assert.equal(abruf.mock.calls[0].arguments[1]?.signal, signal);
});

test('übernimmt bei HTTP-Fehlern die Meldung aus dem Feld fehler', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ fehler: 'Die Messwerte aus Salzburg sind gerade nicht verfügbar.' }, { status: 502 }),
  );
  await assert.rejects(fetchJSON('/api/test'), (fehler: unknown) => {
    assert.ok(fehler instanceof HttpFehler);
    assert.equal(fehler.status, 502);
    assert.equal(fehler.message, 'Die Messwerte aus Salzburg sind gerade nicht verfügbar.');
    return true;
  });
});

test('meldet Status und Statustext, wenn der Fehler-Body keine Meldung enthält', async (t) => {
  for (const antwort of [
    new Response('kein JSON', { status: 500, statusText: 'Internal Server Error' }),
    Response.json({ unerwartet: true }, { status: 404, statusText: 'Not Found' }),
  ]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => antwort);
    await assert.rejects(fetchJSON('/api/test'), {
      name: 'HttpFehler',
      message: `HTTP Fehler ${antwort.status}: ${antwort.statusText}`,
    });
    mock.mock.restore();
  }
});

test('Netzwerkfehler werden unverändert weitergegeben', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(fetchJSON('/api/test'), { name: 'TypeError', message: 'Failed to fetch' });
});
