/**
 * Layout.tsx – gemeinsamer Rahmen aller Seiten
 *
 * Kopfzeile mit Navigation, darunter die jeweilige Seite (Outlet), unten die Fußzeile mit den Datenquellen.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { Outlet } from 'react-router';
import Navigation from './Navigation';

export default function Layout() {
  return (
    <>
      <header className="kopfzeile">
        <p className="app-name">Seen im Klimawandel</p>
        <Navigation />
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="fusszeile">
        <p>
          Daten: Hydris Salzburg, Hydrographischer Dienst Oberösterreich, Open-Meteo. Studienprojekt SED502, FernFH.
        </p>
      </footer>
    </>
  );
}
