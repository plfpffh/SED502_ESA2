/**
 * hydroOoe.ts – Adapter für die Antwort von /api/hydro-ooe
 *
 * PLATZHALTER: liefert noch keine Messungen, damit useSeeMessungen schon beide Quellen einbinden kann.
 * Umsetzung: Christoph Hauser (Person B) nach dem Vertrag ZuSeeMessungen (typen/schnittstellen.ts),
 * Vorbild ist datenquellen/hydrisSalzburg.ts. Bis dahin erscheinen die OÖ-Messstellen ohne Wert.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

// mit Endung, weil auch die Tests (Node) diese Datei laden
import type { ZuSeeMessungen } from '../typen/schnittstellen.ts';

export const zuSeeMessungenOoe: ZuSeeMessungen = () => [];
