/**
 * SeeDetail.tsx – Detailseite eines Sees (/seen/:id)
 *
 * Stammdaten und aktuelle Temperaturen (SeeInformationen), Frosttage-Verlauf ab 1950/51 (Klimatrend)
 * und KI-Einschätzung auf Anfrage.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useKlimatrend } from '../hooks/useKlimatrend';
import { useSeeDetail } from '../hooks/useSeeDetail';
import { useSeeStammdaten } from '../hooks/useStammdaten';
import { useAI } from '../hooks/useAI';
import KiAntwort from '../komponenten/KiAntwort';
import Klimatrend from '../komponenten/Klimatrend';
import SeeInformationen from '../komponenten/SeeInformationen';
import type { See } from '../typen/see';
import { baueSeeEinschaetzung } from '../utils/seeEinschaetzung';
import { EIS_PFLICHTSATZ, KI_REGELN } from '../utils/kiRegeln';
import NichtGefunden from './NichtGefunden';

export default function SeeDetail(): React.JSX.Element {
  const { id } = useParams();
  const see = useSeeStammdaten(id);
  if (!see) return <NichtGefunden />;
  return <SeeDetailInhalt key={see.id} see={see} />;
}

interface SeeDetailInhaltProps {
  see: See; // nur an die Hooks durchgereicht, angezeigt wird die SeeAnsicht aus useSeeDetail
}

function SeeDetailInhalt({ see }: SeeDetailInhaltProps): React.JSX.Element {
  const detail = useSeeDetail(see);
  const { kennzahlen, frosttage, isLaden, fehler, neuLaden } = useKlimatrend(see);
  const ki = useAI({ systemPrompt: KI_REGELN, maxNachrichten: 1 });
  const [angefragt, setAngefragt] = useState(false);
  const [abgebrochen, setAbgebrochen] = useState(false);
  const [anfrageNummer, setAnfrageNummer] = useState(0);
  const datenLaden = detail.isLaden || isLaden;
  const hatDaten = detail.see.temperatur !== null || kennzahlen.length > 0 || frosttage.length > 0;
  const antwort = ki.nachrichten.filter((nachricht) => nachricht.role === 'assistant').at(-1)?.content ?? '';

  const handleEinschaetzungAnfordern = (): void => {
    if (datenLaden || !hatDaten || ki.isStreaming) return;
    ki.zuruecksetzen();
    setAngefragt(true);
    setAbgebrochen(false);
    setAnfrageNummer((nummer) => nummer + 1);
    // undefined: heute bleibt beim Standardwert, damit frosttage als letztes Argument übergeben werden kann
    void ki.sendeNachricht(baueSeeEinschaetzung(detail.see, kennzahlen, fehler, undefined, frosttage));
  };

  const handleAbbrechen = (): void => {
    setAbgebrochen(true);
    ki.abbrechen();
  };

  return (
    <>
      <p><Link to="/seen">Zur Seenübersicht</Link></p>
      <h1>{detail.see.name}</h1>
      <SeeInformationen {...detail} />
      <Klimatrend seeName={detail.see.name} frosttage={frosttage} isLaden={isLaden} fehler={fehler} onNeuLaden={neuLaden} />
      <section className="kieinschaetzung" aria-labelledby="kieinschaetzung-titel">
        <h2 id="kieinschaetzung-titel">KI-Einschätzung zu den Daten</h2>
        <p>Auf Wunsch erklärt die KI (Google Gemini) die Messwerte und historischen Klimadaten dieses Sees.</p>
        <p>Die Daten werden beim Anfordern an Google Gemini übermittelt.</p>
        <p>Achtung: Zur tatsächlichen Eissituation und zu offiziellen Freigaben liegen keine Daten vor. {EIS_PFLICHTSATZ}</p>
        {datenLaden && <p>Die Datengrundlage wird noch geladen.</p>}
        {!datenLaden && !hatDaten && <p>Für eine Einschätzung fehlen derzeit Messwerte und Klimakennzahlen.</p>}
        <button type="button" disabled={datenLaden || !hatDaten || ki.isStreaming} onClick={handleEinschaetzungAnfordern}>
          {angefragt ? 'Neue Einschätzung anfordern' : 'KI-Einschätzung anfordern'}
        </button>
        {angefragt && (
          <KiAntwort
            key={anfrageNummer}
            text={antwort}
            isStreaming={ki.isStreaming}
            fehler={ki.fehler}
            abgebrochen={abgebrochen}
            onAbbrechen={handleAbbrechen}
            onErneutVersuchen={handleEinschaetzungAnfordern}
          />
        )}
      </section>
    </>
  );
}
