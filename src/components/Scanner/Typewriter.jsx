import { useEffect, useRef, useState } from 'react';

/* Renders a list of terminal lines with a character-by-character typewriter.
 * When `activeIndex` is set, that line is the one currently typing.
 * Completed lines show their `response` after the command completes.
 *
 * Pure CSS-driven, no animation library. Honours prefers-reduced-motion.
 */

const CHAR_INTERVAL_MS = 28;

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export default function Typewriter({ lines, activeIndex }) {
  const [typed, setTyped] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (activeIndex == null || activeIndex < 0) {
      setTyped(0);
      return undefined;
    }
    const line = lines[activeIndex];
    if (!line) return undefined;
    setTyped(0);
    if (prefersReducedMotion()) {
      setTyped(line.text.length);
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      setTyped((n) => {
        if (n >= line.text.length) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return n;
        }
        return n + 1;
      });
    }, CHAR_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeIndex, lines]);

  if (!Array.isArray(lines) || lines.length === 0) {
    return <pre className="terminal" aria-hidden="true" />;
  }

  return (
    <pre className="terminal" aria-label="Serial port output">
      {lines.map((line, idx) => {
        const isActive = idx === activeIndex;
        const isPast = activeIndex != null && idx < activeIndex;
        const completed = isPast || (isActive && typed >= line.text.length);
        const visible = isActive ? line.text.slice(0, typed) : line.text;
        const status = completed ? 'ok' : 'pending';
        const showResponse = completed && line.response;
        return (
          <span
            key={line.id ?? `${idx}-${line.text}`}
            className={`terminal-line terminal-line--${status}`}
          >
            {'> '}{visible}
            {showResponse ? `  ${line.response}` : ''}
            {isActive && typed < line.text.length ? <span className="cursor" /> : null}
            {'\n'}
          </span>
        );
      })}
    </pre>
  );
}
