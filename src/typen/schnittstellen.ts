/**
 * Gemeinsame Funktionsverträge aus PLANUNG.md, Abschnitt 5.
 * Reine TypeScript-Typen: Hier werden keine Funktionen oder Hooks implementiert.
 * Beispiel für eine spätere Implementierung:
 *   export const zuSeeMessungen: ZuSeeMessungen = (roh, seen) => { ... };
 */
import type { See } from './see';
import type { SeeMessung } from './messung';
import type { Klimakennzahlen } from './klima';
import type { Auswahl, Filter, SeeAnsicht } from './ansicht';
import type { Nachricht } from './ai';
import type { SeePrognose } from './prognose';

/**
 * Beide Landesadapter: Stationen über Quelle und Stationsnummer zuordnen;
 * messstelle aus der zugeordneten Station übernehmen.
 * Fehlende Messwerte auslassen, falsches Format als Error melden.
 */
export type ZuSeeMessungen = (roh: unknown, seen: See[]) => SeeMessung[];

/** utils/fetchJSON.ts: HTTP-Status prüfen; die Adapter prüfen das Datenformat. */
export type FetchJSON = <T>(url: string, optionen?: RequestInit) => Promise<T>;

/** hooks/useFetch.ts */
export type UseFetch = <T>(url: string) => {
  daten: T | null;
  isLaden: boolean;
  fehler: string | null;
  neuLaden: () => void;
};

/** hooks/useSeeMessungen.ts: Quellen getrennt behandeln, neuLaden startet beide erneut. */
export type UseSeeMessungen = () => {
  messungen: SeeMessung[];
  isLaden: boolean;
  fehler: { salzburg: string | null; ooe: string | null };
  neuLaden: () => void;
};

/** utils/seen.ts: Klimawerte des letzten abgeschlossenen Winters für die Liste. */
export type WaehleSeen = (
  seen: See[],
  messungen: SeeMessung[],
  klima: Klimakennzahlen[],
  filter: Filter,
) => Auswahl;

/**
 * utils/seen.ts: Alle erwarteten Stationen darstellen, fehlende Werte als null.
 * laengsteKaelteserie zunächst auf null setzen; waehleSeen ergänzt den Klimawert.
 */
export type ZuAnsicht = (see: See, messungen: SeeMessung[]) => SeeAnsicht;

/** hooks/useKlimatrend.ts: Historie eines Sees für die Detailseite. */
export type UseKlimatrend = (see: See) => {
  kennzahlen: Klimakennzahlen[];
  isLaden: boolean;
  fehler: string | null;
  neuLaden: () => void;
};

/** hooks/useKlimaAlle.ts: Pro See nur den letzten abgeschlossenen Winter liefern. */
export type UseKlimaAlle = (seen: See[]) => {
  kennzahlen: Klimakennzahlen[];
  isLaden: boolean;
  fehler: string | null;
  neuLaden: () => void;
};

/** hooks/usePrognose.ts: Sieben Tage Lufttemperatur für den KI-Berater. */
export type UsePrognose = (seen: See[]) => {
  prognosen: SeePrognose[];
  isLaden: boolean;
  fehler: string | null;
  neuLaden: () => void;
};

/** utils/aiStream.ts: Liest den Stream des eigenen /api/ki-Endpunkts. */
export type ChatStream = (
  nachrichten: Nachricht[],
  onChunk: (text: string) => void,
  onFertig: () => void,
  onFehler: (fehler: Error) => void,
  signal?: AbortSignal,
) => Promise<void>;

/** hooks/useAI.ts */
export type UseAI = (optionen?: { systemPrompt?: string; maxNachrichten?: number }) => {
  nachrichten: Nachricht[];
  isStreaming: boolean;
  fehler: string | null;
  sendeNachricht: (inhalt: string) => Promise<void>;
  abbrechen: () => void;
  zuruecksetzen: () => void;
};
