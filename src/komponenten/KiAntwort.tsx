/**
 * KiAntwort.tsx – wiederverwendbare Anzeige einer gestreamten KI-Antwort
 *
 * KI-Antwort als Text anzeigen.
 *
 * @project FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author Christoph Hauser
 */

import { useState } from 'react';
import FehlerMeldung from './FehlerMeldung';
import Ladeanimation from './Ladeanimation';

interface KiAntwortProps {
  text: string;
  isStreaming: boolean;
  fehler: string | null;
  abgebrochen?: boolean;
  onAbbrechen: () => void;
  onErneutVersuchen: () => void;
}

export default function KiAntwort({ text, isStreaming, fehler, abgebrochen = false, onAbbrechen, onErneutVersuchen }: KiAntwortProps): React.JSX.Element {
  const [kopierStatus, setKopierStatus] = useState('');
  const meldung = fehler ?? (!isStreaming && !text.trim() && !abgebrochen
    ? 'Die KI hat keine Antwort geliefert. Bitte erneut versuchen.' : null);

  const kopieren = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setKopierStatus('Antwort kopiert.');
    } catch {
      setKopierStatus('Zugriff auf die Zwischenablage nicht möglich. Bitte den Antworttext markieren und manuell kopieren.');
    }
  };

  return (
    <div className="kiantwort">
      <p className="kiantwort__kennzeichnung">KI-generiert</p>
      {isStreaming && (text
        ? <p role="status">Antwort wird erstellt …</p>
        : <Ladeanimation text="Die KI erstellt eine Einschätzung …" />)}
      <div className="kiantwort__text" aria-live="polite" aria-busy={isStreaming}>{text}</div>
      {abgebrochen && <p role="status">Antwort abgebrochen. Bereits empfangener Text bleibt erhalten.</p>}
      {meldung && <FehlerMeldung meldung={meldung} onErneutVersuchen={onErneutVersuchen} />}
      <div className="kiantwort__aktionen">
        {isStreaming && <button type="button" onClick={onAbbrechen}>Abbrechen</button>}
        {text.trim() !== '' && (
          <button type="button" disabled={isStreaming} onClick={() => { void kopieren(); }}>Antwort kopieren</button>
        )}
      </div>
      <p className="kiantwort__kopierstatus" role="status">{kopierStatus}</p>
    </div>
  );
}
