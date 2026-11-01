/**
 * KiBerater.tsx – „Wohin am Wochenende?“ (/berater)
 *
 * KI-Empfehlung anhand vorhandener Messwerte und der Lufttemperatur-Vorhersage des gewählten Tages.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAI } from '../hooks/useAI';
import { useBeraterDaten } from '../hooks/useBeraterDaten';
import FehlerMeldung from '../komponenten/FehlerMeldung';
import KiAntwort from '../komponenten/KiAntwort';
import Ladeanimation from '../komponenten/Ladeanimation';
import { formatierePrognosetag } from '../utils/format';
import { baueBeraterAnfrage, hatBeraterDaten } from '../utils/kiBerater';
import type { BeraterWunsch } from '../utils/kiBerater';
import { EIS_PFLICHTSATZ, KI_REGELN } from '../utils/kiRegeln';
import { prognoseTage } from '../utils/prognose';

export default function KiBerater(): React.JSX.Element {
  const daten = useBeraterDaten();
  const tage = prognoseTage();
  const [wunsch, setWunsch] = useState<BeraterWunsch>(() => ({
    aktivitaet: 'baden', datum: prognoseTage()[0], bundesland: 'alle', wohnort: '', zusaetzlicheAngaben: '',
  }));
  const [anfrage, setAnfrage] = useState<BeraterWunsch | null>(null);
  const [anfrageNummer, setAnfrageNummer] = useState(0);
  const [formularFehler, setFormularFehler] = useState<string | null>(null);
  const [abgebrochen, setAbgebrochen] = useState(false);
  const antwortRef = useRef<HTMLElement>(null);
  const ki = useAI({ systemPrompt: KI_REGELN, maxNachrichten: 1 });
  const hatDaten = hatBeraterDaten(wunsch, daten.seen, daten.prognosen);
  const datumGueltig = tage.includes(wunsch.datum);
  const antwort = ki.nachrichten.filter((nachricht) => nachricht.role === 'assistant').at(-1)?.content ?? '';
  const aktualisieren = !daten.isLaden && !ki.isStreaming ? daten.neuLaden : undefined;

  useEffect(() => {
    if (anfrageNummer > 0) antwortRef.current?.focus();
  }, [anfrageNummer]);

  const anfordern = (eingabe: BeraterWunsch): void => {
    if (daten.isLaden || ki.isStreaming) return;
    setFormularFehler(null);
    if (!hatBeraterDaten(eingabe, daten.seen, daten.prognosen)) {
      setFormularFehler('Für diese Auswahl fehlen Messwerte und Prognosen.');
      return;
    }
    let prompt: string;
    try {
      prompt = baueBeraterAnfrage(eingabe, daten.seen, daten.prognosen);
    } catch (fehler) {
      setFormularFehler(fehler instanceof Error ? fehler.message : 'Bitte prüfe deine Eingaben.');
      return;
    }
    ki.zuruecksetzen();
    setAnfrage({ ...eingabe });
    setAnfrageNummer((nummer) => nummer + 1);
    setAbgebrochen(false);
    void ki.sendeNachricht(prompt);
  };

  const absenden = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    anfordern(wunsch);
  };

  return (
    <div className="berater">
      <h1>KI-Berater</h1>
      <p>Welcher See ist am Besten für deinen Ausflug geeignet? Wähle eine Aktivität und einen Tag innerhalb der nächsten sieben Tage.</p>
      <p>Bei der Abfrage werden die Eingaben, die Messwerte und die Temperaturvorhersage an Google Gemini übermittelt.</p>

      <form className="berater-form" onSubmit={absenden}>
        <fieldset disabled={ki.isStreaming}>
          <legend>Dein Ausflug</legend>
          <fieldset className="berater__aktivitaet">
            <legend>Aktivität</legend>
            <label><input type="radio" name="aktivitaet" checked={wunsch.aktivitaet === 'baden'} onChange={() => setWunsch({ ...wunsch, aktivitaet: 'baden' })} /> Baden</label>
            <label><input type="radio" name="aktivitaet" checked={wunsch.aktivitaet === 'eissport'} onChange={() => setWunsch({ ...wunsch, aktivitaet: 'eissport' })} /> Eissport</label>
          </fieldset>
          <div className="berater-form__raster">
            <label htmlFor="berater-tag">Ausflugstag
              <select id="berater-tag" value={wunsch.datum} required onChange={(event) => setWunsch({ ...wunsch, datum: event.target.value })}>
                {tage.map((tag) => <option key={tag} value={tag}>{formatierePrognosetag(tag)}</option>)}
              </select>
            </label>
            <label htmlFor="berater-region">Region
              <select id="berater-region" value={wunsch.bundesland} onChange={(event) => setWunsch({ ...wunsch, bundesland: event.target.value as BeraterWunsch['bundesland'] })}>
                <option value="alle">Salzburg und Oberösterreich</option>
                <option value="Salzburg">Salzburg</option>
                <option value="Oberösterreich">Oberösterreich</option>
              </select>
            </label>
          </div>
          <label htmlFor="berater-wohnort">Wohnort (optional, nur Ortsname)
            <input id="berater-wohnort" type="text" maxLength={80} autoComplete="off" value={wunsch.wohnort} onChange={(event) => setWunsch({ ...wunsch, wohnort: event.target.value })} aria-describedby="wohnort-hinweis" />
          </label>
          <p id="wohnort-hinweis" className="berater__hinweis">Der Wohnort dient nur als Kontext. Es werden keine Entfernungen und Fahrzeiten ermittelt.</p>
          <label htmlFor="berater-zusatz">Zusätzlich Angaben:
            <textarea id="berater-zusatz" rows={3} maxLength={500} value={wunsch.zusaetzlicheAngaben} onChange={(event) => setWunsch({ ...wunsch, zusaetzlicheAngaben: event.target.value })} aria-describedby="zusatz-hinweis" />
          </label>
          <p id="zusatz-hinweis" className="berater__hinweis">Optional (max. 500 Zeichen)</p>
          <p className="berater__hinweis">Bitte keine persönliche Daten eingeben.</p>
          {formularFehler && <p role="alert">{formularFehler}</p>}
          {!datumGueltig && <p>Bitte wähle einen aktuellen Ausflugstag.</p>}
          {!daten.isLaden && !hatDaten && <p>Für diese Auswahl sind derzeit keine Messwerte oder Prognosen verfügbar.</p>}
          <button type="submit" disabled={daten.isLaden || !hatDaten || !datumGueltig}>Empfehlung anfordern</button>
        </fieldset>
      </form>

      {(wunsch.aktivitaet === 'eissport' || anfrage?.aktivitaet === 'eissport') && (
        <p>Zu Eisdicke und offiziellen Freigaben liegen uns keine Daten vor. {EIS_PFLICHTSATZ}</p>
      )}

      <section aria-labelledby="berater-daten-titel">
        <div className="messwerte__kopf">
          <h2 id="berater-daten-titel">Datengrundlage</h2>
          <button type="button" disabled={!aktualisieren} onClick={daten.neuLaden}>Daten aktualisieren</button>
        </div>
        {daten.isLaden ? <Ladeanimation text="Messwerte und Wetterprognosen werden geladen …" /> : (
          <>
            {daten.fehler.salzburg && (
              <FehlerMeldung meldung="Die Messwerte aus Salzburg sind gerade nicht verfügbar." onErneutVersuchen={aktualisieren} />
            )}
            {daten.fehler.ooe && (
              <FehlerMeldung meldung="Die Messwerte aus Oberösterreich sind gerade nicht verfügbar." onErneutVersuchen={aktualisieren} />
            )}
            {daten.fehler.prognose && <FehlerMeldung meldung={daten.fehler.prognose} onErneutVersuchen={aktualisieren} />}
            <p>Als Datengrundlage dienen die Wassertemperaturen der letzten verfügbaren Messwerte und die Vorhersage der Lufttemperaturen für den ausgewählten Ausflugstag.</p>
          </>
        )}
      </section>

      {anfrage && (
        <section className="kieinschaetzung" aria-labelledby="berater-antwort-titel" ref={antwortRef} tabIndex={-1}>
          <h2 id="berater-antwort-titel">KI-Empfehlung</h2>
          <p>Für {anfrage.aktivitaet === 'baden' ? 'Baden' : 'Eissport'} am {formatierePrognosetag(anfrage.datum)}, Region: {anfrage.bundesland === 'alle' ? 'Salzburg und Oberösterreich' : anfrage.bundesland}. Datengrundlage vom Anfragezeitpunkt.</p>
          <KiAntwort key={anfrageNummer} text={antwort} isStreaming={ki.isStreaming} fehler={ki.fehler} abgebrochen={abgebrochen}
            onAbbrechen={() => { setAbgebrochen(true); ki.abbrechen(); }} onErneutVersuchen={() => anfordern(anfrage)} />
        </section>
      )}
    </div>
  );
}
