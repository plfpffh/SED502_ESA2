/**
 * KiBerater.tsx – „Wohin am Wochenende?“ (/berater)
 *
 * KI-Empfehlung anhand vorhandener Messwerte und der Lufttemperatur-Vorhersage des gewählten Tages,
 * für Eissport zusätzlich der aktuellen Kälteserie bis gestern.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { useState } from 'react';
import { useBeraterAnfrage } from '../hooks/useBeraterAnfrage';
import { useBeraterDaten } from '../hooks/useBeraterDaten';
import BeraterDatengrundlage from '../komponenten/BeraterDatengrundlage';
import BeraterEmpfehlung from '../komponenten/BeraterEmpfehlung';
import BeraterFormular from '../komponenten/BeraterFormular';
import { hatBeraterDaten } from '../utils/kiBerater';
import type { BeraterWunsch } from '../utils/kiBerater';
import { EIS_PFLICHTSATZ } from '../utils/kiRegeln';
import { prognoseTage } from '../utils/prognose';

export default function KiBerater(): React.JSX.Element {
  const daten = useBeraterDaten();
  const ki = useBeraterAnfrage(daten);
  const tage = prognoseTage();
  const [wunsch, setWunsch] = useState<BeraterWunsch>(() => ({
    aktivitaet: 'baden', datum: prognoseTage()[0], bundesland: 'alle', wohnort: '', zusaetzlicheAngaben: '',
  }));
  const hatDaten = hatBeraterDaten(wunsch, daten.seen, daten.prognosen);
  const datumGueltig = tage.includes(wunsch.datum);
  // Baden braucht keine Kälteserien, nur Eissport wartet auf sie
  const datenLaden = daten.isLaden || (wunsch.aktivitaet === 'eissport' && daten.isKaelteserienLaden);
  const aktualisieren = !datenLaden && !ki.isStreaming ? daten.neuLaden : undefined;
  const hinweise = [
    ...(!datumGueltig ? ['Bitte wähle einen aktuellen Ausflugstag.'] : []),
    ...(!datenLaden && !hatDaten ? ['Für diese Auswahl sind derzeit keine Messwerte oder Prognosen verfügbar.'] : []),
  ];

  const handleAbsenden = (): void => ki.anfordern(wunsch);

  return (
    <div className="berater">
      <h1>KI-Berater</h1>
      <p>Welcher See ist am besten für deinen Ausflug geeignet? Wähle eine Aktivität und einen Tag innerhalb der nächsten sieben Tage.</p>
      <p>Bei der Abfrage werden die Eingaben, die Messwerte und die Temperaturvorhersage an Google Gemini übermittelt.</p>

      <BeraterFormular
        wunsch={wunsch}
        tage={tage}
        isGesperrt={ki.isStreaming}
        kannAbsenden={!datenLaden && hatDaten && datumGueltig}
        hinweise={hinweise}
        fehler={ki.formularFehler}
        onAendern={setWunsch}
        onAbsenden={handleAbsenden}
      />

      {(wunsch.aktivitaet === 'eissport' || ki.anfrage?.aktivitaet === 'eissport') && (
        <p>Zu Eisdicke und offiziellen Freigaben liegen uns keine Daten vor. {EIS_PFLICHTSATZ}</p>
      )}

      <BeraterDatengrundlage
        isLaden={datenLaden}
        isEissport={wunsch.aktivitaet === 'eissport'}
        fehler={daten.fehler}
        onNeuLaden={aktualisieren}
      />

      {ki.anfrage && (
        <BeraterEmpfehlung
          key={ki.anfrageNummer}
          anfrage={ki.anfrage}
          text={ki.antwort}
          isStreaming={ki.isStreaming}
          fehler={ki.kiFehler}
          abgebrochen={ki.abgebrochen}
          onAbbrechen={ki.abbrechen}
          onErneutVersuchen={() => ki.anfrage && ki.anfordern(ki.anfrage)}
        />
      )}
    </div>
  );
}
