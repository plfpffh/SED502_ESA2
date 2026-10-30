/**
 * MindestwertFilter.tsx – Mindestwert des aktiven Modus im Filterformular
 *
 * Baden: Regler für die Wassertemperatur (0–30 °C) wie in ESA 1.
 * Eissport: Auswahl der Kältetage am Stück, mit Pflichthinweis zur Freigabe durch die Gemeinde.
 * Checkbox „alle“ setzt den Mindestwert auf null (kein Filter).
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import type { Filter } from '../typen/ansicht';
import { KAELTETAGE_AUSWAHL, STANDARD_KAELTETAGE, STANDARD_MINDESTTEMPERATUR } from '../utils/filter';
import { formatiereTemperatur } from '../utils/format';
import { EIS_PFLICHTSATZ } from '../utils/kiRegeln';

interface MindestwertFilterProps {
  filter: Filter;
  onAendern: (filter: Filter) => void;
}

export default function MindestwertFilter({ filter, onAendern }: MindestwertFilterProps): React.JSX.Element {
  if (filter.aktivitaet === 'baden') {
    const isAlle = filter.mindestTemperatur === null;
    const wert = filter.mindestTemperatur ?? STANDARD_MINDESTTEMPERATUR;
    return (
      <div className="filter__feld">
        <label htmlFor="mindest-temperatur">Wassertemperatur mindestens</label>
        <span className="filter__regler">
          <input
            id="mindest-temperatur"
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={wert}
            disabled={isAlle}
            onChange={(e) => onAendern({ ...filter, mindestTemperatur: Number(e.target.value) })}
          />
          <output htmlFor="mindest-temperatur">{formatiereTemperatur(wert)}</output>
          <label className="filter__option">
            <input
              type="checkbox"
              checked={isAlle}
              onChange={(e) => onAendern({ ...filter, mindestTemperatur: e.target.checked ? null : wert })}
            />
            alle<span className="unsichtbar"> Temperaturen</span>
          </label>
        </span>
      </div>
    );
  }

  const isAlle = filter.mindestKaeltetage === null;
  const wert = filter.mindestKaeltetage ?? STANDARD_KAELTETAGE;
  return (
    <>
      <div className="filter__feld">
        <label htmlFor="mindest-kaeltetage">Tagesmittel der Luft unter 0 °C an mindestens</label>
        <span className="filter__regler">
          <select
            id="mindest-kaeltetage"
            value={wert}
            disabled={isAlle}
            onChange={(e) => onAendern({ ...filter, mindestKaeltetage: Number(e.target.value) })}
          >
            {KAELTETAGE_AUSWAHL.map((tage) => (
              <option key={tage} value={tage}>
                {tage} Tagen am Stück
              </option>
            ))}
          </select>
          <label className="filter__option">
            <input
              type="checkbox"
              checked={isAlle}
              onChange={(e) => onAendern({ ...filter, mindestKaeltetage: e.target.checked ? null : wert })}
            />
            alle<span className="unsichtbar"> Seen</span>
          </label>
        </span>
      </div>
      <p className="filter__hinweis">Klimatischer Hinweis, keine Freigabe. {EIS_PFLICHTSATZ}</p>
    </>
  );
}
