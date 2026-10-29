/**
 * Ladeanimation.tsx – Hinweis, solange Daten geladen werden
 *
 * role="status" lässt Screenreader den Text vorlesen, der Kreis ist nur Dekoration.
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

interface LadeanimationProps {
  text?: string;
}

export default function Ladeanimation({ text = 'Daten werden geladen …' }: LadeanimationProps): React.JSX.Element {
  return (
    <p className="ladeanimation" role="status">
      <span className="ladeanimation__kreis" aria-hidden="true" />
      {text}
    </p>
  );
}
