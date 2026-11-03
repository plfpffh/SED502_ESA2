/**
 * Startseite.tsx – Kurzüberblick (/)
 *
 * Startseite: Seenvergleich, Klimatrend, KI-Berater.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { Link } from 'react-router';
import { useAnzahlSeen } from '../hooks/useStammdaten';
import { EIS_PFLICHTSATZ } from '../utils/kiRegeln';
import { KAELTESERIE_EISLAUFEN } from '../utils/seen';

export default function Startseite(): React.JSX.Element {
  const anzahlSeen = useAnzahlSeen();
  return (
    <>
      <h1>Seen im Klimawandel</h1>
      <p>
        Wie warm ist das Wasser in den Seen zum Baden? Wie hat sich die Zahl der Frosttage im historischen Verlauf verändert? Vergleiche {anzahlSeen} Seen in Salzburg und Oberösterreich und prüfe Ideen für deinen nächsten Ausflug.
      </p>

      <div className="start-angebote">
        <section>
          <h2>Seen im Vergleich</h2>
          <p>
            Prüfe die zuletzt gemessenen Wassertemperaturen aller Seen. Grenze die Auswahl nach Bundesland,
            Tiefe oder Temperatur ein und vergleiche im Modus Eissport die aktuellen Kälteserien.
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
            Wassertemperaturen und die Lufttemperatur-Vorhersagen für deinen Ausflug innerhalb der nächsten sieben
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
          Die Kälteserie zählt, wie viele Tage am Stück bis gestern das Tagesmittel der Lufttemperatur am See
          unter 0 °C lag. Ab {KAELTESERIE_EISLAUFEN} Tagen gilt Eislaufen als klimatisch möglich. Sie lässt aber keine Aussage über die
          aktuelle Eisdicke zu. {EIS_PFLICHTSATZ}
        </p>
      </section>
    </>
  );
}
