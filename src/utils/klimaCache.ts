/** Erfolgreiche historische Kennzahlen 24 Stunden lokal wiederverwenden um unnötige API-Aufrufe zu vermeiden. */
import type { See } from '../typen/see.ts';
import type { Klimakennzahlen } from '../typen/klima.ts';

type Speicher = Pick<Storage, 'getItem' | 'setItem'>;
const GUELTIGKEIT = 24 * 60 * 60 * 1000;

function browserSpeicher(): Speicher | null {
  try {
    const umgebung = globalThis as { window?: { localStorage: Speicher } };
    return umgebung.window?.localStorage ?? null;
  } catch {
    return null; // Die Webanwendung soll auch bei gesperrtem Browserspeicher funktionieren.
  }
}

export function klimaCacheSchluessel(see: See, startjahr: number, endjahr: number): string {
  return ['sed502-klima-v1', 'era5', see.id, see.lat, see.lng, see.seehoeheM, startjahr, endjahr].join(':');
}

function istKennzahl(wert: unknown): wert is Klimakennzahlen {
  if (wert === null || typeof wert !== 'object') return false;
  const eintrag = wert as Record<string, unknown>;
  return typeof eintrag.seeId === 'string' && typeof eintrag.winter === 'string'
    && ['frosttage', 'eistage', 'laengsteKaelteserie', 'kaeltesumme', 'hitzetage']
      .every((feld) => typeof eintrag[feld] === 'number' && Number.isFinite(eintrag[feld]));
}

export function liesKlimaCache(schluessel: string, speicher = browserSpeicher()): Klimakennzahlen[] | null {
  try {
    const text = speicher?.getItem(schluessel);
    if (!text) return null;
    const cache: unknown = JSON.parse(text);
    if (cache === null || typeof cache !== 'object') return null;
    const { zeitpunkt, kennzahlen } = cache as Record<string, unknown>;
    if (typeof zeitpunkt !== 'number' || !Number.isFinite(zeitpunkt)) return null;
    const alter = Date.now() - zeitpunkt;
    if (alter < 0 || alter >= GUELTIGKEIT) return null;
    return Array.isArray(kennzahlen) && kennzahlen.length > 0 && kennzahlen.every(istKennzahl) ? kennzahlen : null;
  } catch {
    return null;
  }
}

export function speichereKlimaCache(schluessel: string, kennzahlen: Klimakennzahlen[], speicher = browserSpeicher()): void {
  try {
    speicher?.setItem(schluessel, JSON.stringify({ zeitpunkt: Date.now(), kennzahlen }));
  } catch {
    // Falls das Zwischenspeichern fehlschlägt, sollen die geladenen Daten trotzdem angezeigt werden.
  }
}
