/**
 * vite-plugin-api.ts – führt die Serverless Functions aus api/ im Vite-Dev-Server aus
 *
 * Auf Vercel läuft jede Datei in api/ als eigene Funktion. `npm run dev` startet aber nur Vite,
 * ohne dieses Plugin antworten /api/... lokal mit 404. Das Plugin lädt pro Anfrage die passende Datei
 * über Vite (TypeScript ohne Build, Änderungen sofort wirksam) und ruft ihren Default-Export
 * wie Vercel mit (request, response) auf.
 * Variablen aus .env ohne VITE_-Präfix (z.B. GEMINI_API_KEY) landen nur in process.env des Dev-Servers,
 * nie im Browser-Bundle. Nur für die Entwicklung, auf den Build hat das Plugin keine Wirkung.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { loadEnv, type Plugin } from 'vite';

export type Handler = (request: IncomingMessage, response: ServerResponse) => unknown;

/**
 * Funktionsname aus der URL, z.B. '/api/hydris-salzburg?x=1' → 'hydris-salzburg'.
 * Nur Kleinbuchstaben, Ziffern und Bindestrich, damit keine anderen Dateien erreichbar sind.
 */
export function funktionsname(url: string): string | null {
  const treffer = /^\/api\/([a-z0-9-]+)\/?(?:\?.*)?$/.exec(url);
  return treffer ? treffer[1] : null;
}

function sendeFehler(response: ServerResponse, status: number, fehler: string): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify({ fehler }));
}

/** Middleware für /api/*. laden liefert den Handler zu einem Namen oder null, wenn es die Funktion nicht gibt. */
export function apiMiddleware(laden: (name: string) => Promise<Handler | null>) {
  return async (request: IncomingMessage, response: ServerResponse, weiter: () => void): Promise<void> => {
    const url = request.url ?? '';
    if (!url.startsWith('/api/')) {
      weiter();
      return;
    }
    const name = funktionsname(url);
    try {
      const handler = name === null ? null : await laden(name);
      if (handler === null) {
        sendeFehler(response, 404, 'Unbekannte API-Funktion.');
        return;
      }
      await handler(request, response);
    } catch (fehler) {
      // Details nur in der Konsole des Dev-Servers, nicht im Browser
      console.error(`[api] ${name}:`, fehler);
      if (response.headersSent) {
        response.end();
      } else {
        sendeFehler(response, 500, 'Interner Fehler im lokalen API-Server.');
      }
    }
  };
}

export default function apiFunktionen(): Plugin {
  return {
    name: 'api-funktionen',
    apply: 'serve',
    configureServer(server) {
      const { mode, root } = server.config;
      for (const [schluessel, wert] of Object.entries(loadEnv(mode, root, ''))) {
        if (!schluessel.startsWith('VITE_') && process.env[schluessel] === undefined) {
          process.env[schluessel] = wert;
        }
      }

      const apiOrdner = path.resolve(root, 'api');
      const middleware = apiMiddleware(async (name) => {
        const datei = path.join(apiOrdner, `${name}.ts`);
        if (!existsSync(datei)) return null;
        const modul = await server.ssrLoadModule(datei);
        return typeof modul.default === 'function' ? (modul.default as Handler) : null;
      });
      server.middlewares.use((request, response, weiter) => void middleware(request, response, weiter));
    },
  };
}
