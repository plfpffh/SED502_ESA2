/**
 * prognose.ts – die Tage, für die der KI-Berater eine Wetterprognose anbietet
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

/** Heute und die sechs folgenden Kalendertage in Wien, als YYYY-MM-DD. */
export function prognoseTage(heute = new Date()): string[] {
  const teile = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(heute);
  const wert = (typ: string): string => teile.find((teil) => teil.type === typ)?.value ?? '';
  const datum = new Date(`${wert('year')}-${wert('month')}-${wert('day')}T00:00:00Z`);
  return Array.from({ length: 7 }, () => {
    const tag = datum.toISOString().slice(0, 10);
    datum.setUTCDate(datum.getUTCDate() + 1);
    return tag;
  });
}
