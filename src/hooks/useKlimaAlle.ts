/**
 * useKlimaAlle.ts – Klimakennzahlen des letzten abgeschlossenen Winters für alle Seen
 *
 * PLATZHALTER, damit die Seenliste den Eissport-Modus schon anzeigen kann: liefert noch keine Kennzahlen,
 * alle Seen zeigen deshalb „Wert aktuell nicht vorhanden“. Umsetzung mit Open-Meteo: Christoph Hauser (Person B),
 * siehe docs/PLANUNG.md, Abschnitt 5 und 6. Die Signatur steht in typen/schnittstellen.ts (UseKlimaAlle).
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser (Platzhalter: Peter Luckmann)
 */

import type { Klimakennzahlen } from '../typen/klima';
import type { UseKlimaAlle } from '../typen/schnittstellen';

// außerhalb des Hooks, damit useMemo in der Seenliste nicht bei jedem Rendern neu rechnet
const KEINE_KENNZAHLEN: Klimakennzahlen[] = [];

export const useKlimaAlle: UseKlimaAlle = () => ({
  kennzahlen: KEINE_KENNZAHLEN,
  isLaden: false,
  fehler: null,
  neuLaden: () => {},
});
