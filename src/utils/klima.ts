/**
 * klima.ts – Berechnung der Klimakennzahlen aus täglichen Lufttemperaturen
 *
 * Winter = Dezember bis Februar, zugehöriger Sommer = Juni bis August davor.
 * Fehlende Tage oder benötigte Temperaturwerte ergeben null bzw. lassen den Winter aus, statt unvollständige
 * Kennzahlen zu liefern. Ausnahme: Die aktuelle Kälteserie endet an einer Lücke (lieber zu wenige Tage).
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import type { FrosttageWinter, Klimakennzahlen } from '../typen/klima.ts';

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

/** Gestern in Österreich (YYYY-MM-DD): der letzte Tag, dessen Tagesmittel feststeht. */
export function gesternInWien(heute = new Date()): string {
  // formatToParts statt fertigem String: das Format einer Locale kann sich zwischen ICU-Versionen ändern
  const teile = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(heute);
  const wert = (typ: string): string => teile.find((teil) => teil.type === typ)?.value ?? '';
  const datum = new Date(`${wert('year')}-${wert('month')}-${wert('day')}T00:00:00Z`);
  datum.setUTCDate(datum.getUTCDate() - 1);
  return datum.toISOString().slice(0, 10);
}

/**
 * Tage am Stück bis einschließlich bis mit Tagesmittel unter 0 °C, rückwärts gezählt.
 * Fehlt der Wert für bis selbst, ist die Serie unbekannt (null). Eine Lücke weiter zurück beendet die Zählung:
 * lieber zu wenige Tage als eine geschätzte Serie.
 */
export function berechneAktuelleKaelteserie(tage: KlimaTag[], bis: string): number | null {
  const mittelAm = (datum: string): number | null => {
    const mittel = tage.find((tag) => tag.datum === datum)?.mittel;
    return mittel === undefined || mittel === null || !Number.isFinite(mittel) ? null : mittel;
  };
  if (mittelAm(bis) === null) return null;
  let serie = 0;
  const datum = new Date(`${bis}T00:00:00Z`);
  for (let mittel = mittelAm(bis); mittel !== null && mittel < 0; mittel = mittelAm(datum.toISOString().slice(0, 10))) {
    serie++;
    datum.setUTCDate(datum.getUTCDate() - 1);
  }
  return serie;
}

/** Sammelt die Tage chronologisch, null wenn ein Tag fehlt. Das Ende des Zeitraums ist nicht enthalten. */
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

/**
 * Alle Kennzahlen für jeden Winter von startjahr bis endjahr, für den Winter und Sommer davor vollständig sind.
 * In der App nicht mehr verwendet (die Detailseite lädt den Verlauf nur mit Tagesminimum), weiter getestet.
 */
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

/**
 * Frosttage aller vollständigen Winter (Dezember bis Februar), nur aus dem Tagesminimum.
 * Winter mit fehlenden Tagen oder Werten fehlen im Ergebnis, statt mit zu wenigen Frosttagen zu erscheinen.
 */
export function berechneFrosttageVerlauf(startjahr: number, endjahr: number, tage: KlimaTag[]): FrosttageWinter[] {
  const nachDatum = new Map(tage.map((tag) => [tag.datum, tag]));
  const verlauf: FrosttageWinter[] = [];
  for (let jahr = startjahr; jahr <= endjahr; jahr++) {
    const winter = tageImZeitraum(nachDatum, `${jahr}-12-01`, `${jahr + 1}-03-01`);
    if (!winter || winter.some(({ minimum }) => minimum === null || !Number.isFinite(minimum))) continue;
    verlauf.push({
      winter: `${jahr}/${String(jahr + 1).slice(-2)}`,
      frosttage: winter.filter(({ minimum }) => (minimum as number) < 0).length,
    });
  }
  return verlauf;
}

/** Fehlende Winter mit null füllen. */
export function frosttageVerlauf(
  frosttage: FrosttageWinter[], startjahr: number, endjahr: number,
): { winter: string; frosttage: number | null }[] {
  const nachWinter = new Map(frosttage.map((wert) => [wert.winter, wert.frosttage]));
  const verlauf: { winter: string; frosttage: number | null }[] = [];
  for (let jahr = startjahr; jahr <= endjahr; jahr++) {
    const winter = `${jahr}/${String(jahr + 1).slice(-2)}`;
    verlauf.push({ winter, frosttage: nachWinter.get(winter) ?? null });
  }
  return verlauf;
}

/** Kennzahlen für Winter startjahr/startjahr+1 und Sommer startjahr, null bei fehlenden Tagen oder Werten. */
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
