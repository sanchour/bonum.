import { Fragment, type ReactNode } from "react";

/**
 * A deliberately small Markdown renderer for axiom bodies: paragraphs, > blockquotes,
 * - lists, *emphasis* and **strong**. It builds React nodes directly, so user text is
 * never injected as HTML.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-${i++}`} className="font-semibold text-vellum">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(<em key={`${keyPrefix}-${i++}`}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Scripture({ markdown, className }: { markdown: string; className?: string }) {
  const blocks = markdown
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        if (lines.every((line) => line.trimStart().startsWith(">"))) {
          return (
            <blockquote key={index} className="border-l border-gold/50 pl-4 font-serif text-[1.1rem] italic text-vellum/80">
              {lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(line.replace(/^\s*>\s?/, ""), `${index}-${j}`)}
                </Fragment>
              ))}
            </blockquote>
          );
        }
        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={index} className="list-none space-y-1 pl-1">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[0.6em] size-1 shrink-0 rotate-45 bg-gold/70" />
                  <span>{inline(line.replace(/^\s*[-*]\s+/, ""), `${index}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(line, `${index}-${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
