/**
 * Gemeinsame Funktionsverträge (README: Vorgehen in der Gruppe).
 * Reine TypeScript-Typen: Hier werden keine Funktionen oder Hooks implementiert.
 * Beispiel für eine spätere Implementierung:
 *   export const zuSeeMessungen: ZuSeeMessungen = (roh, seen) => { ... };
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser, Peter Luckmann
 */
import type { See } from './see.ts';
import type { SeeMessung } from './messung.ts';
import type { AktuelleKaelteserie, FrosttageWinter, Klimakennzahlen } from './klima.ts';
import type { Auswahl, Filter, SeeAnsicht } from './ansicht.ts';
import type { Nachricht } from './ai.ts';
import type { SeePrognose } from './prognose.ts';

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

/** utils/seen.ts: aktuelle Kälteserien (bis gestern) für den Eissport-Modus der Liste. */
export type WaehleSeen = (
  seen: See[],
  messungen: SeeMessung[],
  kaelteserien: AktuelleKaelteserie[],
  filter: Filter,
) => Auswahl;

/**
 * utils/seen.ts: Alle erwarteten Stationen darstellen, fehlende Werte als null.
 * kaelteserie zunächst auf null setzen; waehleSeen ergänzt die aktuelle Kälteserie.
 */
export type ZuAnsicht = (see: See, messungen: SeeMessung[]) => SeeAnsicht;

/**
 * hooks/useKlimatrend.ts: Historie eines Sees für die Detailseite.
 * kennzahlen: vollständige Kennzahlen des letzten abgeschlossenen Winters; frosttage: Verlauf ab 1950.
 */
export type UseKlimatrend = (see: See) => {
  kennzahlen: Klimakennzahlen[];
  frosttage: FrosttageWinter[];
  isLaden: boolean;
  fehler: string | null;
  neuLaden: () => void;
};

/** hooks/useKaelteserien.ts: aktuelle Kälteserie bis gestern für alle Seen (Eissport-Modus der Seenliste). */
export type UseKaelteserien = (seen: See[]) => {
  kaelteserien: AktuelleKaelteserie[];
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
