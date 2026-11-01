/**
 * SeeDetail.tsx – Detailseite eines Sees (/seen/:id)
 *
 * Stammdaten, aktuelle Temperaturen und Klimatrend mit Diagramm und Tabelle.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router';
import { seen } from '../daten/seen';
import { useKlimatrend } from '../hooks/useKlimatrend';
import { useSeeDetail } from '../hooks/useSeeDetail';
import { useAI } from '../hooks/useAI';
import FehlerMeldung from '../komponenten/FehlerMeldung';
import Ladeanimation from '../komponenten/Ladeanimation';
import SeeInformationen from '../komponenten/SeeInformationen';
import KiAntwort from '../komponenten/KiAntwort';
import type { See } from '../typen/see';
import { baueSeeEinschaetzung } from '../utils/seeEinschaetzung';
import { EIS_PFLICHTSATZ, KI_REGELN } from '../utils/kiRegeln';
import NichtGefunden from './NichtGefunden';

const KlimaDiagramm = lazy(() => import('../komponenten/KlimaDiagramm'));

export default function SeeDetail(): React.JSX.Element {
  const { id } = useParams();
  const see = seen.find((see) => see.id === id);
  if (!see) return <NichtGefunden />;
  return <SeeDetailInhalt key={see.id} see={see} />;
}

function SeeDetailInhalt({ see }: { see: See }): React.JSX.Element {
  const detail = useSeeDetail(see);
  const { kennzahlen, isLaden, fehler, neuLaden } = useKlimatrend(see);
  const ki = useAI({ systemPrompt: KI_REGELN, maxNachrichten: 1 });
  const [angefragt, setAngefragt] = useState(false);
  const [abgebrochen, setAbgebrochen] = useState(false);
  const [anfrageNummer, setAnfrageNummer] = useState(0);
  const datenLaden = detail.isLaden || isLaden;
  const hatDaten = detail.see.temperatur !== null || kennzahlen.length > 0;
  const antwort = ki.nachrichten.filter((nachricht) => nachricht.role === 'assistant').at(-1)?.content ?? '';

  const einschaetzungAnfordern = (): void => {
    if (datenLaden || !hatDaten || ki.isStreaming) return;
    ki.zuruecksetzen();
    setAngefragt(true);
    setAbgebrochen(false);
    setAnfrageNummer((nummer) => nummer + 1);
    void ki.sendeNachricht(baueSeeEinschaetzung(detail.see, kennzahlen, fehler));
  };

  const abbrechen = (): void => {
    setAbgebrochen(true);
    ki.abbrechen();
  };
  return (
    <>
      <p><Link to="/seen">Zur Seenübersicht</Link></p>
      <h1>{see.name}</h1>
      <SeeInformationen {...detail} />
      <section aria-labelledby="klimatrend-titel">
        <h2 id="klimatrend-titel">Klimatrend</h2>
        {isLaden ? <Ladeanimation text="Klimatrend wird geladen …" /> : (
          <>
            {fehler && <FehlerMeldung meldung={fehler} onErneutVersuchen={neuLaden} />}
            {kennzahlen.length > 0 && (
              <Suspense fallback={<Ladeanimation text="Diagramm wird geladen …" />}>
                <KlimaDiagramm seeName={see.name} kennzahlen={kennzahlen} />
              </Suspense>
            )}
          </>
        )}
      </section>
      <section className="kieinschaetzung" aria-labelledby="kieinschaetzung-titel">
        <h2 id="kieinschaetzung-titel">KI-Einschätzung zu den Daten</h2>
        <p>Auf Wunsch erklärt die KI (Google Gemini) die vorhandenen Daten. (Messwerte und historischen Klimadaten dieses Sees)</p>
        <p>Die Daten werden beim Anfordern an Google Gemini übermittelt.</p>
        <p>Auchtung: Zur tatsächlichen Eissituation und zu offiziellen Freigaben liegen keine Daten vor. {EIS_PFLICHTSATZ}</p>
        {datenLaden && <p>Die Datengrundlage wird noch geladen.</p>}
        {!datenLaden && !hatDaten && <p>Für eine Einschätzung fehlen derzeit Messwerte und Klimakennzahlen.</p>}
        <button type="button" disabled={datenLaden || !hatDaten || ki.isStreaming} onClick={einschaetzungAnfordern}>
          {angefragt ? 'Neue Einschätzung anfordern' : 'KI-Einschätzung anfordern'}
        </button>
        {angefragt && (
          <KiAntwort
            key={anfrageNummer}
            text={antwort}
            isStreaming={ki.isStreaming}
            fehler={ki.fehler}
            abgebrochen={abgebrochen}
            onAbbrechen={abbrechen}
            onErneutVersuchen={einschaetzungAnfordern}
          />
        )}
      </section>
    </>
  );
}
