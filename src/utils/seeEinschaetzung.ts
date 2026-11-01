/**
 * seeEinschaetzung.ts – Daten für die KI-Einschätzung eines Sees
 *
 * Aufbereitete Messwerte und bereits berechnete Kennzahlen übermitteln.
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import type { SeeAnsicht } from '../typen/ansicht.ts';
import type { Klimakennzahlen } from '../typen/klima.ts';
import { letzterAbgeschlossenerWinter } from './klima.ts';

export function baueSeeEinschaetzung(
  see: SeeAnsicht, klima: Klimakennzahlen[], klimaFehler: string | null, heute = new Date(),
): string {
  const startjahr = letzterAbgeschlossenerWinter(heute);
  const winter = `${startjahr}/${String(startjahr + 1).slice(-2)}`;
  const historie = klima.filter((wert) => wert.seeId === see.id && wert.winter <= winter)
    .sort((a, b) => a.winter.localeCompare(b.winter));
  const daten = {
    see: see.name,
    bundeslaender: see.bundeslaender,
    wassertemperatur: {
      einheit: '°C',
      status: see.temperatur === null ? 'Keine Messwerte verfügbar' : 'Messwerte verfügbar',
      mittelwertVerfuegbarerMessstellen: see.temperatur,
      einordnung: see.badeEinschaetzung,
      messstellen: see.messstellen.map((messstelle) => ({
        name: messstelle.name,
        quelle: messstelle.quelle,
        temperatur: messstelle.temperatur,
        messzeitpunkt: messstelle.zeitpunkt ?? null,
        status: messstelle.temperatur === null ? 'Kein Messwert verfügbar, nicht schätzen' : 'Messwert verfügbar',
      })),
    },
    klima: {
      quelle: 'Open-Meteo, ERA5-Reanalysedaten der Lufttemperatur am Standort des Sees',
      status: historie.length === 0 ? 'Keine Klimakennzahlen verfügbar' : klimaFehler ? 'Teilweise verfügbar' : 'Verfügbar',
      hinweis: klimaFehler,
      winterDefinition: 'Dezember bis Februar. Hitzetage beziehen sich auf Juni bis August vor dem Winter.',
      letzterAbgeschlossenerWinter: winter,
      kennzahlenLetzterWinter: historie.find((wert) => wert.winter === winter) ?? null,
      frosttageProWinter: historie.map((wert) => ({ winter: wert.winter, frosttage: wert.frosttage })),
    },
  };

  return [
    'Erkläre die aktuellen Wassertemperaturen und die vorhandenen historischen Klimakennzahlen dieses Sees verständlich.',
    'Trenne aktuelle Wassertemperaturen von vergangenen Lufttemperaturen. Weise auf fehlende Messwerte und Datenlücken hin.',
    'Beschreibe den Frosttage-Verlauf vorsichtig, ohne zusätzliche Kennzahlen zu berechnen oder einen statistisch gesicherten Trend zu behaupten.',
    'Die Kälteserie ist die längste Folge mit Tagesmittel unter 0 °C innerhalb des angegebenen abgeschlossenen Winters.',
    'Aus der historischen Kälteserie lassen sich keine heutigen Eisbedingungen ableiten. Wetterprognosen, Eisdicke und offizielle Freigaben liegen hier nicht vor.',
    'Gib keine Freigabe zum Baden oder Eislaufen. Verwende einfachen Text ohne Markdown-Formatierung.',
    'Seedaten:',
    JSON.stringify(daten),
  ].join('\n');
}
