/**
 * SeeDetail.tsx – Detailseite eines Sees (/seen/:id)
 *
 * Klimatrend mit Diagramm und Tabelle.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { seen } from '../daten/seen';
import { useKlimatrend } from '../hooks/useKlimatrend';
import FehlerMeldung from '../komponenten/FehlerMeldung';
import Ladeanimation from '../komponenten/Ladeanimation';
import type { See } from '../typen/see';
import NichtGefunden from './NichtGefunden';

const KlimaDiagramm = lazy(() => import('../komponenten/KlimaDiagramm'));

export default function SeeDetail(): React.JSX.Element {
  const { id } = useParams();
  const see = seen.find((see) => see.id === id);
  if (!see) return <NichtGefunden />;
  return <SeeDetailInhalt key={see.id} see={see} />;
}

function SeeDetailInhalt({ see }: { see: See }): React.JSX.Element {
  const { kennzahlen, isLaden, fehler, neuLaden } = useKlimatrend(see);
  return (
    <>
      <p><Link to="/seen">Zur Seenübersicht</Link></p>
      <h1>{see.name}</h1>
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
    </>
  );
}
