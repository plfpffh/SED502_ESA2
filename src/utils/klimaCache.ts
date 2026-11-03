/**
 * Erfolgreiche historische Kennzahlen und Frosttage-Verläufe 24 Stunden im Browser (localStorage) wiederverwenden,
 * um unnötige Open-Meteo-Abrufe zu vermeiden. Ohne Browserspeicher (Tests, gesperrt) wird einfach nichts gespeichert.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */
import type { See } from '../typen/see.ts';
import type { FrosttageWinter, Klimakennzahlen } from '../typen/klima.ts';

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

/** Schlüssel für die vollständigen Kennzahlen; Koordinaten und Seehöhe gehören dazu, damit Änderungen neu laden. */
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

/** Frosttage-Verlauf getrennt von den vollständigen Kennzahlen speichern (anderes Format). */
export function frosttageCacheSchluessel(see: See, startjahr: number, endjahr: number): string {
  return ['sed502-frosttage-v1', 'era5', see.id, see.lat, see.lng, see.seehoeheM, startjahr, endjahr].join(':');
}

function istFrosttageWinter(wert: unknown): wert is FrosttageWinter {
  if (wert === null || typeof wert !== 'object') return false;
  const eintrag = wert as Record<string, unknown>;
  return typeof eintrag.winter === 'string' && typeof eintrag.frosttage === 'number' && Number.isFinite(eintrag.frosttage);
}

export function liesKlimaCache(schluessel: string, speicher = browserSpeicher()): Klimakennzahlen[] | null {
  return liesEintraege(schluessel, istKennzahl, speicher);
}

export function liesFrosttageCache(schluessel: string, speicher = browserSpeicher()): FrosttageWinter[] | null {
  return liesEintraege(schluessel, istFrosttageWinter, speicher);
}

/** Gespeicherte Einträge oder null bei fehlendem, abgelaufenem (ab 24 h), zukünftig datiertem, leerem oder ungültigem Eintrag. */
function liesEintraege<T>(schluessel: string, istGueltig: (wert: unknown) => wert is T, speicher: Speicher | null): T[] | null {
  try {
    const text = speicher?.getItem(schluessel);
    if (!text) return null;
    const cache: unknown = JSON.parse(text);
    if (cache === null || typeof cache !== 'object') return null;
    const { zeitpunkt, kennzahlen } = cache as Record<string, unknown>;
    if (typeof zeitpunkt !== 'number' || !Number.isFinite(zeitpunkt)) return null;
    const alter = Date.now() - zeitpunkt;
    if (alter < 0 || alter >= GUELTIGKEIT) return null;
    return Array.isArray(kennzahlen) && kennzahlen.length > 0 && kennzahlen.every(istGueltig) ? kennzahlen : null;
  } catch {
    return null;
  }
}

export function speichereKlimaCache(schluessel: string, kennzahlen: Klimakennzahlen[], speicher = browserSpeicher()): void {
  speichereEintraege(schluessel, kennzahlen, speicher);
}

export function speichereFrosttageCache(schluessel: string, verlauf: FrosttageWinter[], speicher = browserSpeicher()): void {
  speichereEintraege(schluessel, verlauf, speicher);
}

function speichereEintraege(schluessel: string, eintraege: unknown[], speicher: Speicher | null): void {
  try {
    // Feldname kennzahlen bleibt für beide Arten, damit vorhandene Einträge lesbar bleiben
    speicher?.setItem(schluessel, JSON.stringify({ zeitpunkt: Date.now(), kennzahlen: eintraege }));
  } catch {
    // Falls das Zwischenspeichern fehlschlägt, sollen die geladenen Daten trotzdem angezeigt werden.
  }
}
