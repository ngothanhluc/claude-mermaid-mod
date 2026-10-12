export function normalize(source: string): string {
  return (
    source
      // `A --> |yes| B` loses B ("link has no target") though Mermaid accepts it; drop when lovely-mermaid fixes it upstream.
      .replace(/([-=.]{2,}[>xo]?)[ \t]+(?=\|)/g, '$1')
      // Mermaid's entity codes (`#quot;`, `#35;`) are drawn literally; drop when lovely-mermaid fixes it upstream.
      .replace(/#quot;/g, '"')
      .replace(/#(\d+);/g, (match, code: string) => (Number(code) <= 0x10ffff ? String.fromCodePoint(Number(code)) : match))
  )
}
