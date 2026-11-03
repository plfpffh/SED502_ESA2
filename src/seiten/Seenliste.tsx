/**
 * Seenliste.tsx – Übersicht aller Seen mit Filter und Sortierung (/seen)
 *
 * Umschalter „Baden / Eissport“: Baden filtert nach Wassertemperatur, Eissport nach der aktuellen Kälteserie
 * bis gestern (README: Was die App kann). Fällt eine Quelle aus, bleiben die Seen der anderen sichtbar.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import FehlerMeldung from '../komponenten/FehlerMeldung';
import Kennzahlen from '../komponenten/Kennzahlen';
import Ladeanimation from '../komponenten/Ladeanimation';
import SeeKarte from '../komponenten/SeeKarte';
import SeenFilter from '../komponenten/SeenFilter';
import { useSeenFilter } from '../context/SeenFilterContext';
import { useSeenAuswahl } from '../hooks/useSeenAuswahl';
import { KAELTESERIE_EISLAUFEN } from '../utils/seen';

export default function Seenliste(): React.JSX.Element {
  // aus dem Context, damit der Filter beim Wechsel auf eine Detailseite und zurück erhalten bleibt
  const { filter, setFilter } = useSeenFilter();
  const { auswahl, isLaden, fehler, neuLaden } = useSeenAuswahl(filter);

  return (
    <>
      <h1>Seen</h1>
      <p>
        Aktuelle Wassertemperaturen aus Salzburg und Oberösterreich. Bei mehreren Messstellen wird der Mittelwert
        angezeigt.
      </p>

      <SeenFilter filter={filter} onAendern={setFilter} />

      {filter.aktivitaet === 'eissport' && (
        <p>
          Angezeigt wird, wie viele Tage am Stück bis gestern das Tagesmittel der Lufttemperatur am See unter 0 °C lag
          (Open-Meteo). Ab {KAELTESERIE_EISLAUFEN} Tagen gilt Eislaufen als klimatisch möglich. Über Eisdicke und
          Freigaben sagt das nichts aus.
        </p>
      )}

      {fehler.salzburg && (
        <FehlerMeldung meldung="Die Messwerte aus Salzburg sind gerade nicht erreichbar." onErneutVersuchen={neuLaden} />
      )}
      {fehler.ooe && (
        <FehlerMeldung
          meldung="Die Messwerte aus Oberösterreich sind gerade nicht erreichbar."
          onErneutVersuchen={neuLaden}
        />
      )}
      {filter.aktivitaet === 'eissport' && fehler.kaelteserie && (
        <FehlerMeldung meldung={fehler.kaelteserie} onErneutVersuchen={neuLaden} />
      )}

      {isLaden ? (
        <Ladeanimation text="Messwerte werden geladen …" />
      ) : (
        <>
          <p>
            <output aria-live="polite">
              {auswahl.seen.length} von {auswahl.gesamtanzahl} Seen
            </output>
          </p>
          <ul className="seenliste">
            {auswahl.seen.map((see) => (
              <li key={see.id}>
                <SeeKarte see={see} aktivitaet={filter.aktivitaet} />
              </li>
            ))}
          </ul>
          <Kennzahlen statistik={auswahl.statistik} />
        </>
      )}
    </>
  );
}
