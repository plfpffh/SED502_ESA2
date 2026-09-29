/**
 * seen.ts – Seedaten (Datenschicht)
 *
 * Stammdaten und Momentaufnahme der Wassertemperaturen als Array.
 * Darf nur von der Logikschicht (utils/) gelesen werden.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

import type { See } from '../typen/see';

/**
 * Stammdaten: deutschsprachige Wikipedia (Infobox), abgerufen am 25.09.2026.
 * Wassertemperaturen: Momentaufnahme vom 25.09.2026, ca. 18:00 Uhr, aus
 *  - Hydris Salzburg (https://www.salzburg.gv.at/wasser/hydro/)
 *  - Hydrographischer Dienst Oberösterreich (https://hydro.ooe.gv.at/)
 *
 */
export const STAND_DER_MESSWERTE = '2026-09-25T18:00';

export const seen: See[] = [
  {
    id: 'attersee',
    name: 'Attersee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 46.2,
    maxTiefeM: 169,
    seehoeheM: 469,
    messwerte: [
      { messstelle: 'Kammer', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 19.8, zeitpunkt: '2026-09-25T17:45' },
      { messstelle: 'Unterach', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 19.3, zeitpunkt: '2026-09-25T17:45' },
      { messstelle: 'Unterach (Seepegel)', quelle: 'Hydris Salzburg', wassertemperatur: 19.4, zeitpunkt: '2026-09-25T17:00' },
    ],
  },
  {
    id: 'traunsee',
    name: 'Traunsee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 24.35,
    maxTiefeM: 191,
    seehoeheM: 422,
    messwerte: [
      { messstelle: 'Ebensee (Landungssteg)', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 17.2, zeitpunkt: '2026-09-25T17:30' },
    ],
  },
  {
    id: 'mondsee',
    name: 'Mondsee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 14.23,
    maxTiefeM: 66.6,
    seehoeheM: 481,
    messwerte: [
      { messstelle: 'Limnologisches Institut', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 19.5, zeitpunkt: '2026-09-25T17:30' },
      { messstelle: 'Limnologisches Institut', quelle: 'Hydris Salzburg', wassertemperatur: 19.6, zeitpunkt: '2026-09-25T16:30' },
    ],
  },
  {
    id: 'wolfgangsee',
    name: 'Wolfgangsee',
    bundeslaender: ['Salzburg', 'Oberösterreich'],
    flaecheKm2: 13.13,
    maxTiefeM: 112.9,
    seehoeheM: 538,
    messwerte: [
      { messstelle: 'St. Gilgen (Seepegel)', quelle: 'Hydris Salzburg', wassertemperatur: 18.4, zeitpunkt: '2026-09-25T18:00' },
      { messstelle: 'Strobl', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 16.9, zeitpunkt: '2026-09-25T17:30' },
    ],
  },
  {
    id: 'hallstaetter-see',
    name: 'Hallstätter See',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 8.55,
    maxTiefeM: 125,
    seehoeheM: 508,
    messwerte: [
      { messstelle: 'Steeg (Bootshütte)', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 15.8, zeitpunkt: '2026-09-25T16:45' },
      { messstelle: 'Lahn', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 15.2, zeitpunkt: '2026-09-25T18:00' },
    ],
  },
  {
    id: 'wallersee',
    name: 'Wallersee',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 6.1,
    maxTiefeM: 23.3,
    seehoeheM: 505,
    messwerte: [
      { messstelle: 'Seepegel', quelle: 'Hydris Salzburg', wassertemperatur: 19.3, zeitpunkt: '2026-09-25T18:00' },
    ],
  },
  {
    id: 'obertrumer-see',
    name: 'Obertrumer See',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 4.88,
    maxTiefeM: 36,
    seehoeheM: 503,
    messwerte: [
      { messstelle: 'Obertrum (Seepegel)', quelle: 'Hydris Salzburg', wassertemperatur: 19.1, zeitpunkt: '2026-09-25T18:00' },
    ],
  },
  {
    id: 'zeller-see',
    name: 'Zeller See',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 4.55,
    maxTiefeM: 69.8,
    seehoeheM: 750,
    messwerte: [
      { messstelle: 'Zell am See (Seepegel)', quelle: 'Hydris Salzburg', wassertemperatur: 18.0, zeitpunkt: '2026-09-25T18:00' },
    ],
  },
  {
    id: 'mattsee',
    name: 'Mattsee',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 3.58,
    maxTiefeM: 42,
    seehoeheM: 503,
    messwerte: [
      { messstelle: 'Seepegel', quelle: 'Hydris Salzburg', wassertemperatur: 19.7, zeitpunkt: '2026-09-25T18:00' },
    ],
  },
  {
    id: 'irrsee',
    name: 'Irrsee (Zeller See)',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 3.55,
    maxTiefeM: 32,
    seehoeheM: 553,
    messwerte: [
      { messstelle: 'Zell am Moos', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 20.0, zeitpunkt: '2026-09-25T17:30' },
    ],
  },
  {
    id: 'fuschlsee',
    name: 'Fuschlsee',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 2.65,
    maxTiefeM: 67.3,
    seehoeheM: 663,
    messwerte: [
      { messstelle: 'Fuschl am See (Seepegel)', quelle: 'Hydris Salzburg', wassertemperatur: 18.8, zeitpunkt: '2026-09-25T18:00' },
    ],
  },
  {
    id: 'grabensee',
    name: 'Grabensee',
    bundeslaender: ['Salzburg', 'Oberösterreich'],
    flaecheKm2: 1.3,
    maxTiefeM: 14,
    seehoeheM: 503,
    messwerte: [
      { messstelle: 'Seepegel', quelle: 'Hydris Salzburg', wassertemperatur: 18.8, zeitpunkt: '2026-09-25T18:00' },
    ],
  },
  {
    id: 'almsee',
    name: 'Almsee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 0.85,
    maxTiefeM: 9,
    seehoeheM: 589,
    messwerte: [
      { messstelle: 'Almsee', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 14.5, zeitpunkt: '2026-09-25T17:45' },
    ],
  },
  {
    id: 'holzoestersee',
    name: 'Holzöstersee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 0.09,
    maxTiefeM: 4.7,
    seehoeheM: 457,
    messwerte: [
      { messstelle: 'Holzöster', quelle: 'Hydrographischer Dienst OÖ', wassertemperatur: 21.3, zeitpunkt: '2026-09-25T17:45' },
    ],
  },
];
