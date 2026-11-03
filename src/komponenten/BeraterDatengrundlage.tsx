/**
 * BeraterDatengrundlage.tsx – Lade- und Fehlerzustand der Daten, auf denen die KI-Empfehlung beruht
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import FehlerMeldung from './FehlerMeldung';
import Ladeanimation from './Ladeanimation';

interface BeraterDatengrundlageProps {
  isLaden: boolean;
  isEissport: boolean;
  fehler: { salzburg: string | null; ooe: string | null; prognose: string | null; kaelteserie: string | null };
  onNeuLaden?: () => void; // fehlt, solange geladen wird oder die KI antwortet
}

export default function BeraterDatengrundlage({
  isLaden, isEissport, fehler, onNeuLaden,
}: BeraterDatengrundlageProps): React.JSX.Element {
  return (
    <section aria-labelledby="berater-daten-titel">
      <div className="messwerte__kopf">
        <h2 id="berater-daten-titel">Datengrundlage</h2>
        <button type="button" disabled={!onNeuLaden} onClick={onNeuLaden}>Daten aktualisieren</button>
      </div>
      {isLaden ? <Ladeanimation text="Messwerte und Wetterprognosen werden geladen …" /> : (
        <>
          {fehler.salzburg && (
            <FehlerMeldung meldung="Die Messwerte aus Salzburg sind gerade nicht verfügbar." onErneutVersuchen={onNeuLaden} />
          )}
          {fehler.ooe && (
            <FehlerMeldung meldung="Die Messwerte aus Oberösterreich sind gerade nicht verfügbar." onErneutVersuchen={onNeuLaden} />
          )}
          {fehler.prognose && <FehlerMeldung meldung={fehler.prognose} onErneutVersuchen={onNeuLaden} />}
          {isEissport && fehler.kaelteserie && <FehlerMeldung meldung={fehler.kaelteserie} onErneutVersuchen={onNeuLaden} />}
          <p>
            Als Datengrundlage dienen die Wassertemperaturen der letzten verfügbaren Messwerte und die Vorhersage der
            Lufttemperaturen für den ausgewählten Ausflugstag, für Eissport zusätzlich die aktuelle Kälteserie bis gestern.
          </p>
        </>
      )}
    </section>
  );
}
