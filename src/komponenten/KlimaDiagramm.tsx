/**
 * KlimaDiagramm.tsx – Frosttage pro abgeschlossenem Winter
 *
 * Das Diagramm erhält die fertigen Kennzahlen.
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import { useId } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Klimakennzahlen } from '../typen/klima';
import { frosttageVerlauf, letzterAbgeschlossenerWinter } from '../utils/klima';

interface KlimaDiagrammProps {
  seeName: string;
  kennzahlen: Klimakennzahlen[];
}

export default function KlimaDiagramm({ seeName, kennzahlen }: KlimaDiagrammProps): React.JSX.Element {
  const id = useId();
  const daten = frosttageVerlauf(kennzahlen, 1950, letzterAbgeschlossenerWinter());

  if (kennzahlen.length === 0) return <p>Für diesen See sind keine Klimadaten verfügbar.</p>;

  return (
    <figure className="klimadiagramm" aria-labelledby={`${id}-titel`} aria-describedby={`${id}-hinweis`}>
      <figcaption id={`${id}-titel`}>Frosttage pro Winter – {seeName}</figcaption>
      <p id={`${id}-hinweis`}>
        Ein Tag gilt als Frosttag, wenn er ein Tagesminimum der Lufttemperatur unter 0 °C aufweist. Der Winter umfasst Dezember bis Februar.
        Fehlende Werte erscheinen als Lücke.
      </p>

      <div className="klimadiagramm__grafik">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={daten} accessibilityLayer title={`Frosttage pro Winter – ${seeName}`} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--rand)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="winter"
              tickFormatter={(winter: string) => winter.slice(0, 4)}
              minTickGap={32}
              interval="preserveStartEnd"
              height={44}
              label={{ value: 'Winter (Startjahr)', position: 'insideBottom', offset: 0, fill: 'var(--text-leise)', fontSize: 12 }}
            />
            <YAxis allowDecimals={false} domain={[0, 100]} width={36} />
            <Tooltip
              formatter={(wert) => `${wert} Tage`}
              labelFormatter={(winter) => `Winter ${winter}`}
              contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--rand)', color: 'var(--text)' }}
              labelStyle={{ color: 'var(--text)' }}
            />
            <Line
              type="linear"
              dataKey="frosttage"
              name="Frosttage"
              stroke="var(--akzent)"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="klimadiagramm__hinweis">Für die Bedienung des Diagramms mit der Tastatur: Mit Tab ins Diagramm wechseln und mit den Pfeiltasten navigieren.</p>
      <details>
        <summary>Frosttage als Tabelle anzeigen</summary>
        <div className="klimadiagramm__tabelle" role="region" aria-label={`Frosttage-Tabelle für ${seeName}`} tabIndex={0}>
          <table>
            <caption>Frosttage pro Winter – {seeName}</caption>
            <thead>
              <tr><th scope="col">Winter</th><th scope="col">Frosttage</th></tr>
            </thead>
            <tbody>
              {daten.map((punkt) => (
                <tr key={punkt.winter}>
                  <th scope="row">{punkt.winter}</th>
                  <td>{punkt.frosttage ?? 'Wert aktuell nicht vorhanden'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="klimadiagramm__hinweis">
        Daten: <a href="https://open-meteo.com/en/docs/historical-weather-api">Open-Meteo</a> (ERA5-Reanalysedaten).
      </p>
    </figure>
  );
}
