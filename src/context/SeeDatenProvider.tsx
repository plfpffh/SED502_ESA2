/**
 * SeeDatenProvider.tsx – lädt die Messwerte einmal und stellt sie allen Seiten bereit
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { useSeeMessungen } from '../hooks/useSeeMessungen';
import { SeeDatenContext } from './SeeDatenContext';

interface SeeDatenProviderProps {
  children: React.ReactNode;
}

export default function SeeDatenProvider({ children }: SeeDatenProviderProps): React.JSX.Element {
  const daten = useSeeMessungen();
  return <SeeDatenContext.Provider value={daten}>{children}</SeeDatenContext.Provider>;
}
