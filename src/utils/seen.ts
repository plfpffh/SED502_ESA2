/**
 * seen.ts – Geschäftslogik (Logikschicht)
 *
 * Reine Funktionen ohne DOM-Zugriff: Umwandeln, Filtern, Sortieren, Auswerten.
 * Stammdaten, Messungen und Klimakennzahlen kommen als Parameter, die Funktionen laden nichts selbst.
 * Komponenten und Seiten dürfen nur SeeAnsicht-Objekte erhalten.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

// mit Endung, weil auch die Tests (Node) diese Datei laden
import type { See } from '../typen/see.ts';
import type { SeeMessung } from '../typen/messung.ts';
import type { Klimakennzahlen } from '../typen/klima.ts';
import type { Auswahl, Filter, MessstelleAnsicht, SeeAnsicht, Statistik, Tiefenkategorie } from '../typen/ansicht.ts';

/** Mittelwert aller Messungen eines Sees, auf eine Nachkommastelle gerundet. */
export function mittlereTemperatur(messungen: SeeMessung[]): number | null {
  if (messungen.length === 0) {
    return null;
  }
  const summe = messungen.reduce((acc, m) => acc + m.wassertemperatur, 0);
  return Math.round((summe / messungen.length) * 10) / 10;
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

/**
 * Wandelt Stammdaten und Messungen eines Sees in die Form für die Anzeige um.
 * Alle Stationen aus den Stammdaten erscheinen, ohne Messung mit Temperatur und Zeitpunkt null.
 * messungen darf alle Seen enthalten, zugeordnet wird über seeId, quelle und messstelle.
 * laengsteKaelteserie bleibt null, waehleSeen ergänzt sie aus den Klimakennzahlen.
 */
export function zuAnsicht(see: See, messungen: SeeMessung[]): SeeAnsicht {
  const eigene = messungen.filter((m) => m.seeId === see.id);
  const messstellen: MessstelleAnsicht[] = see.stationen.map((station) => {
    const messung = eigene.find((m) => m.quelle === station.quelle && m.messstelle === station.messstelle);
    return {
      name: station.messstelle,
      quelle: station.quelle,
      temperatur: messung?.wassertemperatur ?? null,
      zeitpunkt: messung?.zeitpunkt ?? null,
    };
  });
  const temperatur = mittlereTemperatur(
    eigene.filter((m) => see.stationen.some((s) => s.quelle === m.quelle && s.messstelle === m.messstelle)),
  );
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
    laengsteKaelteserie: null,
    messstellen,
  };
}

/** Absteigend vergleichen, fehlende Werte (null) ans Ende. */
function absteigend(a: number | null, b: number | null): number {
  if (a === null || b === null) {
    return (a === null ? 1 : 0) - (b === null ? 1 : 0);
  }
  return b - a;
}

function vergleiche(a: SeeAnsicht, b: SeeAnsicht, sortierung: Filter['sortierung']): number {
  switch (sortierung) {
    case 'temperatur':
      return absteigend(a.temperatur, b.temperatur);
    case 'kaelteserie':
      return absteigend(a.laengsteKaelteserie, b.laengsteKaelteserie);
    case 'tiefe':
      return b.maxTiefeM - a.maxTiefeM;
    case 'flaeche':
      return b.flaecheKm2 - a.flaecheKm2;
    case 'name':
      return a.name.localeCompare(b.name, 'de');
  }
}

/** Der Wert, nach dem im jeweiligen Modus gefiltert wird: Wassertemperatur oder Kälteserie. */
function wertFuerAktivitaet(see: SeeAnsicht, aktivitaet: Filter['aktivitaet']): number | null {
  return aktivitaet === 'baden' ? see.temperatur : see.laengsteKaelteserie;
}

/**
 * Prüft den Mindestwert des aktiven Modus (Baden: Temperatur, Eissport: Kältetage am Stück).
 * Seen ohne Wert bleiben immer sichtbar, da unbekannt ist, ob sie den Filter erfüllen.
 */
function erfuelltMindestwert(see: SeeAnsicht, filter: Filter): boolean {
  const mindestwert = filter.aktivitaet === 'baden' ? filter.mindestTemperatur : filter.mindestKaeltetage;
  const wert = wertFuerAktivitaet(see, filter.aktivitaet);
  if (mindestwert === null || wert === null) {
    return true;
  }
  return wert >= mindestwert;
}

/**
 * Wendet alle Filter an und liefert eine neue, sortierte Liste.
 * Seen ohne Wert für den aktiven Modus stehen unabhängig von der Sortierung immer am Ende.
 */
export function filtereSeen(alleSeen: SeeAnsicht[], filter: Filter): SeeAnsicht[] {
  const ohneWert = (see: SeeAnsicht): number => (wertFuerAktivitaet(see, filter.aktivitaet) === null ? 1 : 0);
  return alleSeen
    .filter((see) => filter.bundesland === 'alle' || see.bundeslaender.includes(filter.bundesland))
    .filter((see) => filter.tiefe === 'alle' || see.tiefenkategorie === filter.tiefe)
    .filter((see) => erfuelltMindestwert(see, filter))
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

/**
 * Längste Kälteserie des letzten Winters eines Sees.
 * useKlimaAlle liefert nur den letzten Winter; falls doch mehrere vorliegen, zählt der jüngste.
 */
function kaelteserie(seeId: string, klima: Klimakennzahlen[]): number | null {
  const letzter = klima
    .filter((k) => k.seeId === seeId)
    .reduce<Klimakennzahlen | null>((juengster, k) => (juengster === null || k.winter > juengster.winter ? k : juengster), null);
  return letzter?.laengsteKaelteserie ?? null;
}

/** Schnittstelle für die GUI: gefilterte Seen samt Kennzahlen. */
export function waehleSeen(seen: See[], messungen: SeeMessung[], klima: Klimakennzahlen[], filter: Filter): Auswahl {
  const auswahl = filtereSeen(
    seen.map((see) => ({ ...zuAnsicht(see, messungen), laengsteKaelteserie: kaelteserie(see.id, klima) })),
    filter,
  );
  return {
    seen: auswahl,
    gesamtanzahl: seen.length,
    statistik: berechneStatistik(auswahl),
  };
}
