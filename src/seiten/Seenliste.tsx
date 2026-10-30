/**
 * Seenliste.tsx – Übersicht aller Seen mit Filter und Sortierung (/seen)
 *
 * Umschalter „Baden / Eissport“: Baden filtert nach Wassertemperatur, Eissport nach der Kälteserie
 * des letzten Winters (PLANUNG.md, Abschnitt 5). Fällt eine Quelle aus, bleiben die Seen der anderen sichtbar.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { useState } from 'react';
import FehlerMeldung from '../komponenten/FehlerMeldung';
import Kennzahlen from '../komponenten/Kennzahlen';
import Ladeanimation from '../komponenten/Ladeanimation';
import SeeKarte from '../komponenten/SeeKarte';
import SeenFilter from '../komponenten/SeenFilter';
import { useSeenAuswahl } from '../hooks/useSeenAuswahl';
import type { Filter } from '../typen/ansicht';
import { STANDARD_FILTER } from '../utils/filter';

export default function Seenliste(): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>(STANDARD_FILTER);
  const { auswahl, isLaden, fehler, neuLaden } = useSeenAuswahl(filter);

  return (
    <>
      <h1>Seen</h1>
      <p>
        Aktuelle Wassertemperaturen aus Salzburg und Oberösterreich. Bei mehreren Messstellen wird der Mittelwert
        angezeigt.
      </p>

      <SeenFilter filter={filter} onAendern={setFilter} />

      {fehler.salzburg && (
        <FehlerMeldung meldung="Die Messwerte aus Salzburg sind gerade nicht erreichbar." onErneutVersuchen={neuLaden} />
      )}
      {fehler.ooe && (
        <FehlerMeldung
          meldung="Die Messwerte aus Oberösterreich sind gerade nicht erreichbar."
          onErneutVersuchen={neuLaden}
        />
      )}
      {filter.aktivitaet === 'eissport' && fehler.klima && (
        <FehlerMeldung meldung="Die Klimadaten sind gerade nicht erreichbar." onErneutVersuchen={neuLaden} />
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
