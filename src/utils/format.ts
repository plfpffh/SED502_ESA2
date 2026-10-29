/**
 * format.ts – Zahlen, Temperaturen und Zeitpunkte für die Anzeige
 *
 * Fehlende Werte (null) werden nie als 0 angezeigt, sondern als „Wert aktuell nicht vorhanden“ (PLANUNG.md, Abschnitt 5).
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

export const NICHT_VORHANDEN = 'Wert aktuell nicht vorhanden';

const zahl = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 2 });
// feste Zeitzone, damit die Messzeit überall gleich angezeigt wird
const datumZeit = new Intl.DateTimeFormat('de-AT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Vienna' });

export function formatiereZahl(wert: number): string {
  return zahl.format(wert);
}

export function formatiereTemperatur(wert: number | null): string {
  return wert === null ? NICHT_VORHANDEN : `${zahl.format(wert)} °C`;
}

/** Längste Kälteserie: Tage am Stück mit Tagesmittel der Luft unter 0 °C. */
export function formatiereKaelteserie(tage: number | null): string {
  if (tage === null) {
    return NICHT_VORHANDEN;
  }
  return `${tage} ${tage === 1 ? 'Tag' : 'Tage'} am Stück unter 0 °C`;
}

/** ISO-Zeitstempel als Datum und Uhrzeit (Wien). */
export function formatiereZeitpunkt(iso: string): string {
  return datumZeit.format(new Date(iso));
}
