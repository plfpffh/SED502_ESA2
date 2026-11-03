/**
 * Klimatrend.tsx – Abschnitt „Klimatrend“ der Detailseite: Frosttage pro Winter ab 1950
 *
 * Das Diagramm (Recharts) wird erst geladen, wenn Daten vorliegen (React.lazy, siehe README).
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

import { lazy, Suspense } from 'react';
import type { FrosttageWinter } from '../typen/klima';
import FehlerMeldung from './FehlerMeldung';
import Ladeanimation from './Ladeanimation';

const KlimaDiagramm = lazy(() => import('./KlimaDiagramm'));

interface KlimatrendProps {
  seeName: string;
  frosttage: FrosttageWinter[];
  isLaden: boolean;
  fehler: string | null;
  onNeuLaden: () => void;
}

export default function Klimatrend({ seeName, frosttage, isLaden, fehler, onNeuLaden }: KlimatrendProps): React.JSX.Element {
  return (
    <section aria-labelledby="klimatrend-titel">
      <h2 id="klimatrend-titel">Klimatrend</h2>
      {isLaden ? <Ladeanimation text="Klimatrend wird geladen …" /> : (
        <>
          {fehler && <FehlerMeldung meldung={fehler} onErneutVersuchen={onNeuLaden} />}
          {frosttage.length > 0 && (
            <Suspense fallback={<Ladeanimation text="Diagramm wird geladen …" />}>
              <KlimaDiagramm seeName={seeName} frosttage={frosttage} />
            </Suspense>
          )}
        </>
      )}
    </section>
  );
}
