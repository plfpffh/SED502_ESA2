/**
 * SeenFilterContext.ts – Filter der Seenliste über Seitenwechsel hinweg (Kompendium Modul 04, Abschnitt 7)
 *
 * Läge der Filter als State in der Seenliste, ginge er beim Wechsel auf eine Detailseite verloren,
 * weil die Seenliste dabei entfernt wird. Im Context bleibt z.B. der Modus Eissport erhalten.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { createContext, useContext } from 'react';
import type { Filter } from '../typen/ansicht';

export interface SeenFilterZustand {
  filter: Filter;
  setFilter: (filter: Filter) => void;
}

export const SeenFilterContext = createContext<SeenFilterZustand | null>(null);

export function useSeenFilter(): SeenFilterZustand {
  const context = useContext(SeenFilterContext);
  if (!context) {
    throw new Error('useSeenFilter muss innerhalb von SeenFilterProvider verwendet werden.');
  }
  return context;
}
