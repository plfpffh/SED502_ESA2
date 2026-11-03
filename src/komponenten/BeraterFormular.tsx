/**
 * BeraterFormular.tsx – kontrolliertes Formular des KI-Beraters (Kompendium Modul 04, Abschnitt 6)
 *
 * Der Wunsch liegt als State in der Seite, das Formular zeigt ihn an und meldet Änderungen über onAendern.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import type { FormEvent } from 'react';
import { formatierePrognosetag } from '../utils/format';
import type { BeraterWunsch } from '../utils/kiBerater';

interface BeraterFormularProps {
  wunsch: BeraterWunsch;
  tage: string[];
  isGesperrt: boolean; // während die KI antwortet
  kannAbsenden: boolean;
  hinweise: string[];
  fehler: string | null;
  onAendern: (wunsch: BeraterWunsch) => void;
  onAbsenden: () => void;
}

export default function BeraterFormular({
  wunsch, tage, isGesperrt, kannAbsenden, hinweise, fehler, onAendern, onAbsenden,
}: BeraterFormularProps): React.JSX.Element {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onAbsenden();
  };

  return (
    <form className="berater-form" onSubmit={handleSubmit}>
      <fieldset disabled={isGesperrt}>
        <legend>Dein Ausflug</legend>
        <fieldset className="berater__aktivitaet">
          <legend>Aktivität</legend>
          <label><input type="radio" name="aktivitaet" checked={wunsch.aktivitaet === 'baden'} onChange={() => onAendern({ ...wunsch, aktivitaet: 'baden' })} /> Baden</label>
          <label><input type="radio" name="aktivitaet" checked={wunsch.aktivitaet === 'eissport'} onChange={() => onAendern({ ...wunsch, aktivitaet: 'eissport' })} /> Eissport</label>
        </fieldset>
        <div className="berater-form__raster">
          <label htmlFor="berater-tag">Ausflugstag
            <select id="berater-tag" value={wunsch.datum} required onChange={(event) => onAendern({ ...wunsch, datum: event.target.value })}>
              {tage.map((tag) => <option key={tag} value={tag}>{formatierePrognosetag(tag)}</option>)}
            </select>
          </label>
          <label htmlFor="berater-region">Region
            <select id="berater-region" value={wunsch.bundesland} onChange={(event) => onAendern({ ...wunsch, bundesland: event.target.value as BeraterWunsch['bundesland'] })}>
              <option value="alle">Salzburg und Oberösterreich</option>
              <option value="Salzburg">Salzburg</option>
              <option value="Oberösterreich">Oberösterreich</option>
            </select>
          </label>
        </div>
        <label htmlFor="berater-wohnort">Wohnort (optional, nur Ortsname)
          <input id="berater-wohnort" type="text" maxLength={80} autoComplete="off" value={wunsch.wohnort} onChange={(event) => onAendern({ ...wunsch, wohnort: event.target.value })} aria-describedby="wohnort-hinweis" />
        </label>
        <p id="wohnort-hinweis" className="berater__hinweis">Der Wohnort dient nur als Kontext. Es werden keine Entfernungen und Fahrzeiten ermittelt.</p>
        <label htmlFor="berater-zusatz">Zusätzliche Angaben:
          <textarea id="berater-zusatz" rows={3} maxLength={500} value={wunsch.zusaetzlicheAngaben} onChange={(event) => onAendern({ ...wunsch, zusaetzlicheAngaben: event.target.value })} aria-describedby="zusatz-hinweis" />
        </label>
        <p id="zusatz-hinweis" className="berater__hinweis">Optional (max. 500 Zeichen)</p>
        <p className="berater__hinweis">Bitte keine persönlichen Daten eingeben.</p>
        {fehler && <p role="alert">{fehler}</p>}
        {hinweise.map((hinweis) => <p key={hinweis}>{hinweis}</p>)}
        <button type="submit" disabled={!kannAbsenden}>Empfehlung anfordern</button>
      </fieldset>
    </form>
  );
}
