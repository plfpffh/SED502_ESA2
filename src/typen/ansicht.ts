/**
 * ansicht.ts – Datenmodell der Logikschicht
 *
 * Typen, mit denen die Logikschicht nach oben (Komponenten und Seiten) kommuniziert.
 * Beschreibt Filtereinstellungen und aufbereitete Daten für die Darstellung.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

import type { Bundesland, Datenquelle } from './see.ts';

export type Tiefenkategorie = 'flach' | 'mittel' | 'tief';

export type Aktivitaet = 'baden' | 'eissport';

export type Sortierung = 'name' | 'temperatur' | 'tiefe' | 'flaeche' | 'kaelteserie';

/** Filtereinstellungen aus dem Formular. */
export interface Filter {
  bundesland: Bundesland | 'alle';
  tiefe: Tiefenkategorie | 'alle';
  sortierung: Sortierung;
  aktivitaet: Aktivitaet;
  mindestTemperatur: number | null; // nur Baden, null = alle
  mindestKaeltetage: number | null; // nur Eissport, null = alle
}

/** Messwert einer Messstelle, wie er angezeigt wird. */
export interface MessstelleAnsicht {
  name: string;
  quelle: Datenquelle;
  temperatur: number | null; // °C, null = kein Messwert
  zeitpunkt?: string | null; // ISO-Zeitstempel, null oder fehlend = nicht vorhanden
}

/** Ein See mit allen für die Anzeige berechneten Werten. */
export interface SeeAnsicht {
  id: string;
  name: string;
  bundeslaender: Bundesland[];
  flaecheKm2: number;
  maxTiefeM: number;
  seehoeheM: number;
  temperatur: number | null; // Mittelwert aller Messstellen
  badeEinschaetzung: string | null;
  tiefenkategorie: Tiefenkategorie;
  laengsteKaelteserie: number | null; // letzter abgeschlossener Winter; null = keine Klimadaten
  messstellen: MessstelleAnsicht[];
}

/** Kennzahlen über eine Auswahl von Seen. */
export interface Statistik {
  anzahl: number;
  durchschnittsTemperatur: number | null;
  waermsterSee: SeeAnsicht | null;
  gesamtFlaecheKm2: number;
}

/** Ergebnis einer Filterung: gefilterte Seen plus Kennzahlen. */
export interface Auswahl {
  seen: SeeAnsicht[];
  gesamtanzahl: number;
  statistik: Statistik;
}
