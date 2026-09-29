# ESA 2 – Planung „Seen im Klimawandel“

Gruppenarbeit SED502 Front-End Development · 2 Personen · 40 Punkte
Abgabe **Sa, 05.12.2026, 23:59** im Online-Campus · Gruppe melden bis **Mi, 25.11.2026**

| Rolle | Name | Schwerpunkt |
|---|---|---|
| Person A | plfpffh | Salzburg, Seenliste, App-Rahmen, KI-Technik |
| Person B | _(Name)_ | Oberösterreich, Klimatrend, Seedetail, KI-Berater |

Repository: <https://github.com/plfpffh/SED502_ESA2> · Diese Datei ist die verbindliche Planung. Änderungen daran laufen wie Code über einen Pull Request.

> **Kurz für Person B:** Lies zuerst Abschnitt 1–3 (was wir bauen), dann Abschnitt 5 (gemeinsamer Vertrag) und dann **deinen** Abschnitt in 6. Alles, was du vor dem Kick-off erledigen musst, steht in Abschnitt 4.

---

## 1. Die App in einem Satz

Eine React-App, die für 14 Seen in Salzburg und Oberösterreich die **aktuelle Wassertemperatur live** zeigt, mit **Frost- und Hitzedaten seit 1940** einordnet, ob man baden oder eislaufen kann, und von einer **KI** eine gestreamte Einschätzung und Empfehlung erhält.

„Eislaufen möglich“ ist dabei ein **klimatischer Hinweis** (längste Serie von mind. 14 Tagen mit Tagesmittel unter 0 °C), **keine Freigabe**.

### Ausgangsbasis: ESA 1

Die statische Seite aus ESA 1 (Repository von Person A: <https://github.com/plfpffh/SED502_ESA1>) liefert bereits:

| ESA 1 | wird in ESA 2 zu | Änderung |
|---|---|---|
| `src/data/seen.ts` (Stammdaten 14 Seen) | `src/daten/seen.ts` | Messwerte raus, Stationsnummern und lat/lng rein |
| `src/data/typen.ts` | `src/typen/see.ts`, `src/typen/messung.ts` | siehe Abschnitt 5 |
| `src/logic/typen.ts` (`Filter`, `SeeAnsicht`, `Statistik`) | `src/typen/ansicht.ts` | um den Umschalter „Baden / Eissport“ erweitert (Abschnitt 5) |
| `src/logic/funktionen.ts` (Filtern, Sortieren, Kennzahlen) | `src/utils/seen.ts` | `waehleSeen()` bekommt Seen, Messungen und Klimakennzahlen als Parameter statt sie selbst zu laden |
| `src/gui/…` (DOM-Templates) | `src/komponenten/`, `src/seiten/` | wird durch React-Komponenten ersetzt |

Die Dateien wurden zuerst **unverändert** übernommen (Commit `80e5646`), nur Importpfade und Dateiköpfe sind angepasst. Die Änderungen aus der dritten Spalte folgen jeweils in eigenen Commits. So bleibt in der Historie nachvollziehbar, was aus ESA 1 stammt und was neu ist.

Das Prinzip aus ESA 1 bleibt: **Datenquellen → reine Funktionen → Darstellung.** Komponenten rechnen nicht selbst, sie bekommen fertige `SeeAnsicht`-Objekte.

## 2. Anforderungen laut Angabe (Kurzfassung)

- React 18+, TypeScript, Vite · nur funktionale Komponenten · Props mit Interfaces · kein `any` ohne Begründung
- `useState`/`useEffect` korrekt, richtiges Abhängigkeits-Array, State immutabel aktualisieren
- Mind. **eine öffentliche REST-API** vollständig eingebunden mit **loading, success und error**, Daten aufbereitet (kein rohes JSON)
- Mind. **ein KI-Feature** (OpenAI, Anthropic oder Gemini) mit echtem Mehrwert, **Streaming** bei Antworten > 1 Satz, API-Schlüssel in `.env` und **nicht im Repository**
- Mind. **3 Seiten**, React Router, Ordner `komponenten/`, `seiten/`, `hooks/` (Modul 04), wiederverwendbare Logik in Custom Hooks
- Jede Person hat **erkennbare, gleichwertige Commits** · Aufgabenverteilung in der README
- README: Beschreibung und Zielgruppe, Technologien und APIs, Installation, Aufgabenverteilung, AI-Einsatz (Tools, wofür, Ergebnis)

**Bewertung:** React & TypeScript 10 · REST-API mit drei Zuständen 8 · AI-Feature mit Streaming 8 · Anwendungsidee 6 · Codequalität 5 · Doku/Aufgabenverteilung/AI-Transparenz 3 = **40 Punkte**, positiv ab 20.
Verspätet bis 12.12.2026 mit 20 % Abzug, danach 0 Punkte.

## 3. Datenquellen und Architektur

| Quelle | URL | Inhalt | CORS | zuständig |
|---|---|---|---|---|
| Hydris Salzburg | `https://www.salzburg.gv.at/wasser/hydro/grafiken/data.json` | alle Stationen; Seen = Einträge mit `values.WT` und einem `plots`-Schlüssel, der mit `_Seen` beginnt | nein → Proxy | A |
| Hydro Oberösterreich | `https://hydro.ooe.gv.at/daten/internet/layers/5/index.json` | Wassertemperatur-Stationen, Wert in `ts_value`, Zeit in `timestamp` | nein → Proxy | B |
| Open-Meteo Historical | `https://archive-api.open-meteo.com/v1/archive` | Tageswerte seit 1940 → Frost-, Eis-, Hitzetage | ja | B |
| Open-Meteo Forecast | `https://api.open-meteo.com/v1/forecast` | Lufttemperatur-Prognose 7 Tage | ja | B |

> ⚠️ Hydris und Hydro OÖ sind **keine offiziell dokumentierten APIs**. URLs, Feldnamen und CORS-Verhalten **vor Beginn im Browser prüfen** (jede Person für ihre Quelle). In der README Quelle, Abrufdatum und Hinweis „Format kann sich ändern“ angeben. Fehler dieser Quellen abfangen, die App darf nicht abstürzen.

### Messstellen je See

Stationsnummern **vor Beginn gegen die Live-Daten prüfen**.

| See | Salzburg (`number`) → A | OÖ (`station_no`) → B |
|---|---|---|
| Attersee | 205328 (Unterach) | 5290 (Kammer), 5210 (Unterach) |
| Traunsee | – | 4510 (Ebensee) |
| Mondsee | 205286 | 5020 |
| Wolfgangsee | 203646 (St. Gilgen) | 4310 (Strobl) – **nicht** 4320, das ist die Ischl |
| Hallstätter See | – | 4190 (Steeg), 4130 (Lahn) |
| Wallersee | 203588 | – |
| Obertrumer See | 203612 | – |
| Zeller See | 203117 | – |
| Mattsee | 203604 | – |
| Irrsee | – | 5005 |
| Fuschlsee | 203653 | – |
| Grabensee | 204131 | – |
| Almsee | – | 6120 |
| Holzöstersee | – | 1230 |

Die OÖ-Koordinaten sind im österreichischen Lambert-System. Koordinaten für die Karte deshalb **in den Stammdaten** (`src/daten/seen.ts`) als lat/lng pflegen, nicht umrechnen.

### Datenfluss

```
Browser (React)                                  Vercel Serverless Functions
───────────────                                  ───────────────────────────
useSeeMessungen ─fetch─► /api/hydris-salzburg ─► salzburg.gv.at     (A)
                ─fetch─► /api/hydro-ooe       ─► hydro.ooe.gv.at    (B)
        │  Rohdaten → datenquellen/*.ts (Adapter) → SeeMessung[]
        ▼
utils/seen.ts  waehleSeen(seen, messungen, klima, filter) → SeeAnsicht[] + Statistik
        ▼
seiten/ + komponenten/  (nur Darstellung)

useKlimatrend ─fetch──────────────────────────► open-meteo.com      (B, direkt, CORS ok)
useAI         ─fetch─► /api/ki (Streaming)    ─► LLM-API            (A, Key nur hier!)
```

**Warum Serverless Functions?**
1. Die beiden Landesquellen erlauben keinen Browser-Zugriff (kein CORS).
2. Der **API-Key bleibt auf dem Server.** Alles, was in Vite mit `VITE_` beginnt, landet im ausgelieferten JavaScript und ist für jede Person sichtbar, auch wenn es in `.env` steht. Die Variable heißt deshalb `ANTHROPIC_API_KEY` bzw. `GEMINI_API_KEY` **ohne** `VITE_`-Präfix und wird nur in `api/ki.ts` gelesen.

> **Bewusste Abweichung vom Kompendium:** Modul 05 (Abschnitt 1.4) legt den Key als `VITE_…` ab und ruft die LLM-API direkt aus dem Browser auf. Damit steht der Key im ausgelieferten JavaScript und kann von jeder Person ausgelesen und missbraucht werden. Die Angabe verlangt, dass der Key „sicher in einer .env-Datei verwaltet und nicht im Repository“ ist. Beides erfüllen wir: Der Key liegt lokal in `.env` (nicht im Repository) und auf Vercel als Umgebungsvariable, gelesen wird er nur serverseitig. Diese Begründung steht auch im README.

Lokal starten mit `npx vercel dev` (führt Vite **und** die `/api`-Funktionen aus). `npm run dev` allein kennt `/api` nicht.

## 4. Vor dem Kick-off (jede Person)

- [ ] GitHub-Konto; unter *Settings → Emails* „Keep my email addresses private“ aktivieren und lokal die `…@users.noreply.github.com`-Adresse setzen (`git config user.email …`). Sonst steht die private oder berufliche Adresse in jedem Commit des öffentlichen Repos.
- [ ] Node.js (LTS) installiert, `node -v` funktioniert
- [ ] Vercel-Konto (kostenlos, mit GitHub anmelden), `npx vercel login` einmal ausführen
- [ ] Eigene Datenquelle im Browser aufrufen und prüfen, ob URL und Feldnamen aus Abschnitt 3 noch stimmen
- [ ] Person A: LLM-Anbieter mit B abstimmen und API-Key erzeugen (Abschnitt 7)
- [ ] Kompendium Modul 03–05 griffbereit (fetch, React, useAI-Hook)

## 5. Gemeinsamer Vertrag (am Kick-off gemeinsam, erster Commit)

Diese Typen und Funktionssignaturen **zuerst gemeinsam** festlegen und committen. Danach kann jede Person unabhängig arbeiten, weil beide Adapter dasselbe Format liefern und die Seiten gegen dieselben Typen gebaut werden. Wer den Vertrag später ändern will, spricht das vorher ab.

```ts
// src/typen/see.ts
export type Bundesland = 'Salzburg' | 'Oberösterreich';
export type Datenquelle = 'Hydris Salzburg' | 'Hydrographischer Dienst OÖ';

export interface Station {
  quelle: Datenquelle;
  nummer: string;         // Hydris: number, OÖ: station_no
  messstelle: string;     // z.B. 'Kammer'
}

export interface See {
  id: string;             // z.B. 'attersee'
  name: string;
  bundeslaender: Bundesland[];
  flaecheKm2: number;
  maxTiefeM: number;
  seehoeheM: number;
  lat: number;
  lng: number;
  stationen: Station[];
}

// src/typen/messung.ts – gemeinsames Format ALLER Adapter
export interface SeeMessung {
  seeId: string;
  messstelle: string;
  quelle: Datenquelle;
  wassertemperatur: number;
  zeitpunkt: string;      // ISO
}

// src/typen/klima.ts
export interface Klimakennzahlen {
  seeId: string;
  winter: string;               // z.B. '2025/26'
  frosttage: number;            // Tagesminimum < 0 °C
  eistage: number;              // Tagesmaximum < 0 °C
  laengsteKaelteserie: number;  // längste Serie von Tagen mit Tagesmittel < 0 °C
  kaeltesumme: number;          // Summe der negativen Tagesmittel
  hitzetage: number;            // Tagesmaximum ≥ 30 °C (Sommer davor)
}

// src/typen/ansicht.ts – aus ESA 1 übernommen: Filter, SeeAnsicht, MessstelleAnsicht, Statistik
```

```ts
// Signaturen, gegen die beide arbeiten
// src/datenquellen/hydrisSalzburg.ts (A) und src/datenquellen/hydroOoe.ts (B)
export function zuSeeMessungen(roh: unknown, seen: See[]): SeeMessung[];
//   wirft einen Error mit verständlicher Meldung, wenn das Format nicht passt

// src/hooks/useFetch.ts (A)
export function useFetch<T>(url: string): { daten: T | null; isLaden: boolean; fehler: string | null; neuLaden: () => void };

// src/hooks/useSeeMessungen.ts (A)
export function useSeeMessungen(): {
  messungen: SeeMessung[];       // alles, was geladen werden konnte
  isLaden: boolean;
  fehler: { salzburg: string | null; ooe: string | null };  // eine Quelle darf ausfallen
};

// src/utils/seen.ts (A, aus ESA 1)
export function waehleSeen(seen: See[], messungen: SeeMessung[], klima: Klimakennzahlen[], filter: Filter): Auswahl;
export function zuAnsicht(see: See, messungen: SeeMessung[]): SeeAnsicht;

// src/hooks/useKlimatrend.ts (B)
export function useKlimatrend(see: See): { kennzahlen: Klimakennzahlen[]; isLaden: boolean; fehler: string | null };

// src/typen/ai.ts (A) – nach Kompendium Modul 05, Abschnitt 2.1, ergänzt um id
export type Rolle = 'system' | 'user' | 'assistant';
export interface Nachricht {
  id: string;          // eindeutiger key für Listen (nie den Array-Index verwenden, Modul 04)
  role: Rolle;
  content: string;
}
//   Beim Senden an die API nur { role, content } übertragen, die id bleibt in der App.

// src/hooks/useAI.ts (A) – Schnittstelle wie Kompendium Modul 05, Abschnitt 4.1
export function useAI(optionen?: { systemPrompt?: string; maxNachrichten?: number }): {
  nachrichten: Nachricht[];
  isStreaming: boolean;
  fehler: string | null;
  sendeNachricht: (inhalt: string) => Promise<void>;
  abbrechen: () => void;       // Stream abbrechen (Modul 05, Übung 3.1)
  zuruecksetzen: () => void;
};
```

**Begriffe sauber verwenden:** Frosttag (Tmin < 0 °C), Eistag (Tmax < 0 °C) und Hitzetag (Tmax ≥ 30 °C) sind feste meteorologische Definitionen. Open-Meteo liefert dafür `temperature_2m_min`, `temperature_2m_max` und `temperature_2m_mean`.

**Fehlende Messwerte (Regel aus ESA 1, gilt für alle Seiten):** Liefert eine Quelle für einen See keinen Wert, wird der See **nicht ausgeblendet**, sondern mit „Wert aktuell nicht vorhanden“ angezeigt und steht bei jeder Sortierung und jedem Temperaturfilter am Ende. Sonst würden Nutzer\*innen annehmen, der See erfülle den Filter nicht, obwohl wir schlicht keine Information haben. `filtereSeen()` in `utils/seen.ts` setzt das bereits um. `SeeAnsicht.temperatur` ist dann `null`. Komponenten zeigen `null` nie als „0 °C“ an.

### Umschalter „Baden / Eissport“ (neu gegenüber ESA 1)

ESA 1 filtert nur nach Wassertemperatur zum Baden. Für Eissport reicht die Wassertemperatur nicht: Ob ein See zufriert, hängt vor allem davon ab, wie lange die **Lufttemperatur** unter 0 °C bleibt, und unter einer Eisdecke misst die Messstelle oft weiterhin einige Grad über 0 °C. Deshalb bekommt die Seenliste einen Umschalter:

```
Aktivität:  (•) Baden   ( ) Eissport

Baden:      Wassertemperatur mindestens [====|----] 20 °C   [x] alle          ← wie ESA 1
Eissport:   Tagesmittel der Luft unter 0 °C an mind. [14 ▾] Tagen am Stück  [x] alle
            (Auswahl 7 / 14 / 21 / 28, Standard 14)
            „Klimatischer Hinweis, keine Freigabe. Eisflächen nur nach offizieller Freigabe durch die Gemeinde betreten.“
```

- Grundlage im Eissport-Modus ist `laengsteKaelteserie` des **letzten Winters** (z.B. 2025/26) aus `Klimakennzahlen`.
- Die Regel „Fehlende Messwerte“ gilt auch hier. Seen ohne Klimadaten bleiben sichtbar, zeigen „Wert aktuell nicht vorhanden“ und stehen am Ende.
- Sortierung „Kälteserie“ kommt dazu und ist im Eissport-Modus der Standard.
- Die Wassertemperatur bleibt im Eissport-Modus auf der Karte sichtbar, filtert aber nicht.

```ts
// src/typen/ansicht.ts – Erweiterung gegenüber ESA 1
export type Aktivitaet = 'baden' | 'eissport';
export type Sortierung = 'name' | 'temperatur' | 'tiefe' | 'flaeche' | 'kaelteserie';

export interface Filter {
  bundesland: Bundesland | 'alle';
  tiefe: Tiefenkategorie | 'alle';
  sortierung: Sortierung;
  aktivitaet: Aktivitaet;
  mindestTemperatur: number | null;   // nur Baden,    null = alle
  mindestKaeltetage: number | null;   // nur Eissport, null = alle
}

// SeeAnsicht zusätzlich:
//   laengsteKaelteserie: number | null;   // letzter Winter, null = keine Klimadaten

// src/hooks/useKlimaAlle.ts (B) – Kennzahlen des letzten Winters für alle Seen
export function useKlimaAlle(seen: See[]): { kennzahlen: Klimakennzahlen[]; isLaden: boolean; fehler: string | null };
```

Open-Meteo einmal pro See abfragen (14 Anfragen) oder, falls die API mehrere Koordinaten in einer Anfrage erlaubt, gebündelt. **Vor Beginn in der Open-Meteo-Doku prüfen (B).**

**Offen, am Kick-off entscheiden:** Grenzen der Badeeinschätzung. ESA 1 verwendet ab 24 °C „warm“, ab 20 °C „angenehm“, ab 16 °C „frisch“, darunter „kalt“ (`badeEinschaetzung()` in `utils/seen.ts`).

## 6. Aufgabenverteilung

Jede Person übernimmt **einen vertikalen Strang**: Proxy → Adapter → Hook → Seite. So hat jede Person Commits in `api/`, `datenquellen/`, `hooks/`, `komponenten/` und `seiten/`, und die Beiträge sind gleichwertig und in der Git-Historie gut erkennbar.

### Person A – Salzburg, Seenliste, App-Rahmen, KI-Technik

**Setup (zuerst, damit B starten kann)**
- ✅ Repository angelegt (`plfpffh/SED502_ESA2`)
- ✅ Vite + React + TypeScript + ESLint, `.gitignore` inkl. `.env` und `.vercel` (Commit `7492370`)
- ✅ Stammdaten, Datenmodell und Filterlogik aus ESA 1 unverändert übernommen (Commit `80e5646`)
- ☐ B als Collaborator einladen, `main` schützen (Merge nur per Pull Request)
- ☐ React Router, `vercel.json` (SPA-Rewrite), `.env.example`
- ☐ `App.tsx` (Routen), `komponenten/Navigation.tsx`, `seiten/NichtGefunden.tsx`
- ☐ `daten/seen.ts` umbauen: Messwerte raus, Stationen und lat/lng rein; `typen/messung.ts` anlegen (Abschnitt 5)

**Salzburg-Strang**
- `api/hydris-salzburg.ts` – Proxy, liefert nur Seen-Stationen
- `src/datenquellen/hydrisSalzburg.ts` – Adapter → `SeeMessung[]`
- `src/hooks/useFetch.ts` – generischer Hook mit loading/success/error
- `src/hooks/useSeeMessungen.ts` – führt Salzburg + OÖ zusammen (nutzt den Adapter von B)

**Seiten und Komponenten**
- `seiten/Seenliste.tsx` (`/seen`) – Liste, Filter, Sortierung, Kennzahlen; Umschalter „Baden / Eissport“ (Abschnitt 5): Baden wie in ESA 1 (Regler 0–30 °C plus Checkbox „alle“), Eissport mit Auswahl der Kältetage; `filtereSeen()` in `utils/seen.ts` um den Eissport-Filter und die Sortierung „Kälteserie“ erweitern
- `komponenten/SeeKarte.tsx`, `SeenFilter.tsx`, `LadeAnimation.tsx`, `FehlerMeldung.tsx`

**KI-Technik**
- `api/ki.ts` – LLM-Aufruf mit Streaming, Key nur hier
- `src/hooks/useAI.ts` – liest den Stream, liefert Text schrittweise

### Person B – Oberösterreich, Klimatrend, Seedetail, KI-Berater

**Oberösterreich-Strang**
- `api/hydro-ooe.ts` – Proxy, liefert nur die Stationen aus Abschnitt 3
- `src/datenquellen/hydroOoe.ts` – Adapter → `SeeMessung[]` (Signatur siehe Abschnitt 5)

**Klimatrend**
- `src/datenquellen/openMeteo.ts` + `src/hooks/useKlimatrend.ts` (ein See, alle Winter, für SeeDetail)
- `src/hooks/useKlimaAlle.ts` – letzter Winter für alle Seen, liefert `laengsteKaelteserie` für den Eissport-Filter der Seenliste (A)
- `src/utils/klima.ts` – Frost-, Eis- und Hitzetage, längste Kälteserie, Kältesumme (reine, testbare Funktionen ohne React)
- `komponenten/KlimaDiagramm.tsx` (z.B. mit Recharts): Frosttage pro Winter, 1950 bis heute

**Seiten**
- `seiten/SeeDetail.tsx` (`/seen/:id`) – Live-Temperatur aller Messstellen, Klimatrend, KI-Einschätzung; fehlt ein Wert, „Wert aktuell nicht vorhanden“ anzeigen (Regel in Abschnitt 5). Die KI bekommt in diesem Fall ausdrücklich mitgeteilt, dass kein Messwert vorliegt
- `seiten/KiBerater.tsx` (`/berater`) + `komponenten/KiAntwort.tsx` – „Wohin am Wochenende?“ (nutzt `useAI` von A)
- `seiten/Startseite.tsx` (`/`) – Kurzüberblick; Landkarte (`komponenten/SeenKarte.tsx`, react-leaflet) ist optional und kann nach ESA 3 wandern

### Gemeinsam
- Vertrag aus Abschnitt 5 am Kick-off
- System-Prompt der KI (Abschnitt 8)
- Jeder Pull Request wird von der **anderen** Person reviewt
- README: jede Person dokumentiert ihren Strang und ihren AI-Einsatz selbst; Endredaktion A

### Abhängigkeiten zwischen A und B

| B braucht von A | bis |
|---|---|
| Repository, Setup, Router, `typen/`, `daten/seen.ts` | Ende Woche 1 |
| `useFetch` | Ende Woche 1 |
| `useAI` | Ende Woche 2 |

| A braucht von B | bis |
|---|---|
| `datenquellen/hydroOoe.ts` (für `useSeeMessungen`) | Ende Woche 2 |
| `useKlimaAlle` (für den Eissport-Filter) | Ende Woche 3 |

Bis ein Teil fertig ist, gegen den Vertrag mit Testdaten arbeiten (z.B. ein fixes `SeeMessung[]`-Array).

## 7. KI-Feature

**Wo:**
1. **SeeDetail:** „Einschätzung“ – die KI bekommt die aktuellen Messwerte und die berechneten Klimakennzahlen und erklärt sie verständlich (z.B. Trend der Frosttage).
2. **KI-Berater:** „Ich will am Wochenende baden / eislaufen, ich wohne in …“ → Empfehlung auf Basis der aktuellen Messungen und der 7-Tage-Prognose.

**Nutzerführung (Kompendium Modul 05, Abschnitte 3 und 6):**
- Typing-Indikator, solange noch kein Text gestreamt wurde
- „Abbrechen“ während des Streamings (`reader.cancel()`), „Erneut versuchen“ bei Fehlern, „Kopieren“ für die Antwort
- Antwortbereich mit `aria-live="polite"`, per Tastatur bedienbar
- deutlich als **KI-generiert** gekennzeichnet
- verständliche Fehlermeldungen je Fehlerart (429 Rate Limit, 401/403, Netzwerk), nie roher API-Text
- Kosten begrenzen: `max_tokens` setzen, Verlauf mit `maxNachrichten` kürzen

**Technik:** Streaming ist Pflicht (Antworten > 1 Satz). Anbieter gemeinsam wählen: **Google Gemini** (kostenloses Kontingent) oder **Anthropic Claude Haiku 4.5** (günstig, im Kompendium Modul 05 verwendet).

## 8. Regeln für den System-Prompt

Das Thema berührt Sicherheit (Eis) und Klimadaten. Fachliche Genauigkeit hat deshalb Vorrang vor einer möglichst unterhaltsamen Antwort.

- Die KI **interpretiert nur die mitgelieferten Zahlen** und erfindet keine Messwerte, Jahreszahlen oder Studien.
- Fehlt ein Messwert, sagt die KI das offen („Für den Mondsee liegt gerade kein Messwert vor“) und schätzt die Temperatur **nicht**.
- Klimakennzahlen werden **im Code berechnet** (`utils/klima.ts`), nicht von der KI.
- Die KI sagt **nie**, dass Eis tragfähig oder sicher ist. Pflichtsatz bei Eis-Themen: „Eisflächen nur nach offizieller Freigabe durch die Gemeinde betreten.“
- Antworten sind in der App als **KI-generiert** gekennzeichnet.
- „Eislaufen möglich“ heißt in der App ausdrücklich **„klimatischer Hinweis“**, nicht „Freigabe“.

## 9. Git-Workflow

- `main` ist geschützt, gearbeitet wird auf `feature/<person>-<thema>` (z.B. `feature/b-hydro-ooe`).
- Merge nur per **Pull Request** mit Review durch die andere Person.
- Kleine, aussagekräftige Commits („Adapter für Hydro OÖ mit Fehlerbehandlung“), kein Mega-Commit am Ende.
- Jede Person committet **von ihrem eigenen GitHub-Konto**.
- `.env` **nie** committen. Wurde ein Key versehentlich gepusht: sofort beim Anbieter widerrufen und neu erzeugen.
- Vor jedem Pull Request: `npm run build` läuft lokal fehlerfrei.

## 10. Zeitplan

| Zeitraum | A | B |
|---|---|---|
| ✅ Di 29.09. (Vorarbeit) | Setup (`7492370`), Übernahme aus ESA 1 (`80e5646`), README und Planung | – |
| bis Di 03.11. | ESA 1 einzeln abgeben | ESA 1 einzeln abgeben |
| **Kick-off** Mi 04.11. | Vertrag (Abschnitt 5) gemeinsam, **Gruppe im Online-Campus melden** | ← gemeinsam |
| Woche 1 (bis So 08.11.) | restliches Setup (Router, `vercel.json`, `.env.example`), Stammdaten umbauen, `useFetch`, Salzburg-Proxy | OÖ-Proxy, Open-Meteo prüfen |
| Woche 2 (09.–15.11.) | Salzburg-Adapter, `api/ki.ts`, `useAI` | OÖ-Adapter, `utils/klima.ts`, `useKlimatrend` |
| Woche 3 (16.–22.11.) | `useSeeMessungen`, Seenliste, Filter inkl. Umschalter Baden/Eissport, Lade-/Fehler-Komponenten | `useKlimaAlle`, SeeDetail, KlimaDiagramm |
| Woche 4 (23.–29.11.) | Integration, README-Rohfassung | KI-Berater, KI-Einschätzung auf SeeDetail, Startseite |
| **Mi 25.11.** | spätestens: Gruppe gemeldet | |
| 30.11.–Sa 05.12. | Puffer, Checkliste, README-Endredaktion, **Abgabe** | Puffer, Checkliste, eigener README-Teil |

## 11. Checkliste vor Abgabe

- [ ] React 18+, TypeScript, Vite; nur funktionale Komponenten; Props mit Interfaces; kein `any`
- [ ] `useEffect` mit korrekten Abhängigkeiten, State immutabel aktualisiert
- [ ] Beide Landesquellen eingebunden – loading, success **und** error sichtbar; fällt eine Quelle aus, zeigt die andere trotzdem Werte, und die betroffenen Seen erscheinen mit „Wert aktuell nicht vorhanden“ am Ende der Liste
- [ ] Daten aufbereitet dargestellt, kein rohes JSON
- [ ] Umschalter „Baden / Eissport“ funktioniert; Eissport ist als klimatischer Hinweis gekennzeichnet, mit Pflichtsatz zur Freigabe durch die Gemeinde
- [ ] KI-Feature mit echtem Mehrwert, **Streaming**, Key nur serverseitig; KI-Antworten gekennzeichnet, `aria-live`, Abbrechen und Retry, `.env` nicht im Repository
- [ ] Mind. 3 Seiten, React Router, Ordner `komponenten/`, `seiten/`, `hooks/`
- [ ] Wiederverwendbare Logik in Custom Hooks
- [ ] Beide Personen haben erkennbare, gleichwertige Commits
- [ ] README: Beschreibung & Zielgruppe, Technologien & APIs, Installation, Aufgabenverteilung, AI-Einsatz (Tools, wofür, Ergebnis; welche Daten gehen an die LLM-API, welches Modell)
- [ ] README-Aufgabenverteilung auf den **Ist-Stand** umgestellt: wer hat was tatsächlich umgesetzt (mit den wichtigsten Dateien je Person), keine *geplant*-Markierungen mehr, Abweichungen vom Plan korrigiert
- [ ] `npm run build` ohne Fehler
- [ ] Abgabe: Repository-URL **und** Namen beider Personen im Abgabebereich

## 12. Schon an ESA 3 denken

Details in der ESA-3-Planung (folgt nach Abgabe von ESA 2). Bereits in ESA 2 beachten:

- `vercel.json` mit SPA-Rewrite von Anfang an
- Jede Seite als Default-Export, damit sie später mit `React.lazy()` geladen werden kann
- `useFetch` in mehreren Komponenten nutzen → erfüllt „Custom Hook in mehr als einer Komponente“
- Fehlermeldungen von Anfang an benutzerfreundlich („Die Messwerte aus Oberösterreich sind gerade nicht erreichbar.“) statt roher API-Fehler
- Mobile First, semantisches HTML, sichtbare Fokus-Stile, Liste als barrierefreie Alternative zur Karte
