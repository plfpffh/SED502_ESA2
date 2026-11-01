/** 7 Kalendertage */
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
