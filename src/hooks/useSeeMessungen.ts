/**
 * useSeeMessungen.ts – aktuelle Wassertemperaturen beider Landesquellen
 *
 * Lädt Salzburg und Oberösterreich unabhängig voneinander über useFetch (wie Promise.allSettled,
 * Kompendium Modul 03, Abschnitt 2.4): Fällt eine Quelle aus, liefert die andere trotzdem Werte,
 * der Fehler wird je Quelle gemeldet. neuLaden startet beide Abrufe erneut.
 * Wird über den SeeDatenContext einmal für alle Seiten verwendet (context/SeeDatenProvider.tsx).
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { useMemo } from 'react';
import { seen } from '../daten/seen';
import { zuSeeMessungenSalzburg } from '../datenquellen/hydrisSalzburg';
import { zuSeeMessungenOoe } from '../datenquellen/hydroOoe';
import type { UseSeeMessungen } from '../typen/schnittstellen';
import { uebersetzeQuelle } from '../utils/messungen';
import { useFetch } from './useFetch';

export function useSeeMessungen(): ReturnType<UseSeeMessungen> {
  const salzburg = useFetch<unknown>('/api/hydris-salzburg');
  const ooe = useFetch<unknown>('/api/hydro-ooe');

  const ausSalzburg = useMemo(
    () => uebersetzeQuelle(salzburg.daten, salzburg.fehler, zuSeeMessungenSalzburg, seen),
    [salzburg.daten, salzburg.fehler],
  );
  const ausOoe = useMemo(
    () => uebersetzeQuelle(ooe.daten, ooe.fehler, zuSeeMessungenOoe, seen),
    [ooe.daten, ooe.fehler],
  );
  const messungen = useMemo(
    () => [...ausSalzburg.messungen, ...ausOoe.messungen],
    [ausSalzburg.messungen, ausOoe.messungen],
  );

  const neuLaden = (): void => {
    salzburg.neuLaden();
    ooe.neuLaden();
  };

  return {
    messungen,
    isLaden: salzburg.isLaden || ooe.isLaden,
    fehler: { salzburg: ausSalzburg.fehler, ooe: ausOoe.fehler },
    neuLaden,
  };
}
