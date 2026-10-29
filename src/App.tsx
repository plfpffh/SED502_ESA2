/**
 * App.tsx – Routen der Anwendung
 *
 * Alle Seiten liegen unter einem gemeinsamen Layout (Kopfzeile mit Navigation, Fußzeile).
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { Route, Routes } from 'react-router';
import Layout from './komponenten/Layout';
import KiBerater from './seiten/KiBerater';
import NichtGefunden from './seiten/NichtGefunden';
import SeeDetail from './seiten/SeeDetail';
import Seenliste from './seiten/Seenliste';
import Startseite from './seiten/Startseite';

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Startseite />} />
        <Route path="seen" element={<Seenliste />} />
        <Route path="seen/:id" element={<SeeDetail />} />
        <Route path="berater" element={<KiBerater />} />
        <Route path="*" element={<NichtGefunden />} />
      </Route>
    </Routes>
  );
}
