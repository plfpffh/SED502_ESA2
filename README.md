# Seen im Klimawandel – Salzburg & Oberösterreich

[![CI](https://github.com/plfpffh/SED502_ESA2/actions/workflows/ci.yml/badge.svg)](https://github.com/plfpffh/SED502_ESA2/actions/workflows/ci.yml)

Gruppenprojekt für die Einsendeaufgabe 2 im Modul **SED502 Front-End Development** (Ferdinand Porsche FernFH, WS 2026/27) von **plfpffh** und **cchhrriiss**.

Die App zeigt für 14 Seen im Salzburger Seenland und im Salzkammergut die **aktuelle Wassertemperatur** und ordnet sie mit **Klimadaten seit dem Winter 1950/51** ein. Eine **KI** (Google Gemini) erklärt die Zahlen und empfiehlt, welcher See sich für einen Ausflug in den nächsten sieben Tagen eignet.

**Zielgruppe:** Badegäste und Eissport-Interessierte in Salzburg und Oberösterreich sowie alle, die sehen wollen, wie sich der Klimawandel an den Seen der Region zeigt.

**Ausgangsbasis:** Die statische Seite aus der Einzelarbeit ESA 1 (<https://github.com/plfpffh/SED502_ESA1>). Stammdaten, Datenmodell und Filterlogik wurden zuerst unverändert übernommen (Commit `80e5646`) und danach in eigenen Commits erweitert. So bleibt in der Historie nachvollziehbar, was aus ESA 1 stammt und was neu ist.

## Was die App kann

| Seite | Inhalt |
|---|---|
| **Start** (`/`) | Überblick über die drei Bereiche mit Links |
| **Seen** (`/seen`) | Alle 14 Seen als Karten mit aktueller Wassertemperatur. Filter nach Bundesland und Tiefe, Sortierung, Kennzahlen der Auswahl. Umschalter **Baden / Eissport**: Baden filtert nach Wassertemperatur (Regler 0–30 °C), Eissport nach der aktuellen Kälteserie (siehe unten) |
| **See-Detail** (`/seen/:id`) | Stammdaten, Messwert jeder Messstelle mit Quelle und Zeitpunkt, Frosttage pro Winter seit 1950/51 als Diagramm und Tabelle. Auf Knopfdruck erklärt die KI diese Daten, ergänzt um Eistage, Hitzetage und Kälteserie des letzten Winters |
| **KI-Berater** (`/berater`) | Aktivität (Baden oder Eissport), Ausflugstag und Region wählen. Die KI empfiehlt passende Seen auf Basis der Messwerte und der Wetterprognose für diesen Tag und sagt offen, wenn keiner passt |

**Was „Eislaufen möglich“ bedeutet:** Die App zählt, wie viele Tage am Stück **bis gestern** das Tagesmittel der Lufttemperatur am See unter 0 °C lag (aktuelle Kälteserie). Ab 14 Tagen zeigt sie „Eislaufen klimatisch möglich“. Das ist ausschließlich ein **klimatischer Hinweis und keine Freigabe**. Über Eisdicke oder Freigaben liegen keine Daten vor. Eisflächen nur nach offizieller Freigabe durch die Gemeinde betreten.

**Fehlt ein Messwert**, wird der See nicht ausgeblendet, sondern mit „Wert aktuell nicht vorhanden“ angezeigt und steht am Ende der Liste. Sonst entstünde der Eindruck, er erfülle den Filter nicht.

## Installation und Start

Voraussetzung: **Node.js ab 22.18**.

```bash
npm install
npm run dev        # App unter http://localhost:5173, inklusive der Proxy-Funktionen in api/
```

Für die KI wird ein eigener, kostenloser Gemini-API-Key aus [Google AI Studio](https://aistudio.google.com/app/apikey) benötigt:

```bash
cp .env.example .env    # danach den Key in .env eintragen; .env wird nie committet
```

Ohne Key läuft die App trotzdem. Nur die KI-Funktionen melden dann „Die KI ist nicht eingerichtet“.

Weitere Befehle:

```bash
npm run build      # TypeScript-Prüfung und Produktions-Build
npm run lint       # ESLint
npm test           # automatisierte Tests
```

## Technologien

| Technologie | wofür |
|---|---|
| React 19, TypeScript 6, Vite 8 | Grundgerüst der App |
| React Router 8 | Navigation zwischen den Seiten |
| ESLint mit `react-hooks` | prüft u. a. vollständige Abhängigkeits-Arrays von `useEffect` |
| Recharts | Diagramm der Frosttage pro Winter |
| Serverless Functions (`api/`) | Proxys für die Landesdaten und für die KI, damit der API-Key auf dem Server bleibt |
| Node Test Runner (`node --test`) | automatisierte Tests für Logik, Proxys, Datenquellen und KI-Anbindung |

## APIs und Datenquellen

| Quelle | wofür in der App |
|---|---|
| [Hydris Salzburg](https://www.salzburg.gv.at/wasser/hydro/) | aktuelle Wassertemperatur der Salzburger Seen |
| [Hydrographischer Dienst Oberösterreich](https://hydro.ooe.gv.at/) | aktuelle Wassertemperatur der oberösterreichischen Seen |
| [Open-Meteo Historical Weather](https://open-meteo.com/en/docs/historical-weather-api) | ERA5-Tageswerte der Lufttemperatur: Frosttage-Verlauf auf der Detailseite, Kennzahlen des letzten Winters für die KI-Einschätzung |
| [Open-Meteo Forecast](https://open-meteo.com/en/docs) | Wetterprognose für den KI-Berater und Tagesmittel der letzten 92 Tage für die aktuelle Kälteserie |
| Google Gemini (LLM-API) | KI-Einschätzung auf der Detailseite und KI-Berater, gestreamt |
| Deutschsprachige Wikipedia | Fläche, Tiefe und Seehöhe (Stammdaten aus ESA 1) |

Hydris und der Hydrographische Dienst OÖ sind **keine offiziell dokumentierten APIs**, ihr Format kann sich jederzeit ändern. Geprüft: Salzburg am 28.10.2026 (<https://www.salzburg.gv.at/wasser/hydro/grafiken/data.json>), Oberösterreich am 29.10.2026 (<https://hydro.ooe.gv.at/daten/internet/layers/5/index.json>). Fällt eine Quelle aus, zeigt die App die Werte der anderen weiter an. Welche Messstellen zu welchem See gehören, steht mit Stationsnummer und Koordinaten in [`src/daten/seen.ts`](src/daten/seen.ts).

**Fachbegriffe:** Frosttag = Tagesminimum unter 0 °C, Eistag = Tagesmaximum unter 0 °C, Hitzetag = Tagesmaximum ab 30 °C. Winter = Dezember bis Februar, Hitzetage zählen im Sommer davor (Juni bis August). Alle Kennzahlen berechnet der Code, nie die KI.

## Aufgabenverteilung

Jede Person hat einen durchgehenden Teil von der Datenquelle bis zur fertigen Seite übernommen, damit beide Beiträge gleichwertig und in der Git-Historie erkennbar sind.

| | plfpffh (Person A) | cchhrriiss (Person B) |
|---|---|---|
| **Daten** | Salzburger Messwerte (`api/hydris-salzburg.ts`, `datenquellen/hydrisSalzburg.ts`) | Oberösterreichische Messwerte (`api/hydro-ooe.ts`, `datenquellen/hydroOoe.ts`), Open-Meteo (`datenquellen/openMeteo.ts`) |
| **Logik** | Filtern, Sortieren, Kennzahlen (`utils/seen.ts`, aus ESA 1), Eissport-Filter, aktuelle Kälteserie | Klimakennzahlen (`utils/klima.ts`), Prompts für Einschätzung und Berater |
| **Seiten** | Seenliste | See-Detail, KI-Berater, Startseite |
| **KI** | Technik: Proxy `api/ki.ts` mit Streaming, `utils/aiStream.ts`, Hook `useAI` | Einsatz: KI-Einschätzung auf der Detailseite, KI-Berater, Antwortanzeige `KiAntwort` |
| **Rahmen** | Projekt-Setup, Router, CI, Dev-Server-Plugin, README-Endredaktion | Reviews |

**Gemeinsam:** Datentypen und Schnittstellen in `src/typen/` (zu Beginn festgelegt), Regeln für die KI (`utils/kiRegeln.ts`), Review jedes Pull Requests durch die jeweils andere Person.

**Wichtigste Dateien:**
- **plfpffh:** Hooks `useFetch`, `useSeeMessungen`, `useSeenAuswahl`, `useKaelteserien`, `useStammdaten`; Komponenten `SeeKarte`, `SeenFilter`, `MindestwertFilter`, `Kennzahlen`, `Ladeanimation`, `FehlerMeldung`, `Navigation`; `utils/fetchJSON.ts`
- **cchhrriiss:** Hooks `useKlimatrend`, `usePrognose`, `useSeeDetail`, `useBeraterDaten`, `useBeraterAnfrage`; Komponenten `KlimaDiagramm`, `Klimatrend`, `SeeInformationen`, `KiAntwort`, `BeraterFormular`, `BeraterDatengrundlage`, `BeraterEmpfehlung`

**Abschlussprüfung (03.11.2026):** Bei den Tests vor der Abgabe sind einige Fehler aufgefallen. plfpffh hat sie behoben, teils im Code von cchhrriiss, der sie im Pull Request reviewt hat:
- Zwei Fehler in der KI-Anbindung (Umlaute, von Gemini blockierte Anfragen), gefunden von cchhrriiss
- Der Eissport-Modus zeigt die **aktuelle** Kälteserie statt der des letzten Winters (ersetzt `useKlimaAlle` von cchhrriiss)
- Der KI-Berater empfiehlt nur noch Seen, die das Kriterium erfüllen. Ob ein See passt, berechnet der Code
- Open-Meteo: Die Detailseite verbraucht nur noch ein Drittel des Kontingents, zu viele gleichzeitige Anfragen werden vermieden
- Der Filter der Seenliste bleibt beim Wechsel auf eine Detailseite erhalten
- Lange Seiten sind nach Kompendium Modul 04 in kleinere Komponenten aufgeteilt, das Drei-Schichten-Modell ist mit einem Test abgesichert

## Vorgehen in der Gruppe

1. **Gemeinsamer Vertrag zuerst:** Zu Beginn haben wir die Datentypen und Funktionssignaturen gemeinsam festgelegt (`src/typen/`, insbesondere `schnittstellen.ts`). Beide Landesadapter liefern dasselbe Format, die Seiten bauen auf denselben Typen auf. Danach konnte jede Person unabhängig arbeiten. Änderungen am Vertrag haben wir vorher abgesprochen.
2. **Ein Teil pro Person:** jeweils von der Datenquelle über Logik und Hooks bis zur Seite (siehe Aufgabenverteilung).
3. **Pull Requests mit Review:** `main` ist geschützt. Gearbeitet wurde auf eigenen Branches, gemergt nur per Pull Request mit Review durch die andere Person und grüner CI.
4. **Planung im Repository:** Die Planung mit Aufgabenpaketen, Zeitplan und Checkliste lag während der Arbeit in `docs/PLANUNG.md` und ist in der Git-Historie erhalten. Ihre Ergebnisse sind in diese README eingeflossen.

## Bewusste Entscheidungen

| Entscheidung | Begründung |
|---|---|
| **Eissport nach Luft-, nicht nach Wassertemperatur** | Ob ein See zufriert, hängt vor allem davon ab, wie lange die Lufttemperatur unter 0 °C bleibt. Unter einer Eisdecke misst die Messstelle oft weiterhin einige Grad über 0 °C. ESA 1 hatte deshalb nur einen Badefilter |
| **Aktuelle Kälteserie statt letzter Winter** (geändert am 03.11.2026) | Geplant war die längste Serie des letzten abgeschlossenen Winters. Wer „10 Tage am Stück unter 0 °C“ liest, erwartet aber die letzten 10 Tage bis heute, wie beim Baden die aktuelle Wassertemperatur. Der lange Verlauf bleibt auf der Detailseite |
| **Fehlende Werte bleiben sichtbar** | Regel aus ESA 1: Ein See ohne Messwert wird nicht ausgeblendet, sonst sähe es aus, als erfülle er den Filter nicht |
| **Kennzahlen rechnet der Code, nicht die KI** | Frost-, Eis- und Hitzetage, Kälteserie und Eignung für Baden oder Eissport sind feste Definitionen. Die KI erklärt sie nur und erfindet keine Werte |
| **Badeeinschätzung wie in ESA 1** | ab 24 °C „warm“, ab 20 °C „angenehm“, ab 16 °C „frisch“, darunter „kalt“. Ab 16 °C gilt ein See im KI-Berater als zum Baden geeignet |
| **Google Gemini als LLM** (28.10.2026) | kostenloses Kontingent. Kompendium Modul 05 empfiehlt Studierenden ohne Budget Google Gemini oder Anthropic |
| **API-Key nur auf dem Server** | Abweichung vom Kompendium, siehe Technische Details |
| **Themen aus Modul 06–08 erst in ESA 3** | ESA 2 belegt die Module 01–05. Responsive Design, Barrierefreiheit nach WCAG, Lighthouse und das Deployment auf Vercel folgen in ESA 3. Ausnahmen (CI, Code Splitting) sind unter Technische Details begründet |

## Einsatz von AI-Tools

### In der Entwicklung

| Person | Tool | wofür | Ergebnis und eigene Prüfung |
|---|---|---|---|
| plfpffh | Claude Code (Anthropic, Claude Opus 5.5, September bis November 2026) | Pair Programming: Review, Refactoring, Ideenaustausch, Abgleich der Umsetzung mit Angabe und Kompendium Modul 01–05, Prüfung der aus ESA 1 übernommenen Dateien | Doku-Review: Prüfung, ob Planung und Aufgabenverteilung vollständig und ausgewogen sind |
| plfpffh | Claude Code | Prüfung der Angabe-PDFs (ESA 02 und ESA 03) auf versteckte Textstellen, bevor sie mit der KI abgeglichen werden | Keine versteckten Textstellen gefunden. Weißer Text kommt nur als sichtbare Schrift auf farbigem Hintergrund vor (Titelbalken, Tabellenköpfe) |
| plfpffh | Claude Code | Dokumentation: Dateiköpfe, Kommentare und README-Texte | Bewusster Teil der Qualitätssicherung, siehe unten |
| cchhrriiss | Codex (OpenAI, GPT-6.1 Sol, Oktober und November 2026) | Pair Programming (Review, Refactoring, Ideenaustausch, Beispielcode), Beantwortung von technischen Fragen, Fehlersuche, Initiale Erstellung für Tests, Teilweises Updaten vom PLANUNG.md und README.md, Erstellung der Prompts der KI-Einschätzung und des KI-Beraters | Alle generierten Inhalte wurden kritisch geprüft. Generierte Inhalte wurden anschließend manuell überarbeitet und/oder erweitert. |

**Warum die Angabe vorab geprüft wird:** Eine Angabe kann Text enthalten, der beim Lesen nicht auffällt, bei maschineller Verarbeitung aber wirkt, etwa weiße Schrift oder Kleinstschrift. Wird die Angabe ungeprüft einer KI zum Abgleich gegeben, könnte sie solche verdeckten Anforderungen umsetzen oder eine Prompt Injection auslösen. Deshalb wird jede Angabe zuerst auf solche Stellen untersucht.

**Warum die Dokumentation von der KI kommt:** Das ist eine bewusste Qualitätssicherung. Zuerst wird geprüft, ob der Rumpf einer Funktion einlöst, was ihr Kopf (Name, Parameter, Rückgabetyp) verspricht. Stimmen beide überein, werden sie mit der generierten Dokumentation verglichen. Erst wenn alle drei zusammenpassen, ist sicher, dass die Funktion tut, was sie soll. Weicht die generierte Beschreibung ab, ist das ein Hinweis auf einen Fehler oder eine missverständliche Benennung.

### In der App

- **Anbieter und Modell:** Google Gemini, Modell `gemini-3.5-flash-lite` im kostenlosen Kontingent (15 Anfragen pro Minute, 500 pro Tag, laut Google AI Studio am 29.10.2026). `gemini-3.6-flash` hätte nur 20 Anfragen pro Tag erlaubt. Beide Modelle hielten in unseren Tests die KI-Regeln ein.
- **Welche Daten an die KI gehen:** Auf der Detailseite die aktuellen Messwerte und die berechneten Klimakennzahlen. Im KI-Berater die Eingaben der Nutzer\*innen, die Messwerte der gewählten Region, die Wetterprognose für den Ausflugstag und beim Eissport die aktuelle Kälteserie. Es werden keine Konten angelegt und keine Eingaben gespeichert. Im kostenlosen Kontingent darf Google die Eingaben zur Verbesserung seiner Produkte verwenden, daher bittet die App, keine persönlichen Daten einzugeben.
- **Regeln für die KI** (`utils/kiRegeln.ts`): Sie interpretiert nur die mitgelieferten Zahlen, erfindet keine Messwerte oder Studien, schätzt fehlende Werte nicht und erklärt Eis nie für sicher. Bei Eis-Themen nennt sie den Pflichtsatz zur Freigabe durch die Gemeinde.
- **Eignung im KI-Berater:** Ob ein See passt, berechnet der Code, nicht die KI: Baden ab 16 °C Wassertemperatur, Eissport ab 14 Tagen aktueller Kälteserie.
- **Kennzeichnung und Bedienung:** Antworten erscheinen gestreamt und sind als **KI-generiert** gekennzeichnet. Sie lassen sich abbrechen, erneut anfordern und kopieren. Fehler erscheinen als verständliche Meldung, nie als roher Text der API.

## Technische Details

### Architektur: drei Schichten aus ESA 1

ESA 1 hat die Seite in drei strikt getrennte Schichten aufgeteilt (Daten, Logik, Darstellung), damit in ESA 2 Datenquelle und Oberfläche ausgetauscht werden können, ohne die Logik neu zu schreiben. ESA 2 behält diese Trennung bei und ergänzt Hooks als Brücke:

| Schicht | Ordner | Aufgabe | darf importieren |
|---|---|---|---|
| Daten | `daten/`, `datenquellen/`, `api/` | Stammdaten, Adapter, Proxys | nur Typen und `utils/` |
| Logik | `utils/` | reine Funktionen ohne React: Umwandeln, Filtern, Sortieren, Klimakennzahlen, Prompts | Typen |
| Brücke | `hooks/`, `context/` | laden über die Datenquellen, rufen die Logik auf, halten den Zustand | alle Schichten darunter |
| Darstellung | `seiten/`, `komponenten/` | zeigen fertige `SeeAnsicht`-Objekte an, rechnen nicht selbst | `hooks/`, `context/`, `utils/` (Formatierung), Typen |

**Abweichung von ESA 1:** Dort kannte die Logik die Datenschicht. In ESA 2 importiert `utils/` nichts aus der Datenschicht, alle Daten kommen als Parameter. Umgekehrt nutzt der Open-Meteo-Adapter Hilfsfunktionen aus `utils/` (`fetchJSON`, Klimaberechnung, Zwischenspeicher). Die Logik bleibt dadurch ohne Netz und ohne Stammdaten testbar. Die Schnittstelle zwischen Logik und Darstellung sind wie in ESA 1 die Typen in `src/typen/ansicht.ts`. Die Regeln prüft [`tests/schichten.test.ts`](tests/schichten.test.ts) bei jedem Testlauf.

### Warum der API-Key nicht im Browser liegt

Kompendium Modul 05 legt den LLM-Key als `VITE_…`-Variable ab und ruft die API direkt aus dem Browser auf. Alles, was in Vite mit `VITE_` beginnt, wird aber in das ausgelieferte JavaScript eingebaut und ist für jede Person lesbar, die die Seite öffnet. Wer den Key hat, kann auf unsere Kosten Anfragen stellen.

Wir weichen deshalb bewusst ab: Der Key heißt `GEMINI_API_KEY` **ohne** `VITE_`-Präfix, liegt lokal in `.env` (per `.gitignore` ausgeschlossen) und wird ausschließlich in der Serverless-Funktion `api/ki.ts` gelesen. Damit ist die Vorgabe der Angabe erfüllt („sicher in einer .env-Datei verwaltet und nicht im Repository“), und der Key verlässt nie den Server. `api/ki.ts` begrenzt außerdem jede Anfrage (höchstens 20 Nachrichten Verlauf, 20.000 Zeichen, 2048 Tokens pro Antwort), damit der Browser keine teuren Anfragen stellen kann.

### Lokale Ausführung der Serverless Functions

Die Funktionen in `api/` sind im Format von Vercel Serverless Functions geschrieben. Damit `npm run dev` sie ohne Vercel-Konto ausführt, bindet [vite-plugin-api.ts](vite-plugin-api.ts) sie in den Vite-Dev-Server ein: `/api/<name>` ruft `api/<name>.ts` mit Request und Response auf, genau wie auf Vercel. Variablen aus `.env` ohne `VITE_`-Präfix sieht dabei nur der Dev-Server, nie der Browser. Das Deployment auf Vercel ist Teil von ESA 3.

### Open-Meteo: Kontingent und Zwischenspeicher

Open-Meteo rechnet lange Zeiträume und mehrere Variablen als mehrere Anfragen an (Limit 600 pro Minute und 5.000 pro Stunde) und lehnt zu viele gleichzeitige Anfragen ab. Deshalb:
- Der Frosttage-Verlauf ab 1950 fragt nur das Tagesminimum ab, alle Kennzahlen kommen nur für den letzten Winter. Eine Detailseite kostet so etwa 200 statt knapp 600 Einheiten (gemessen am 03.11.2026).
- Höchstens 4 Anfragen laufen gleichzeitig (Warteschlange `begrenzt` in `openMeteo.ts`).
- Historische Kennzahlen bleiben 24 Stunden im Browser gespeichert, Wetterprognosen höchstens 30 Minuten.
- Ist das Limit trotzdem erreicht, weist die App darauf hin.

### Qualitätssicherung und vorgezogene Themen aus ESA 3

- **CI:** Bei jedem Push auf `main` und jedem Pull Request prüft GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) den Code mit `npm ci`, `npm run lint`, `npm test` und `npm run build` (inklusive TypeScript-Prüfung). CI/CD ist Thema von Kompendium Modul 07 (ESA 3). Wir haben es vorgezogen, damit jeder Pull Request automatisch geprüft wird.
- **Code Splitting:** `React.lazy` lädt das Diagramm (Recharts, rund 350 kB) erst auf der Detailseite. Auch das ist Thema von Modul 07. Ohne diese Aufteilung wäre das Hauptpaket über 500 kB groß, und der Build würde eine Größenwarnung ausgeben.
- **Node.js ab 22.18** ist nötig, weil die Tests TypeScript-Dateien direkt mit `node --test` ausführen (in der CI: Node 24).

### Ausblick auf ESA 3

ESA 3 baut auf dieser App auf. Geplant sind das Deployment auf Vercel mit dem API-Key als Umgebungsvariable (`vercel.json` mit SPA-Rewrite liegt schon bereit), Responsive Design ab 320 px, Barrierefreiheit nach WCAG 2.2 mit Lighthouse-Messung und Code Splitting für mindestens zwei Seiten. Optional kommt eine Landkarte der Seen dazu.
