/**
 * fetchJSON.ts – generischer Wrapper um fetch() (Kompendium Modul 03, Abschnitt 4.4)
 *
 * Prüft antwort.ok und wirft bei HTTP-Fehlern einen HttpFehler mit Statuscode.
 * Liefert die Antwort eine verständliche Meldung im Feld fehler (so antworten unsere /api-Proxys), wird diese übernommen.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

/** Fehler bei einer HTTP-Antwort außerhalb von 200–299. */
export class HttpFehler extends Error {
  readonly status: number;

  constructor(status: number, meldung: string) {
    super(meldung);
    this.name = 'HttpFehler';
    this.status = status;
  }
}

/** Liest die Meldung aus einem Fehler-Body { fehler: string }, sonst null. */
async function meldungAusAntwort(antwort: Response): Promise<string | null> {
  try {
    const body: unknown = await antwort.json();
    if (body !== null && typeof body === 'object' && 'fehler' in body && typeof body.fehler === 'string') {
      return body.fehler;
    }
  } catch {
    // kein JSON, dann bleibt es bei der allgemeinen Meldung
  }
  return null;
}

/**
 * Lädt JSON von url. Der Typparameter beschreibt nur, was erwartet wird, geprüft wird er nicht.
 * Für Daten aus fremden Quellen deshalb fetchJSON<unknown>() verwenden und im Adapter prüfen.
 */
export async function fetchJSON<T>(url: string, optionen?: RequestInit): Promise<T> {
  const antwort = await fetch(url, optionen);

  if (!antwort.ok) {
    const meldung = (await meldungAusAntwort(antwort)) ?? `HTTP Fehler ${antwort.status}: ${antwort.statusText}`;
    throw new HttpFehler(antwort.status, meldung);
  }

  return antwort.json() as Promise<T>;
}
