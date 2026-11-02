/**
 * Minimal, dependency-free Markdown renderer for Transcriptly guides.
 *
 * Supported syntax (intentionally small so content stays predictable):
 *   ## Heading 2 (included in the table of contents)
 *   ### Heading 3
 *   Paragraphs separated by blank lines
 *   - unordered lists / 1. ordered lists (single level)
 *   > [!tip] / > [!note] / > [!warning] callouts (plain "> " is a note)
 *   ``` fenced code blocks ```
 *   | tables | with | a header separator row |
 *   ![alt text](/path.png "Optional caption")  (on its own line)
 *   Inline: **bold**, *italic*, `code`, [link text](/href)
 *
 * Rendering produces React elements only (no dangerouslySetInnerHTML), so
 * content cannot inject markup.
 */
import Link from "next/link";
import type { ReactNode } from "react";

export type Heading = { id: string; text: string; level: 2 | 3 };

type Block =
  | { type: "h2" | "h3"; text: string; id: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[]; start: number }
  | { type: "callout"; variant: "tip" | "note" | "warning"; lines: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "img"; alt: string; src: string; caption?: string; width?: number; height?: number };

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_[\]()]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const usedIds = new Map<string, number>();
  let i = 0;

  const uniqueId = (text: string) => {
    const base = slugify(text) || "section";
    const n = usedIds.get(base) ?? 0;
    usedIds.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith("```")) {
      // Support longer fences (````) so code blocks can contain ``` lines
      const fence = /^`+/.exec(trimmed)![0];
      const lang = trimmed.slice(fence.length).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== fence) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", lang, code: code.join("\n") });
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const text = heading[2].trim();
      blocks.push({ type: heading[1].length === 2 ? "h2" : "h3", text, id: uniqueId(text) });
      i++;
      continue;
    }

    const img = /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/.exec(trimmed);
    if (img) {
      // Optional intrinsic size: ![alt](/x.svg "Caption|760x380") prevents layout shift
      const [cap, size] = (img[3] ?? "").split("|");
      const dims = /^(\d+)x(\d+)$/.exec(size ?? "");
      blocks.push({
        type: "img",
        alt: img[1],
        src: img[2],
        caption: cap || undefined,
        width: dims ? Number(dims[1]) : undefined,
        height: dims ? Number(dims[2]) : undefined,
      });
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const raw: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        raw.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      let variant: "tip" | "note" | "warning" = "note";
      const marker = /^\[!(tip|note|warning)\]\s*(.*)$/i.exec(raw[0] ?? "");
      if (marker) {
        variant = marker[1].toLowerCase() as typeof variant;
        raw[0] = marker[2];
      }
      // Group callout lines into paragraphs separated by empty "> " lines
      const paras: string[] = [];
      let buf: string[] = [];
      for (const r of raw) {
        if (!r.trim()) {
          if (buf.length) paras.push(buf.join(" "));
          buf = [];
        } else buf.push(r);
      }
      if (buf.length) paras.push(buf.join(" "));
      blocks.push({ type: "callout", variant, lines: paras });
      continue;
    }

    if (trimmed.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[i + 1].trim())) {
      const header = splitRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    const ulMatch = /^[-*]\s+/.test(trimmed);
    const olMatch = /^(\d+)\.\s+/.exec(trimmed);
    if (ulMatch || olMatch) {
      const ordered = !!olMatch;
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const isItem = ordered ? /^\d+\.\s+/.test(t) : /^[-*]\s+/.test(t);
        if (isItem) {
          items.push(t.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""));
          i++;
        } else if (t && /^\s{2,}/.test(lines[i]) && items.length) {
          // continuation line indented under the previous item
          items[items.length - 1] += " " + t;
          i++;
        } else break;
      }
      blocks.push({ type: ordered ? "ol" : "ul", items, start: olMatch ? Number(olMatch[1]) : 1 });
      continue;
    }

    // Paragraph: gather until blank line or another block start
    const para: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || t.startsWith("#") || t.startsWith(">") || t.startsWith("```") || t.startsWith("|") || /^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t) || t.startsWith("![")) break;
      para.push(t);
      i++;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }

  return blocks;
}

/** Plain text of the document, used for word counts and reading time. */
export function plainText(source: string): string {
  return parseBlocks(source)
    .map((b) => {
      switch (b.type) {
        case "h2":
        case "h3":
        case "p":
          return b.text;
        case "ul":
        case "ol":
          return b.items.join(" ");
        case "callout":
          return b.lines.join(" ");
        case "table":
          return [...b.header, ...b.rows.flat()].join(" ");
        case "code":
          return b.code;
        case "img":
          return b.caption ?? "";
      }
    })
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`]/g, "");
}

export function countWords(source: string): number {
  return plainText(source).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function extractHeadings(source: string): Heading[] {
  return parseBlocks(source)
    .filter((b): b is Extract<Block, { type: "h2" | "h3" }> => b.type === "h2" || b.type === "h3")
    .map((b) => ({ id: b.id, text: stripInline(b.text), level: b.type === "h2" ? 2 : 3 }));
}

function stripInline(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*`]/g, "");
}

/* ---------------------------- Inline rendering ---------------------------- */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/.source;

export function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  // Fresh regex per call: renderInline recurses, and a shared global regex's
  // lastIndex would be reset by the inner call (infinite loop).
  const re = new RegExp(INLINE_PATTERN, "g");
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${k++}`;
    if (tok.startsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold text-[#292522]">
          {renderInline(tok.slice(2, -2), key)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={key} className="rounded-md border border-[#F0E8E2] bg-[#FFFDF8] px-1.5 py-0.5 font-mono text-[0.85em] text-[#292522]">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("[")) {
      const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)!;
      const href = lm[2];
      const cls = "font-medium text-[#292522] underline decoration-[#E9A9C3] decoration-2 underline-offset-[3px] hover:decoration-[#292522] transition-colors";
      out.push(
        href.startsWith("/") || href.startsWith("#") ? (
          <Link key={key} href={href} className={cls}>
            {renderInline(lm[1], key)}
          </Link>
        ) : (
          <a key={key} href={href} className={cls} target="_blank" rel="noopener noreferrer">
            {renderInline(lm[1], key)}
          </a>
        )
      );
    } else {
      out.push(<em key={key}>{renderInline(tok.slice(1, -1), key)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ----------------------------- Block rendering ---------------------------- */

const CALLOUT_STYLES = {
  tip: { box: "border-emerald-200 bg-emerald-50/60", label: "Tip", labelCls: "text-emerald-800" },
  note: { box: "border-[#F0E8E2] bg-[#FFFDF8]", label: "Note", labelCls: "text-[#292522]" },
  warning: { box: "border-amber-200 bg-amber-50/70", label: "Watch out", labelCls: "text-amber-900" },
} as const;

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <>
      {blocks.map((b, idx) => {
        const key = `b-${idx}`;
        switch (b.type) {
          case "h2":
            return (
              <h2 key={key} id={b.id} className="scroll-mt-24 pt-6 text-2xl font-bold tracking-tight text-[#292522] sm:text-[1.65rem]">
                {renderInline(b.text, key)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={key} id={b.id} className="scroll-mt-24 pt-2 text-lg font-semibold text-[#292522] sm:text-xl">
                {renderInline(b.text, key)}
              </h3>
            );
          case "p":
            return <p key={key}>{renderInline(b.text, key)}</p>;
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-2 pl-6 marker:text-[#E9A9C3]">
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1">{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} start={b.start} className="list-decimal space-y-2.5 pl-6 marker:font-semibold marker:text-[#292522]">
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1">{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case "callout": {
            const s = CALLOUT_STYLES[b.variant];
            return (
              <aside key={key} className={`rounded-2xl border p-5 ${s.box}`} role="note">
                <p className={`mb-1.5 text-xs font-bold uppercase tracking-wider ${s.labelCls}`}>{s.label}</p>
                <div className="space-y-2 text-[0.95rem] text-[#3d3834]">
                  {b.lines.map((l, j) => (
                    <p key={j}>{renderInline(l, `${key}-${j}`)}</p>
                  ))}
                </div>
              </aside>
            );
          }
          case "code":
            return (
              <pre key={key} className="overflow-x-auto rounded-2xl border border-[#F0E8E2] bg-[#2B2724] p-4 text-[0.82rem] leading-relaxed text-[#F6F1EA]">
                <code className="font-mono">{b.code}</code>
              </pre>
            );
          case "table":
            return (
              <div key={key} className="overflow-x-auto rounded-2xl border border-[#F0E8E2] bg-white">
                <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                  <thead className="bg-[#FFFDF8]">
                    <tr>
                      {b.header.map((h, j) => (
                        <th key={j} scope="col" className="border-b border-[#F0E8E2] px-4 py-3 font-semibold text-[#292522]">
                          {renderInline(h, `${key}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-b border-[#F0E8E2] last:border-0 align-top">
                        {r.map((c, n) => (
                          <td key={n} className="px-4 py-3 text-[#4a4440]">{renderInline(c, `${key}-${j}-${n}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "img":
            return (
              <figure key={key} className="space-y-2">
                {/* Plain img keeps intrinsic SVG/PNG sizing; lazy-loaded below the fold */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt} width={b.width} height={b.height} loading="lazy" decoding="async" className="h-auto w-full rounded-2xl border border-[#F0E8E2] bg-white" />
                {b.caption && <figcaption className="text-center text-xs text-[#77716D]">{renderInline(b.caption, key)}</figcaption>}
              </figure>
            );
        }
      })}
    </>
  );
}
