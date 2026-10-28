/**
 * seen.ts – Stammdaten der Seen (Datenschicht)
 *
 * 14 Seen mit ihren Messstellen. Die Wassertemperaturen kommen live über die Adapter in datenquellen/.
 * Darf nur von datenquellen/, hooks/ und utils/ gelesen werden.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann, Christoph Hauser
 */

import type { See } from '../typen/see';

/**
 * Fläche, Tiefe, Seehöhe: deutschsprachige Wikipedia (Infobox), abgerufen am 25.09.2026.
 * lat/lng: Seemitte, auf zwei Nachkommastellen gerundet (ca. 1 km), reicht für Karte und Open-Meteo.
 * Stationsnummern und Messstellen: gegen die Live-Daten geprüft am 28.10.2026
 *  - Hydris Salzburg (https://www.salzburg.gv.at/wasser/hydro/), Feld number
 *  - Hydrographischer Dienst Oberösterreich (https://hydro.ooe.gv.at/), Feld station_no
 */
export const seen: See[] = [
  {
    id: 'attersee',
    name: 'Attersee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 46.2,
    maxTiefeM: 169,
    seehoeheM: 469,
    lat: 47.87,
    lng: 13.54,
    stationen: [
      { quelle: 'Hydrographischer Dienst OÖ', nummer: '5290', messstelle: 'Kammer' },
      { quelle: 'Hydrographischer Dienst OÖ', nummer: '5210', messstelle: 'Unterach' },
      { quelle: 'Hydris Salzburg', nummer: '205328', messstelle: 'Unterach (Seepegel)' },
    ],
  },
  {
    id: 'traunsee',
    name: 'Traunsee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 24.35,
    maxTiefeM: 191,
    seehoeheM: 422,
    lat: 47.86,
    lng: 13.8,
    stationen: [{ quelle: 'Hydrographischer Dienst OÖ', nummer: '4510', messstelle: 'Ebensee (Landungssteg)' }],
  },
  {
    id: 'mondsee',
    name: 'Mondsee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 14.23,
    maxTiefeM: 66.6,
    seehoeheM: 481,
    lat: 47.82,
    lng: 13.38,
    stationen: [
      { quelle: 'Hydrographischer Dienst OÖ', nummer: '5020', messstelle: 'Limnologisches Institut' },
      { quelle: 'Hydris Salzburg', nummer: '205286', messstelle: 'Limnologisches Institut' },
    ],
  },
  {
    id: 'wolfgangsee',
    name: 'Wolfgangsee',
    bundeslaender: ['Salzburg', 'Oberösterreich'],
    flaecheKm2: 13.13,
    maxTiefeM: 112.9,
    seehoeheM: 538,
    lat: 47.74,
    lng: 13.44,
    stationen: [
      { quelle: 'Hydris Salzburg', nummer: '203646', messstelle: 'St. Gilgen (Seepegel)' },
      // 4320 ist die Ischl, nicht der See
      { quelle: 'Hydrographischer Dienst OÖ', nummer: '4310', messstelle: 'Strobl' },
    ],
  },
  {
    id: 'hallstaetter-see',
    name: 'Hallstätter See',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 8.55,
    maxTiefeM: 125,
    seehoeheM: 508,
    lat: 47.58,
    lng: 13.66,
    stationen: [
      { quelle: 'Hydrographischer Dienst OÖ', nummer: '4190', messstelle: 'Steeg (Bootshütte)' },
      { quelle: 'Hydrographischer Dienst OÖ', nummer: '4130', messstelle: 'Lahn' },
    ],
  },
  {
    id: 'wallersee',
    name: 'Wallersee',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 6.1,
    maxTiefeM: 23.3,
    seehoeheM: 505,
    lat: 47.91,
    lng: 13.18,
    stationen: [{ quelle: 'Hydris Salzburg', nummer: '203588', messstelle: 'Seepegel' }],
  },
  {
    id: 'obertrumer-see',
    name: 'Obertrumer See',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 4.88,
    maxTiefeM: 36,
    seehoeheM: 503,
    lat: 47.96,
    lng: 13.08,
    stationen: [{ quelle: 'Hydris Salzburg', nummer: '203612', messstelle: 'Obertrum (Seepegel)' }],
  },
  {
    id: 'zeller-see',
    name: 'Zeller See',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 4.55,
    maxTiefeM: 69.8,
    seehoeheM: 750,
    lat: 47.31,
    lng: 12.8,
    stationen: [{ quelle: 'Hydris Salzburg', nummer: '203117', messstelle: 'Zell am See (Seepegel)' }],
  },
  {
    id: 'mattsee',
    name: 'Mattsee',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 3.58,
    maxTiefeM: 42,
    seehoeheM: 503,
    lat: 47.97,
    lng: 13.12,
    stationen: [{ quelle: 'Hydris Salzburg', nummer: '203604', messstelle: 'Seepegel' }],
  },
  {
    id: 'irrsee',
    name: 'Irrsee (Zeller See)',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 3.55,
    maxTiefeM: 32,
    seehoeheM: 553,
    lat: 47.91,
    lng: 13.3,
    stationen: [{ quelle: 'Hydrographischer Dienst OÖ', nummer: '5005', messstelle: 'Zell am Moos' }],
  },
  {
    id: 'fuschlsee',
    name: 'Fuschlsee',
    bundeslaender: ['Salzburg'],
    flaecheKm2: 2.65,
    maxTiefeM: 67.3,
    seehoeheM: 663,
    lat: 47.8,
    lng: 13.28,
    stationen: [{ quelle: 'Hydris Salzburg', nummer: '203653', messstelle: 'Fuschl am See (Seepegel)' }],
  },
  {
    id: 'grabensee',
    name: 'Grabensee',
    bundeslaender: ['Salzburg', 'Oberösterreich'],
    flaecheKm2: 1.3,
    maxTiefeM: 14,
    seehoeheM: 503,
    lat: 47.99,
    lng: 13.09,
    stationen: [{ quelle: 'Hydris Salzburg', nummer: '204131', messstelle: 'Seepegel' }],
  },
  {
    id: 'almsee',
    name: 'Almsee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 0.85,
    maxTiefeM: 9,
    seehoeheM: 589,
    lat: 47.75,
    lng: 13.96,
    stationen: [{ quelle: 'Hydrographischer Dienst OÖ', nummer: '6120', messstelle: 'Almsee' }],
  },
  {
    id: 'holzoestersee',
    name: 'Holzöstersee',
    bundeslaender: ['Oberösterreich'],
    flaecheKm2: 0.09,
    maxTiefeM: 4.7,
    seehoeheM: 457,
    lat: 48.06,
    lng: 12.92,
    stationen: [{ quelle: 'Hydrographischer Dienst OÖ', nummer: '1230', messstelle: 'Holzöster' }],
  },
];
