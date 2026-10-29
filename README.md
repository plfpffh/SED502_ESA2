# Seen im Klimawandel – Salzburg & Oberösterreich

[![CI](https://github.com/plfpffh/SED502_ESA2/actions/workflows/ci.yml/badge.svg)](https://github.com/plfpffh/SED502_ESA2/actions/workflows/ci.yml)

Gruppenprojekt für die Einsendeaufgabe 2 im Modul **SED502 Front-End Development** (Ferdinand Porsche FernFH, WS 2026/27).

> **Status:** in Entwicklung. Punkte, die noch nicht umgesetzt sind, sind als *geplant* gekennzeichnet. Die verbindliche, ausführliche Planung steht in [`docs/PLANUNG.md`](docs/PLANUNG.md).

## Projektbeschreibung

Die App zeigt für 14 Seen im Salzburger Seenland und im Salzkammergut die **aktuelle Wassertemperatur live** und ordnet sie mit **Klimadaten seit 1940** ein: Wie warm ist der See heute zum Baden? Wie viele Frost- und Hitzetage gab es im letzten Winter bzw. Sommer, und wie haben sie sich über die Jahrzehnte verändert? Eine **KI** erklärt die Zahlen verständlich und gibt eine Empfehlung für das Wochenende.

**Zielgruppe:** Badegäste und Eissport-Interessierte in Salzburg und Oberösterreich sowie alle, die sehen wollen, wie sich der Klimawandel an den Seen der Region zeigt.

„Eislaufen möglich“ ist in der App ausschließlich ein **klimatischer Hinweis** (längste Serie von Tagen mit einem Tagesmittel der Luft unter 0 °C) und **keine Freigabe**. Eisflächen nur nach offizieller Freigabe durch die Gemeinde betreten.

**Ausgangsbasis:** Stammdaten, Datenmodell und Filterlogik stammen aus der Einzelarbeit ESA 1 (<https://github.com/plfpffh/SED502_ESA1>) und wurden in einem eigenen Commit übernommen.

## Technologien

| Bereich | Einsatz | Stand |
|---|---|---|
| React 19, TypeScript 6, Vite 8 | Grundgerüst der App | ✅ |
| ESLint mit `react-hooks` | prüft u. a. vollständige Abhängigkeits-Arrays von `useEffect` | ✅ |
| React Router 8 (Paket `react-router`, seit Version 7 ohne `-dom`) | Navigation zwischen den Seiten | ✅ |
| Vercel Serverless Functions | Proxy für die Landesdaten, geschützter LLM-Aufruf | OÖ- und Salzburg-Proxy implementiert. LLM-Funktion und Deployment geplant |
| Recharts | Diagramm der Frosttage pro Winter | geplant |

## APIs und Datenquellen

| Quelle | Inhalt | Zugriff |
|---|---|---|
| [Hydris Salzburg](https://www.salzburg.gv.at/wasser/hydro/) | Wassertemperatur der Salzburger Seen | `/api/hydris-salzburg`, Adapter, Laden über `useSeeMessungen`, Anzeige in der Seenliste |
| [Hydrographischer Dienst Oberösterreich](https://hydro.ooe.gv.at/) | Wassertemperatur der oberösterreichischen Seen | `/api/hydro-ooe` implementiert, Adapter und React-Anbindung geplant |
| [Open-Meteo Historical Weather](https://open-meteo.com/) | Tageswerte der Lufttemperatur seit 1940 → Frost-, Eis- und Hitzetage | direkt – geplant |
| Open-Meteo Forecast | Lufttemperatur-Prognose für 7 Tage | direkt – geplant |
| LLM-API (Google Gemini) | Einschätzung und Empfehlung, gestreamt | nur serverseitig über `/api/ki` – geplant |
| Deutschsprachige Wikipedia | Fläche, Tiefe, Seehöhe (Stammdaten aus ESA 1) | statisch |

Hydris und der Hydrographische Dienst OÖ sind **keine offiziell dokumentierten APIs**. Das Format kann sich jederzeit ändern. Die App fängt Fehler dieser Quellen ab. Fällt eine Quelle aus, zeigt die andere weiterhin Werte, und betroffene Seen erscheinen mit „Wert aktuell nicht vorhanden“ am Ende der Liste, statt ausgeblendet zu werden.

OÖ-Quelle: <https://hydro.ooe.gv.at/daten/internet/layers/5/index.json>, geprüft am **11.10.2026**. Der Proxy benötigt keinen API-Schlüssel.

Salzburg-Quelle: <https://www.salzburg.gv.at/wasser/hydro/grafiken/data.json>, geprüft am **28.10.2026**. Liefert eine einzelne Station keinen gültigen Wert, wird nur dieser See als „Wert aktuell nicht vorhanden“ angezeigt.

## Installation

```bash
npm install
npm run dev        # Frontend und /api-Funktionen, http://localhost:5173
npm run build      # TypeScript-Prüfung + Produktions-Build
npm run lint       # ESLint
npm test           # Tests (Proxys, Adapter, Logik, Filter, Formatierung, fetchJSON, Dev-Server-Plugin)
```

Die Funktionen in `api/` laufen auf Vercel als Serverless Functions. Damit `npm run dev` sie auch lokal ausführt, ohne Vercel-Konto und ohne `vercel dev`, bindet [vite-plugin-api.ts](vite-plugin-api.ts) sie in den Vite-Dev-Server ein: `/api/<name>` ruft den Default-Export von `api/<name>.ts` mit Request und Response auf, genau wie auf Vercel. Variablen aus `.env` ohne `VITE_`-Präfix stehen dabei nur dem Dev-Server zur Verfügung, nie dem Browser.

Für die KI-Anbindung, sobald Person A die `.env.example` ergänzt hat (*geplant*):

```bash
cp .env.example .env    # API-Key in .env eintragen, .env wird nie committet
```

## Sicherheit: Warum der API-Key nicht im Browser liegt

Kompendium Modul 05 legt den LLM-Key als `VITE_…`-Variable ab und ruft die API direkt aus dem Browser auf. Alles, was in Vite mit `VITE_` beginnt, wird aber in das ausgelieferte JavaScript eingebaut und ist für jede Person lesbar, die die Seite öffnet. Wer den Key hat, kann auf unsere Kosten Anfragen stellen.

Wir weichen deshalb bewusst ab: Der Key heißt `GEMINI_API_KEY` **ohne** `VITE_`-Präfix, liegt lokal in `.env` (per `.gitignore` ausgeschlossen) und auf Vercel als Umgebungsvariable und wird ausschließlich in der Serverless-Funktion `api/ki.ts` gelesen. Damit ist die Vorgabe der Angabe erfüllt („sicher in einer .env-Datei verwaltet und nicht im Repository“), und der Key verlässt nie den Server.

## Qualitätssicherung: CI

Bei jedem Push auf `main` und bei jedem Pull Request prüft GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) den Code mit `npm ci`, `npm run lint`, `npm test` und `npm run build`. Der Build enthält `tsc -b`, TypeScript-Fehler fallen also auf. Bei einem Pull Request wird der Stand **nach** dem Merge geprüft.

Benötigt wird **Node.js ab 22.18** (in der CI: Node 24), weil die Tests TypeScript-Dateien direkt mit `node --test` ausführen.

## Aufgabenverteilung

Jede Person übernimmt einen **vertikalen Strang** von der Datenquelle bis zur Seite. So hat jede Person Commits in `api/`, `datenquellen/`, `hooks/`, `komponenten/` und `seiten/`, und die Beiträge sind gleichwertig. Details, Schnittstellen und Zeitplan: [`docs/PLANUNG.md`, Abschnitt 6](docs/PLANUNG.md#6-aufgabenverteilung).

> **Stand: Planung.** Die Tabelle zeigt die vereinbarte Verteilung. Vor der Abgabe wird sie auf den tatsächlich umgesetzten Stand umgestellt: wer hat was gemacht, mit den wichtigsten Dateien je Person.

| | Person A – plfpffh | Person B – cchhrriiss |
|---|---|---|
| **Datenquelle** | Hydris Salzburg: Proxy `api/hydris-salzburg.ts`, Adapter `datenquellen/hydrisSalzburg.ts` | Hydro OÖ: Proxy `api/hydro-ooe.ts`, Adapter `datenquellen/hydroOoe.ts` |
| **Hooks** | `fetchJSON` (generischer Wrapper), `useFetch`, `useSeeMessungen` (führt beide Landesquellen zusammen), `useSeenAuswahl` | `useKlimatrend`, `useKlimaAlle` (Open-Meteo) |
| **Logik** | `utils/seen.ts` (aus ESA 1), Eissport-Filter | `utils/klima.ts` (Frost-, Eis-, Hitzetage, Kälteserie) |
| **Seiten** | `Seenliste` (`/seen`) mit Filter und Umschalter Baden/Eissport | `SeeDetail` (`/seen/:id`), `KiBerater` (`/berater`), `Startseite` (`/`) |
| **Komponenten** | `SeeKarte`, `SeenFilter`, `MindestwertFilter`, `Kennzahlen`, `Ladeanimation`, `FehlerMeldung`, `Navigation` | `KlimaDiagramm`, `KiAntwort` |
| **KI** | `api/ki.ts` (serverseitig, Streaming), `utils/aiStream.ts`, `useAI` | KI-Einschätzung auf SeeDetail, KI-Berater |
| **Rahmen** | Setup, React Router, `vercel.json`, `.env.example`, README-Endredaktion | – |

**Gemeinsam:** Schnittstellen in `src/typen/` (erster Arbeitstag), System-Prompt der KI, Review jedes Pull Requests durch die jeweils andere Person.

**Bereits erledigt (Person A):** Projekt-Setup mit Vite, React, TypeScript und ESLint (Commit `7492370`) · Übernahme von Stammdaten, Datenmodell und Filterlogik aus ESA 1 (Commit `80e5646`) · CI mit GitHub Actions · Typen nach Planung Abschnitt 5, Stammdaten mit Stationen und Koordinaten · React Router mit Layout, Navigation und 404-Seite · `fetchJSON` und `useFetch` mit Tests · Salzburg-Proxy `api/hydris-salzburg.ts` und Tests · Dev-Server-Plugin, damit `npm run dev` die `/api`-Funktionen ausführt · Filterlogik nach gemeinsamem Vertrag (alle Messstellen, Eissport-Filter, Kälteserie) mit Tests · Salzburg-Adapter `datenquellen/hydrisSalzburg.ts` mit Tests · `useSeeMessungen` lädt beide Quellen unabhängig voneinander · `SeeDatenContext` stellt die Messwerte allen Seiten bereit · Seenliste mit kontrolliertem Filter, Umschalter Baden/Eissport, Seekarten, Kennzahlen sowie Lade- und Fehleranzeige.

**Implementiert (Person B):** OÖ-Proxy `api/hydro-ooe.ts` und Tests. Die übrigen B-Aufgaben bleiben geplant.

## Einsatz von AI-Tools

*Wird während der Entwicklung laufend ergänzt. Jede Person dokumentiert ihren eigenen Einsatz.*

**In der Entwicklung**

| Person | Tool | wofür | Ergebnis / eigene Prüfung |
|---|---|---|---|
| plfpffh | Claude Code (Anthropic, Claude Opus 5.5, September 2026) | Pair Programming: Review, Refactoring, Ideenaustausch, Abgleich von Umsetzung und Anforderungen (Angabe, Kompendium Modul 03–05), Prüfung, ob ESA-1-Dateien korrekt übernommen wurden | Doku-Review: Prüfung, ob Planung und Aufgabenverteilung vollständig und ausgewogen ist|
| plfpffh | Claude Code | Prüfung der Angabe-PDFs (ESA 02 und ESA 03) auf versteckte Textstellen, bevor sie mit der KI gegen die Umsetzung abgeglichen werden | Keine versteckten Textstellen gefunden. Weißer Text kommt nur als sichtbare Schrift auf farbigem Hintergrund vor (Titelbalken, Tabellenköpfe) |
| plfpffh | Claude Code | Dokumentation: Dateiköpfe, Kommentare und README-Texte | Bewusster Teil der Qualitätssicherung, siehe unten |
| cchhrriiss | Codex (OpenAI, GPT-6.1 Sol, Oktober 2026) | Pair Programming (Review, Refactoring, Ideenaustausch, Beispielcode), Beantwortung von technischen Fragen, Fehlersuche, Initiale Erstellung der Tests für den OÖ-Proxy (hydro-ooe.test.ts) | Alle generierten Inhalte wurden kritisch geprüft. Die Erstellten Tests wurden anschließend manuell überarbeitet und erweitert. |

**Warum die Angabe vorab geprüft wird:** Eine Angabe kann Text enthalten, der beim Lesen nicht auffällt, bei maschineller Verarbeitung aber wirkt, etwa weiße Schrift oder Kleinstschrift. Wird die Angabe ungeprüft einer KI zum Abgleich gegeben, könnte sie solche verdeckten Anforderungen umsetzen, die gar nicht verlangt sind, oder eine Prompt Injection auslösen. Deshalb wird jede Angabe zuerst auf solche Stellen untersucht.

**Warum die Dokumentation von der KI kommt:** Das ist eine bewusste Qualitätssicherung. Zuerst wird geprüft, ob der Methodenrumpf einlöst, was der Methodenkopf (Name, Parameter, Rückgabetyp) verspricht. Stimmen beide überein, werden sie mit der generierten Dokumentation verglichen. Erst wenn Kopf, Rumpf und Dokumentation zusammenpassen, ist sicher, dass die Methode tut, was sie soll. Weicht die generierte Beschreibung ab, ist das ein Hinweis auf einen Fehler oder eine missverständliche Benennung.

**In der App** (*geplant*)

- **Anbieter:** Google Gemini (kostenloses Kontingent). Google darf Eingaben im kostenlosen Kontingent zur Verbesserung seiner Produkte verwenden, daher sollen Nutzer\*innen keine persönlichen Daten eingeben.
- **Modell:** offen
- **Welche Daten gehen an die LLM-API:** aktuelle Messwerte und berechnete Klimakennzahlen der Seen sowie im KI-Berater die Eingabe der Nutzer\*innen (z. B. Wohnort und Vorhaben). Es werden keine Konten oder personenbezogenen Daten gespeichert. Nutzer\*innen sollten keine persönlichen Daten eingeben.
- **Regeln für die KI:** Sie interpretiert nur die mitgelieferten Zahlen, erfindet keine Messwerte oder Studien, schätzt fehlende Werte nicht und erklärt Eis nie für sicher. Alle Antworten sind als **KI-generiert** gekennzeichnet.
