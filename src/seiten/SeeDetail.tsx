/**
 * SeeDetail.tsx – Detailseite eines Sees (/seen/:id)
 *
 * Platzhalter für das Routing. Umsetzung: Christoph Hauser (Person B), siehe docs/PLANUNG.md, Abschnitt 6.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann (Platzhalter)
 */

import { useParams } from 'react-router';

export default function SeeDetail(): React.JSX.Element {
  const { id } = useParams();
  return (
    <>
      <h1>Seedetail</h1>
      <p>Hier entsteht die Detailseite für den See „{id}“.</p>
    </>
  );
}
