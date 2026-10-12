import { render, type Span } from '../hooks/vendor/lovely-mermaid.js'
import { normalize } from './normalize.ts'

export type Mode = 'off' | 'final' | 'streaming'
export type Segment =
  | { kind: 'markdown'; text: string }
  | { kind: 'diagram'; rows: Span[][] }
  | { kind: 'warning'; text: string }

type Fence = { char: string; length: number; indent: number; isMermaid: boolean; start: number }

const OPENING = /^( {0,3})(`{3,}|~{3,})(.*)$/
const CLOSING = /^ {0,3}(`{3,}|~{3,})[ \t\r]*$/

function openingOf(line: string, start: number): Fence | null {
  const m = OPENING.exec(line)
  if (!m) return null
  const [, indent = '', run = '', info = ''] = m
  const char = run.charAt(0)
  if (char === '`' && info.includes('`')) return null
  const lang = info.trim().split(/\s+/, 1)[0]?.toLowerCase()
  return { char, length: run.length, indent: indent.length, isMermaid: lang === 'mermaid', start }
}

function closes(fence: Fence, line: string): boolean {
  const run = CLOSING.exec(line)?.[1] ?? ''
  return run.charAt(0) === fence.char && run.length >= fence.length
}

// shortcut: a fence indented 1-3 spaces inside a list item counts as top level; parse list context if that misfires.
export function transform(markdown: string, ctx: { mode: Mode; width: number | undefined }): Segment[] | null {
  if (ctx.mode === 'off') return null
  const lines = markdown.split('\n')
  const segments: Segment[] = []
  let prose: string[] = []
  let drewSomething = false

  const flush = () => {
    const text = prose.join('\n')
    if (text.trim()) segments.push({ kind: 'markdown', text })
    prose = []
  }

  const settle = (fence: Fence, end: number, closed: boolean) => {
    const raw = lines.slice(fence.start, closed ? end + 1 : end)
    const art =
      ctx.width === undefined || (!closed && ctx.mode === 'final')
        ? null
        : render(normalize(lines.slice(fence.start + 1, end).map(l => l.replace(new RegExp(`^ {0,${fence.indent}}`), '')).join('\n')))
    if (!art || art.width > ctx.width!) {
      prose.push(...raw)
      return
    }
    if (closed && art.warnings.length > 0) {
      prose.push(...raw)
      flush()
      const more = art.warnings.length > 1 ? ` (+${art.warnings.length - 1} more)` : ''
      segments.push({ kind: 'warning', text: `Mermaid diagram not rendered: ${art.warnings[0]}${more}` })
    } else {
      flush()
      segments.push({ kind: 'diagram', rows: art.styled })
    }
    drewSomething = true
  }

  let fence: Fence | null = null
  for (const [i, line] of lines.entries()) {
    if (!fence) {
      fence = openingOf(line, i)
      if (!fence?.isMermaid) prose.push(line)
      continue
    }
    if (closes(fence, line)) {
      if (fence.isMermaid) settle(fence, i, true)
      else prose.push(line)
      fence = null
    } else if (!fence.isMermaid) prose.push(line)
  }
  if (fence?.isMermaid) settle(fence, lines.length, false)
  flush()
  return drewSomething ? segments : null
}
