/**
 * SeenFilterProvider.tsx – hält den Filter der Seenliste, solange die App offen ist
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { useState } from 'react';
import type { Filter } from '../typen/ansicht';
import { STANDARD_FILTER } from '../utils/filter';
import { SeenFilterContext } from './SeenFilterContext';

interface SeenFilterProviderProps {
  children: React.ReactNode;
}

export default function SeenFilterProvider({ children }: SeenFilterProviderProps): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>(STANDARD_FILTER);
  return <SeenFilterContext.Provider value={{ filter, setFilter }}>{children}</SeenFilterContext.Provider>;
}
