/**
 * seen.ts – Geschäftslogik (Logikschicht)
 *
 * Reine Funktionen ohne DOM-Zugriff: Umwandeln, Filtern, Sortieren, Auswerten.
 * Einzige Schicht, die auf daten/ zugreifen darf. Komponenten und Seiten dürfen nur SeeAnsicht-Objekte erhalten.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

import { seen, STAND_DER_MESSWERTE } from '../daten/seen';
import type { See } from '../typen/see';
import type { Auswahl, Filter, SeeAnsicht, Statistik, Tiefenkategorie } from '../typen/ansicht';

/** Mittelwert aller Messstellen eines Sees, auf eine Nachkommastelle gerundet. */
export function mittlereTemperatur(see: See): number | null {
  if (see.messwerte.length === 0) {
    return null;
  }
  const summe = see.messwerte.reduce((acc, m) => acc + m.wassertemperatur, 0);
  return Math.round((summe / see.messwerte.length) * 10) / 10;
}

/** Grobe Einteilung nach maximaler Tiefe. */
export function tiefenkategorie(see: See): Tiefenkategorie {
  if (see.maxTiefeM < 15) {
    return 'flach';
  }
  if (see.maxTiefeM < 70) {
    return 'mittel';
  }
  return 'tief';
}

/** Kurze Einordnung der Wassertemperatur für Badegäste. */
export function badeEinschaetzung(temperatur: number): string {
  if (temperatur >= 24) return 'warm';
  if (temperatur >= 20) return 'angenehm';
  if (temperatur >= 16) return 'frisch';
  return 'kalt';
}

/** Wandelt die Rohdaten eines Sees in die Form für die Anzeige um. */
export function zuAnsicht(see: See): SeeAnsicht {
  const temperatur = mittlereTemperatur(see);
  return {
    id: see.id,
    name: see.name,
    bundeslaender: see.bundeslaender,
    flaecheKm2: see.flaecheKm2,
    maxTiefeM: see.maxTiefeM,
    seehoeheM: see.seehoeheM,
    temperatur,
    badeEinschaetzung: temperatur === null ? null : badeEinschaetzung(temperatur),
    tiefenkategorie: tiefenkategorie(see),
    messstellen: see.messwerte.map((m) => ({ name: m.messstelle, quelle: m.quelle, temperatur: m.wassertemperatur })),
  };
}

function vergleiche(a: SeeAnsicht, b: SeeAnsicht, sortierung: Filter['sortierung']): number {
  switch (sortierung) {
    case 'temperatur':
      return (b.temperatur ?? 0) - (a.temperatur ?? 0);
    case 'tiefe':
      return b.maxTiefeM - a.maxTiefeM;
    case 'flaeche':
      return b.flaecheKm2 - a.flaecheKm2;
    case 'name':
      return a.name.localeCompare(b.name, 'de');
  }
}

/**
 * Prüft die Mindesttemperatur.
 * Seen ohne Messwert bleiben immer sichtbar, da unbekannt ist, ob sie den Filter erfüllen.
 */
function erfuelltTemperatur(see: SeeAnsicht, mindestTemperatur: Filter['mindestTemperatur']): boolean {
  if (mindestTemperatur === null || see.temperatur === null) {
    return true;
  }
  return see.temperatur >= mindestTemperatur;
}

/**
 * Wendet alle Filter an und liefert eine neue, sortierte Liste.
 * Seen ohne Messwert stehen unabhängig von der Sortierung immer am Ende.
 */
export function filtereSeen(alleSeen: SeeAnsicht[], filter: Filter): SeeAnsicht[] {
  const ohneWert = (see: SeeAnsicht): number => (see.temperatur === null ? 1 : 0);
  return alleSeen
    .filter((see) => filter.bundesland === 'alle' || see.bundeslaender.includes(filter.bundesland))
    .filter((see) => filter.tiefe === 'alle' || see.tiefenkategorie === filter.tiefe)
    .filter((see) => erfuelltTemperatur(see, filter.mindestTemperatur))
    .sort((a, b) => ohneWert(a) - ohneWert(b) || vergleiche(a, b, filter.sortierung));
}

/** Kennzahlen über die aktuell angezeigten Seen. */
export function berechneStatistik(auswahl: SeeAnsicht[]): Statistik {
  const mitTemperatur = auswahl.filter((see) => see.temperatur !== null);

  const waermsterSee = mitTemperatur.reduce<SeeAnsicht | null>((waermster, see) => {
    if (waermster === null) return see;
    return (see.temperatur ?? 0) > (waermster.temperatur ?? 0) ? see : waermster;
  }, null);

  const durchschnittsTemperatur =
    mitTemperatur.length === 0
      ? null
      : Math.round((mitTemperatur.reduce((acc, see) => acc + (see.temperatur ?? 0), 0) / mitTemperatur.length) * 10) /
        10;

  return {
    anzahl: auswahl.length,
    durchschnittsTemperatur,
    waermsterSee,
    gesamtFlaecheKm2: Math.round(auswahl.reduce((acc, see) => acc + see.flaecheKm2, 0) * 100) / 100,
  };
}

/** Schnittstelle für die GUI: gefilterte Seen samt Kennzahlen. */
export function waehleSeen(filter: Filter): Auswahl {
  const auswahl = filtereSeen(seen.map(zuAnsicht), filter);
  return {
    seen: auswahl,
    gesamtanzahl: seen.length,
    statistik: berechneStatistik(auswahl),
  };
}

/** Zeitpunkt der Messwerte als ISO-Datum. */
export function messzeitpunkt(): string {
  return STAND_DER_MESSWERTE;
}
