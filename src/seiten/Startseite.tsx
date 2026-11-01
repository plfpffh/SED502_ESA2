/**
 * Startseite.tsx – Kurzüberblick (/)
 *
 * Startseite: Seenvergleich, Klimatrend, KI-Berater.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { Link } from 'react-router';
import { seen } from '../daten/seen';
import { EIS_PFLICHTSATZ } from '../utils/kiRegeln';

export default function Startseite(): React.JSX.Element {
  return (
    <>
      <h1>Seen im Klimawandel</h1>
      <p>
        Wie warm ist das Wasser in den Seen zum Baden? Wie hat sich die Zahl der Frosttage im historischen Verlaufverändert? Vergleiche {seen.length} Seen in Salzburg und Oberösterreich und prüfe Ideen für deinen nächsten Ausflug.
      </p>

      <div className="start-angebote">
        <section>
          <h2>Seen im Vergleich</h2>
          <p>
            Prüfe die zuletzt gemessenen Wassertemperaturen aller Seen. Grenze die Auswahl nach Bundesland,
            Tiefe oder Temperatur ein und vergleiche die Kälteserien des letzten abgeschlossenen Winters.
          </p>
          <Link to="/seen">Seenübersicht öffnen</Link>
        </section>
        <section>
          <h2>Den Klimatrend nachvollziehen</h2>
          <p>
            Die Detailseite zeigt dir die einzelnen Messstellen eines Sees und die Entwicklung der Frosttage
            seit dem Winter 1950/51. Eine KI kann dir die Messwerte und Klimakennzahlen genauer erklären.
          </p>
          <Link to="/seen">See für die Klimatrendansicht wählen</Link>
        </section>
        <section>
          <h2>Deinen Ausflug planen</h2>
          <p>
            Wähle eine Region, einen Tag sowie die gewünschte Aktivität (Baden oder Eissport). Der KI-Berater vergleicht die vorhandenen
            Wassertemperaturen und die Lufttemperatur-Vorehersagen für deinen Ausflug innerhalb der nächsten sieben
            Tage.
          </p>
          <Link to="/berater">KI-Berater öffnen</Link>
        </section>
      </div>

      <section>
        <h2>Was die Daten aussagen und woher sie stammen</h2>
        <p>
          Open-Meteo liefert Wetterprognosen sowie historische Lufttemperaturen. Messzeitpunkte findest du auf
          den Detailseiten. Hydris Salzburg und der Hydrographische Dienst Oberösterreich stellen die
          Wassertemperaturen bereit. Fehlende Werte werden gekennzeichnet.
        </p>
        <p>
          Die Kälteserie zeigt die längste Abfolge von Tagen mit einer mittleren Lufttemperatur unter 0 °C im
          letzten abgeschlossenen Winter von Dezember bis Februar. Sie beschreibt vergangenes Wetter, lässt aber
          keine Aussage über die aktuelle Eisdicke zu. {EIS_PFLICHTSATZ}
        </p>
      </section>
    </>
  );
}
