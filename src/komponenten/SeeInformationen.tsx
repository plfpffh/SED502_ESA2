/**
 * SeeInformationen.tsx – Stammdaten und Wassertemperaturen aller Messstellen
 *
 * Zeigt fehlende Messungen an.
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import type { SeeAnsicht } from '../typen/ansicht';
import { formatiereTemperatur, formatiereZahl, formatiereZeitpunkt, NICHT_VORHANDEN } from '../utils/format';
import { messstellenMitWert } from '../utils/seen';
import FehlerMeldung from './FehlerMeldung';
import Ladeanimation from './Ladeanimation';

interface SeeInformationenProps {
  see: SeeAnsicht;
  isLaden: boolean;
  fehler: { salzburg: string | null; ooe: string | null };
  neuLaden: () => void;
}

export default function SeeInformationen({ see, isLaden, fehler, neuLaden }: SeeInformationenProps): React.JSX.Element {
  const fakten: [string, string][] = [
    ['Bundesland', see.bundeslaender.join(' / ')],
    ['Fläche', `${formatiereZahl(see.flaecheKm2)} km²`],
    ['Max. Tiefe', `${formatiereZahl(see.maxTiefeM)} m (${see.tiefenkategorie})`],
    ['Seehöhe', `${formatiereZahl(see.seehoeheM)} m ü. A.`],
  ];
  const vorhandeneMessstellen = messstellenMitWert(see);

  return (
    <>
      <section className="seeinformationen" aria-labelledby="seefakten-titel">
        <h2 id="seefakten-titel">Über den See</h2>
        <dl className="see__fakten">
          {fakten.map(([begriff, wert]) => (
            <div key={begriff}><dt>{begriff}</dt><dd>{wert}</dd></div>
          ))}
        </dl>
      </section>
      <section className="seeinformationen" aria-labelledby="messwerte-titel">
        <div className="messwerte__kopf">
          <h2 id="messwerte-titel">Aktuelle Wassertemperaturen</h2>
          <button type="button" onClick={neuLaden} disabled={isLaden}>Messwerte aktualisieren</button>
        </div>
        {isLaden ? <Ladeanimation text="Wassertemperaturen werden geladen …" /> : (
          <>
            {fehler.salzburg && (
              <FehlerMeldung meldung="Die Messwerte aus Salzburg sind gerade nicht verfügbar." onErneutVersuchen={neuLaden} />
            )}
            {fehler.ooe && (
              <FehlerMeldung meldung="Die Messwerte aus Oberösterreich sind gerade nicht verfügbar." onErneutVersuchen={neuLaden} />
            )}
            <p className="messwerte__mittelwert">
              Mittelwert der verfügbaren Messstellen: <strong>{formatiereTemperatur(see.temperatur)}</strong>
              {see.badeEinschaetzung && ` · ${see.badeEinschaetzung}`}
            </p>
            <p>{vorhandeneMessstellen} von {see.messstellen.length} Messstellen liefern einen Wert.</p>
            <ul className="messstellen">
              {see.messstellen.map((messstelle) => (
                <li key={`${messstelle.quelle}-${messstelle.name}`}>
                  <h3>{messstelle.name}</h3>
                  <p className="messstellen__quelle">{messstelle.quelle}</p>
                  <p className="messstellen__temperatur">{formatiereTemperatur(messstelle.temperatur)}</p>
                  <p>
                    Messzeitpunkt:{' '}
                    {messstelle.zeitpunkt
                      ? <time dateTime={messstelle.zeitpunkt}>{formatiereZeitpunkt(messstelle.zeitpunkt)}</time>
                      : NICHT_VORHANDEN}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
