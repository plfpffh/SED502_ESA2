/**
 * SeeKarte.tsx – Karte eines Sees in der Seenliste
 *
 * Reine Darstellung, alle Werte sind in SeeAnsicht bereits berechnet.
 * Im Modus Baden steht die Wassertemperatur oben, im Modus Eissport die Kälteserie des letzten Winters;
 * die Wassertemperatur bleibt dann in den Fakten sichtbar.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { Link } from 'react-router';
import type { Aktivitaet, MessstelleAnsicht, SeeAnsicht } from '../typen/ansicht';
import { formatiereKaelteserie, formatiereTemperatur, formatiereZahl, formatiereZeitpunkt } from '../utils/format';

interface SeeKarteProps {
  see: SeeAnsicht;
  aktivitaet: Aktivitaet;
}

interface MessstelleProps {
  messstelle: MessstelleAnsicht;
}

function Messstelle({ messstelle }: MessstelleProps): React.JSX.Element {
  return (
    <li>
      {messstelle.name}: {formatiereTemperatur(messstelle.temperatur)}{' '}
      <small>
        ({messstelle.quelle}
        {messstelle.zeitpunkt && (
          <>
            , <time dateTime={messstelle.zeitpunkt}>{formatiereZeitpunkt(messstelle.zeitpunkt)}</time>
          </>
        )}
        )
      </small>
    </li>
  );
}

function hauptwert(see: SeeAnsicht, aktivitaet: Aktivitaet): string {
  if (aktivitaet === 'eissport') {
    return formatiereKaelteserie(see.laengsteKaelteserie);
  }
  if (see.temperatur === null) {
    return formatiereTemperatur(null);
  }
  return `${formatiereTemperatur(see.temperatur)} · ${see.badeEinschaetzung}`;
}

export default function SeeKarte({ see, aktivitaet }: SeeKarteProps): React.JSX.Element {
  const fakten: [string, string][] = [
    ['Bundesland', see.bundeslaender.join(' / ')],
    ['Fläche', `${formatiereZahl(see.flaecheKm2)} km²`],
    ['Max. Tiefe', `${formatiereZahl(see.maxTiefeM)} m (${see.tiefenkategorie})`],
    ['Seehöhe', `${see.seehoeheM} m ü. A.`],
  ];
  if (aktivitaet === 'eissport') {
    fakten.unshift(['Wassertemperatur', formatiereTemperatur(see.temperatur)]);
  }

  return (
    <article className="see" aria-labelledby={`see-${see.id}`}>
      <header>
        <h2 id={`see-${see.id}`}>
          <Link to={`/seen/${see.id}`}>{see.name}</Link>
        </h2>
        <p className="see__wert">{hauptwert(see, aktivitaet)}</p>
      </header>
      <dl className="see__fakten">
        {fakten.map(([begriff, wert]) => (
          <div key={begriff}>
            <dt>{begriff}</dt>
            <dd>{wert}</dd>
          </div>
        ))}
      </dl>
      {see.messstellen.length > 0 && (
        <details>
          <summary>Messstellen ({see.messstellen.length})</summary>
          <ul>
            {see.messstellen.map((messstelle) => (
              <Messstelle key={`${messstelle.quelle}-${messstelle.name}`} messstelle={messstelle} />
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
