/**
 * FehlerMeldung.tsx – verständliche Fehlermeldung, optional mit „Erneut versuchen“
 *
 * Zeigt nur den übergebenen Text an, nie rohe Fehlertexte einer API.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

interface FehlerMeldungProps {
  meldung: string;
  onErneutVersuchen?: () => void;
}

export default function FehlerMeldung({ meldung, onErneutVersuchen }: FehlerMeldungProps): React.JSX.Element {
  return (
    <div className="fehlermeldung" role="alert">
      <p>{meldung}</p>
      {onErneutVersuchen && (
        <button type="button" onClick={onErneutVersuchen}>
          Erneut versuchen
        </button>
      )}
    </div>
  );
}
