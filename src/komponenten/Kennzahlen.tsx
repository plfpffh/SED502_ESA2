/**
 * Kennzahlen.tsx – Kennzahlen der aktuell angezeigten Seen
 *
 * Heißt nicht Statistik, um nicht mit dem gleichnamigen Typ aus typen/ansicht.ts verwechselt zu werden.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import type { Statistik } from '../typen/ansicht';
import { formatiereZahl } from '../utils/format';

interface KennzahlenProps {
  statistik: Statistik;
}

export default function Kennzahlen({ statistik }: KennzahlenProps): React.JSX.Element {
  const durchschnitt =
    statistik.durchschnittsTemperatur === null ? '–' : `${formatiereZahl(statistik.durchschnittsTemperatur)} °C`;

  return (
    <section aria-labelledby="kennzahlen-titel">
      <h2 id="kennzahlen-titel">Kennzahlen der Auswahl</h2>
      <dl className="kennzahlen">
        <div>
          <dt>Seen</dt>
          <dd>{statistik.anzahl}</dd>
        </div>
        <div>
          <dt>Ø Wassertemperatur</dt>
          <dd>{durchschnitt}</dd>
        </div>
        <div>
          <dt>Wärmster See</dt>
          <dd>{statistik.waermsterSee?.name ?? '–'}</dd>
        </div>
        <div>
          <dt>Gesamtfläche</dt>
          <dd>{formatiereZahl(statistik.gesamtFlaecheKm2)} km²</dd>
        </div>
      </dl>
    </section>
  );
}
