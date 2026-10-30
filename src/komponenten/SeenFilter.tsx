/**
 * SeenFilter.tsx – kontrolliertes Filterformular der Seenliste (Kompendium Modul 04, Abschnitt 6)
 *
 * Der Filter liegt als State in der Seite, das Formular zeigt ihn an und meldet jede Änderung über onAendern.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import type { Aktivitaet, Filter } from '../typen/ansicht';
import { STANDARD_FILTER, wechsleAktivitaet } from '../utils/filter';
import MindestwertFilter from './MindestwertFilter';

interface SeenFilterProps {
  filter: Filter;
  onAendern: (filter: Filter) => void;
}

const AKTIVITAETEN: { wert: Aktivitaet; text: string }[] = [
  { wert: 'baden', text: 'Baden' },
  { wert: 'eissport', text: 'Eissport' },
];

export default function SeenFilter({ filter, onAendern }: SeenFilterProps): React.JSX.Element {
  return (
    <form className="filter" aria-label="Seen filtern und sortieren" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="filter__aktivitaet">
        <legend>Aktivität</legend>
        {AKTIVITAETEN.map(({ wert, text }) => (
          <label key={wert} className="filter__option">
            <input
              type="radio"
              name="aktivitaet"
              value={wert}
              checked={filter.aktivitaet === wert}
              onChange={() => onAendern(wechsleAktivitaet(filter, wert))}
            />
            {text}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Filter</legend>
        <div className="filter__feld">
          <label htmlFor="bundesland">Bundesland</label>
          <select
            id="bundesland"
            value={filter.bundesland}
            onChange={(e) => onAendern({ ...filter, bundesland: e.target.value as Filter['bundesland'] })}
          >
            <option value="alle">Alle</option>
            <option value="Salzburg">Salzburg</option>
            <option value="Oberösterreich">Oberösterreich</option>
          </select>
        </div>

        <div className="filter__feld">
          <label htmlFor="tiefe">Tiefe</label>
          <select
            id="tiefe"
            value={filter.tiefe}
            onChange={(e) => onAendern({ ...filter, tiefe: e.target.value as Filter['tiefe'] })}
          >
            <option value="alle">Alle</option>
            <option value="flach">flach (unter 15 m)</option>
            <option value="mittel">mittel (15–70 m)</option>
            <option value="tief">tief (ab 70 m)</option>
          </select>
        </div>

        <MindestwertFilter filter={filter} onAendern={onAendern} />

        <div className="filter__feld">
          <label htmlFor="sortierung">Sortieren nach</label>
          <select
            id="sortierung"
            value={filter.sortierung}
            onChange={(e) => onAendern({ ...filter, sortierung: e.target.value as Filter['sortierung'] })}
          >
            <option value="temperatur">Wassertemperatur</option>
            <option value="kaelteserie">Kälteserie</option>
            <option value="name">Name</option>
            <option value="tiefe">Tiefe</option>
            <option value="flaeche">Fläche</option>
          </select>
        </div>

        <button type="button" onClick={() => onAendern(STANDARD_FILTER)}>
          Zurücksetzen
        </button>
      </fieldset>
    </form>
  );
}
