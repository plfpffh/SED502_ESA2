# Seen im Klimawandel – Salzburg & Oberösterreich

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
| React Router | Navigation zwischen den Seiten | geplant |
| Vercel Serverless Functions | Proxy für die Landesdaten, geschützter LLM-Aufruf | geplant |
| Recharts | Diagramm der Frosttage pro Winter | geplant |

## APIs und Datenquellen

| Quelle | Inhalt | Zugriff |
|---|---|---|
| [Hydris Salzburg](https://www.salzburg.gv.at/wasser/hydro/) | Wassertemperatur der Salzburger Seen | über `/api`-Proxy (kein CORS) – geplant |
| [Hydrographischer Dienst Oberösterreich](https://hydro.ooe.gv.at/) | Wassertemperatur der oberösterreichischen Seen | über `/api`-Proxy (kein CORS) – geplant |
| [Open-Meteo Historical Weather](https://open-meteo.com/) | Tageswerte der Lufttemperatur seit 1940 → Frost-, Eis- und Hitzetage | direkt – geplant |
| Open-Meteo Forecast | Lufttemperatur-Prognose für 7 Tage | direkt – geplant |
| LLM-API (Google Gemini oder Anthropic Claude Haiku 4.5, Wahl offen) | Einschätzung und Empfehlung, gestreamt | nur serverseitig über `/api/ki` – geplant |
| Deutschsprachige Wikipedia | Fläche, Tiefe, Seehöhe (Stammdaten aus ESA 1) | statisch |

Hydris und der Hydrographische Dienst OÖ sind **keine offiziell dokumentierten APIs**. Das Format kann sich jederzeit ändern. Die App fängt Fehler dieser Quellen ab. Fällt eine Quelle aus, zeigt die andere weiterhin Werte, und betroffene Seen erscheinen mit „Wert aktuell nicht vorhanden“ am Ende der Liste, statt ausgeblendet zu werden.

## Installation

```bash
npm install
npm run dev        # nur Frontend, http://localhost:5173
npm run build      # TypeScript-Prüfung + Produktions-Build
npm run lint       # ESLint
```

Sobald die `/api`-Funktionen vorhanden sind (*geplant*):

```bash
cp .env.example .env    # API-Key eintragen, .env wird nie committet
npx vercel dev          # Frontend und /api-Funktionen gemeinsam
```

## Sicherheit: Warum der API-Key nicht im Browser liegt

Kompendium Modul 05 legt den LLM-Key als `VITE_…`-Variable ab und ruft die API direkt aus dem Browser auf. Alles, was in Vite mit `VITE_` beginnt, wird aber in das ausgelieferte JavaScript eingebaut und ist für jede Person lesbar, die die Seite öffnet. Wer den Key hat, kann auf unsere Kosten Anfragen stellen.

Wir weichen deshalb bewusst ab: Der Key heißt `ANTHROPIC_API_KEY` bzw. `GEMINI_API_KEY` **ohne** `VITE_`-Präfix, liegt lokal in `.env` (per `.gitignore` ausgeschlossen) und auf Vercel als Umgebungsvariable und wird ausschließlich in der Serverless-Funktion `api/ki.ts` gelesen. Damit ist die Vorgabe der Angabe erfüllt („sicher in einer .env-Datei verwaltet und nicht im Repository“), und der Key verlässt nie den Server.

## Aufgabenverteilung

Jede Person übernimmt einen **vertikalen Strang** von der Datenquelle bis zur Seite. So hat jede Person Commits in `api/`, `datenquellen/`, `hooks/`, `komponenten/` und `seiten/`, und die Beiträge sind gleichwertig. Details, Schnittstellen und Zeitplan: [`docs/PLANUNG.md`, Abschnitt 6](docs/PLANUNG.md#6-aufgabenverteilung).

> **Stand: Planung.** Die Tabelle zeigt die vereinbarte Verteilung. Vor der Abgabe wird sie auf den tatsächlich umgesetzten Stand umgestellt: wer hat was gemacht, mit den wichtigsten Dateien je Person.

| | Person A – plfpffh | Person B – cchhrriiss |
|---|---|---|
| **Datenquelle** | Hydris Salzburg: Proxy `api/hydris-salzburg.ts`, Adapter `datenquellen/hydrisSalzburg.ts` | Hydro OÖ: Proxy `api/hydro-ooe.ts`, Adapter `datenquellen/hydroOoe.ts` |
| **Hooks** | `fetchJSON` (generischer Wrapper), `useFetch`, `useSeeMessungen` (führt beide Landesquellen zusammen) | `useKlimatrend`, `useKlimaAlle` (Open-Meteo) |
| **Logik** | `utils/seen.ts` (aus ESA 1), Eissport-Filter | `utils/klima.ts` (Frost-, Eis-, Hitzetage, Kälteserie) |
| **Seiten** | `Seenliste` (`/seen`) mit Filter und Umschalter Baden/Eissport | `SeeDetail` (`/seen/:id`), `KiBerater` (`/berater`), `Startseite` (`/`) |
| **Komponenten** | `SeeKarte`, `SeenFilter`, `Ladeanimation`, `FehlerMeldung`, `Navigation` | `KlimaDiagramm`, `KiAntwort` |
| **KI** | `api/ki.ts` (serverseitig, Streaming), `utils/aiStream.ts`, `useAI` | KI-Einschätzung auf SeeDetail, KI-Berater |
| **Rahmen** | Setup, React Router, `vercel.json`, `.env.example`, README-Endredaktion | – |

**Gemeinsam:** Schnittstellen in `src/typen/` (erster Arbeitstag), System-Prompt der KI, Review jedes Pull Requests durch die jeweils andere Person.

**Bereits erledigt (Person A):** Projekt-Setup mit Vite, React, TypeScript und ESLint (Commit `7492370`) · Übernahme von Stammdaten, Datenmodell und Filterlogik aus ESA 1 (Commit `80e5646`).

## Einsatz von AI-Tools

*Wird während der Entwicklung laufend ergänzt. Jede Person dokumentiert ihren eigenen Einsatz.*

**In der Entwicklung**

| Person | Tool | wofür | Ergebnis / eigene Prüfung |
|---|---|---|---|
| plfpffh | Claude Code (Anthropic, Claude Opus 5.5, September 2026) | Pair Programming: Review, Refactoring, Ideenaustausch, Abgleich von Umsetzung und Anforderungen (Angabe, Kompendium Modul 03–05), Prüfung, ob ESA-1-Dateien korrekt übernommen wurden | Doku-Review: Prüfung, ob Planung und Aufgabenverteilung vollständig und ausgewogen ist|
| plfpffh | Claude Code | Prüfung der Angabe-PDFs (ESA 02 und ESA 03) auf versteckte Textstellen, bevor sie mit der KI gegen die Umsetzung abgeglichen werden | Keine versteckten Textstellen gefunden. Weißer Text kommt nur als sichtbare Schrift auf farbigem Hintergrund vor (Titelbalken, Tabellenköpfe) |
| plfpffh | Claude Code | Dokumentation: Dateiköpfe, Kommentare und README-Texte | Bewusster Teil der Qualitätssicherung, siehe unten |
| cchhrriiss | | | |

**Warum die Angabe vorab geprüft wird:** Eine Angabe kann Text enthalten, der beim Lesen nicht auffällt, bei maschineller Verarbeitung aber wirkt, etwa weiße Schrift oder Kleinstschrift. Wird die Angabe ungeprüft einer KI zum Abgleich gegeben, könnte sie solche verdeckten Anforderungen umsetzen, die gar nicht verlangt sind, oder eine Prompt Injection auslösen. Deshalb wird jede Angabe zuerst auf solche Stellen untersucht.

**Warum die Dokumentation von der KI kommt:** Das ist eine bewusste Qualitätssicherung. Zuerst wird geprüft, ob der Methodenrumpf einlöst, was der Methodenkopf (Name, Parameter, Rückgabetyp) verspricht. Stimmen beide überein, werden sie mit der generierten Dokumentation verglichen. Erst wenn Kopf, Rumpf und Dokumentation zusammenpassen, ist sicher, dass die Methode tut, was sie soll. Weicht die generierte Beschreibung ab, ist das ein Hinweis auf einen Fehler oder eine missverständliche Benennung.

**In der App** (*geplant*)

- **Modell:** offen
- **Welche Daten gehen an die LLM-API:** aktuelle Messwerte und berechnete Klimakennzahlen der Seen sowie im KI-Berater die Eingabe der Nutzer\*innen (z. B. Wohnort und Vorhaben). Es werden keine Konten oder personenbezogenen Daten gespeichert. Nutzer\*innen sollten keine persönlichen Daten eingeben.
- **Regeln für die KI:** Sie interpretiert nur die mitgelieferten Zahlen, erfindet keine Messwerte oder Studien, schätzt fehlende Werte nicht und erklärt Eis nie für sicher. Alle Antworten sind als **KI-generiert** gekennzeichnet.
