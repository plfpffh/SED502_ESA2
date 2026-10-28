/**
 * Navigation.tsx – Hauptnavigation
 *
 * NavLink setzt bei der aktiven Seite automatisch aria-current="page".
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { NavLink } from 'react-router';

interface Eintrag {
  ziel: string;
  text: string;
}

const EINTRAEGE: Eintrag[] = [
  { ziel: '/', text: 'Start' },
  { ziel: '/seen', text: 'Seen' },
  { ziel: '/berater', text: 'KI-Berater' },
];

export default function Navigation() {
  return (
    <nav aria-label="Hauptnavigation">
      <ul className="navigation">
        {EINTRAEGE.map((eintrag) => (
          // end: „Start“ ist nur auf / aktiv, nicht auf jeder Unterseite
          <li key={eintrag.ziel}>
            <NavLink to={eintrag.ziel} end={eintrag.ziel === '/'}>
              {eintrag.text}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
