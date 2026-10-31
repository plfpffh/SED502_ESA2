/**
 * klima.ts – Berechnung der Klimakennzahlen aus täglichen Lufttemperaturen
 *
 * Winter = Dezember bis Februar, zugehöriger Sommer = Juni bis August davor.
 * Fehlende Tage oder benötigte Temperaturwerte ergeben null statt unvollständiger Kennzahlen.
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import type { Klimakennzahlen } from '../typen/klima.ts';

/** Aufbereitete Tageswerte in °C. Das Datum hat das Format YYYY-MM-DD. */
export interface KlimaTag {
  datum: string;
  minimum: number | null;
  maximum: number | null;
  mittel: number | null;
}

/** Startjahr vom letzten abgeschlossenen Winter, Zeitzone: Europe/Vienna. */
export function letzterAbgeschlossenerWinter(heute = new Date()): number {
  const teile = new Intl.DateTimeFormat('de-AT', {
    timeZone: 'Europe/Vienna', year: 'numeric', month: 'numeric',
  }).formatToParts(heute);
  const jahr = Number(teile.find((teil) => teil.type === 'year')?.value);
  const monat = Number(teile.find((teil) => teil.type === 'month')?.value);
  return monat >= 3 ? jahr - 1 : jahr - 2;
}

/** Sammelt die Tage chronologisch. Das Ende des Zeitraums ist nicht enthalten. */
function tageImZeitraum(tage: Map<string, KlimaTag>, von: string, bis: string): KlimaTag[] | null {
  const ergebnis: KlimaTag[] = [];
  const datum = new Date(`${von}T00:00:00Z`);
  const ende = new Date(`${bis}T00:00:00Z`);

  while (datum < ende) {
    const tag = tage.get(datum.toISOString().slice(0, 10));
    if (!tag) return null;
    ergebnis.push(tag);
    datum.setUTCDate(datum.getUTCDate() + 1);
  }
  return ergebnis;
}

/**
 * startjahr 2025 steht für Winter 2025/26 und Sommer 2025.
 * Benötigt im Winter Minimum, Maximum und Mittel, im Sommer nur das Maximum.
 * Die Eingabe wird nicht verändert. Zusätzliche Tage außerhalb der Zeiträume werden ignoriert.
 */
export function berechneKlimakennzahlen(seeId: string, startjahr: number, tage: KlimaTag[]): Klimakennzahlen | null {
  const nachDatum = new Map(tage.map((tag) => [tag.datum, tag]));
  return kennzahlenFuerWinter(seeId, startjahr, nachDatum);
}

/** Wertet alle vollständigen Winter aus. */
export function berechneKlimatrend(
  seeId: string, startjahr: number, endjahr: number, tage: KlimaTag[],
): Klimakennzahlen[] {
  const nachDatum = new Map(tage.map((tag) => [tag.datum, tag]));
  const kennzahlen: Klimakennzahlen[] = [];
  for (let jahr = startjahr; jahr <= endjahr; jahr++) {
    const winter = kennzahlenFuerWinter(seeId, jahr, nachDatum);
    if (winter !== null) kennzahlen.push(winter);
  }
  return kennzahlen;
}

function kennzahlenFuerWinter(
  seeId: string, startjahr: number, nachDatum: Map<string, KlimaTag>,
): Klimakennzahlen | null {
  const winter = tageImZeitraum(nachDatum, `${startjahr}-12-01`, `${startjahr + 1}-03-01`);
  const sommer = tageImZeitraum(nachDatum, `${startjahr}-06-01`, `${startjahr}-09-01`);
  if (!winter || !sommer) return null;

  let frosttage = 0;
  let eistage = 0;
  let laengsteKaelteserie = 0;
  let aktuelleKaelteserie = 0;
  let kaeltesumme = 0;

  for (const { minimum, maximum, mittel } of winter) {
    if (minimum === null || maximum === null || mittel === null
      || !Number.isFinite(minimum) || !Number.isFinite(maximum) || !Number.isFinite(mittel)) return null;

    if (minimum < 0) frosttage++;
    if (maximum < 0) eistage++;
    if (mittel < 0) {
      aktuelleKaelteserie++;
      laengsteKaelteserie = Math.max(laengsteKaelteserie, aktuelleKaelteserie);
      kaeltesumme += mittel;
    } else {
      aktuelleKaelteserie = 0;
    }
  }

  let hitzetage = 0;
  for (const { maximum } of sommer) {
    if (maximum === null || !Number.isFinite(maximum)) return null;
    if (maximum >= 30) hitzetage++;
  }

  return {
    seeId,
    winter: `${startjahr}/${String(startjahr + 1).slice(-2)}`,
    frosttage,
    eistage,
    laengsteKaelteserie,
    kaeltesumme,
    hitzetage,
  };
}
