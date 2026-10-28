/**
 * NichtGefunden.tsx – Seite für unbekannte Adressen (404)
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { Link } from 'react-router';

export default function NichtGefunden() {
  return (
    <>
      <h1>Seite nicht gefunden</h1>
      <p>Diese Adresse gibt es nicht.</p>
      <p>
        Weiter zur <Link to="/">Startseite</Link> oder zur <Link to="/seen">Übersicht aller Seen</Link>.
      </p>
    </>
  );
}
