import type { Register } from 'claude-code'
import { ROLE_STYLE, WARNING_COLOR } from '../src/theme.ts'
import { type Mode, type Segment, transform } from '../src/transform.ts'

const MODES: readonly Mode[] = ['off', 'final', 'streaming']
const BULLET = '⏺'
// Measured: reply text sits behind a 2-column gutter ("⏺ "); one more column keeps the art off the edge.
const GUTTER = 3
const CACHE_LIMIT = 64

let mode: Mode = 'streaming'
const cache = new Map<string, Segment[] | null>()

function cached(text: string, width: number | undefined): Segment[] | null {
  const key = `${mode}\0${width}\0${text}`
  if (cache.has(key)) return cache.get(key)!
  const segments = transform(text, { mode, width })
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!)
  cache.set(key, segments)
  return segments
}

const isMode = (value: unknown): value is Mode => MODES.includes(value as Mode)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const saved = await $.store.get('mode').catch(() => undefined)
    if (isMode(saved)) mode = saved
    await $.command
      .register({ name: 'mermaid', description: 'Draw ```mermaid blocks as diagrams: off, final or streaming', argumentHint: '[off|final|streaming]', immediate: true })
      .catch(err => $.ui.log(`mermaid-mod: /mermaid not registered: ${err}`))
    return result
  })

  on('command.run', { command: 'mermaid' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (!arg) return { text: `mermaid: ${mode}` }
    if (!isMode(arg)) return { text: `mermaid: unknown mode "${arg}"; use off, final or streaming` }
    mode = arg
    await $.store.set('mode', mode)
    $.ui.invalidate('ui.render')
    return { text: `mermaid: ${mode}` }
  })

  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    const width = e.viewport ? e.viewport.columns - GUTTER : undefined
    const segments = cached(e.props.text, width)
    if (!segments) return next(e)
    const { Box, Text, Markdown } = $.ui.resolve(e)
    const body = segments.map(segment => {
      if (segment.kind === 'markdown') return Markdown({ text: segment.text })
      if (segment.kind === 'warning') return Text({ color: WARNING_COLOR, children: segment.text })
      return Box({
        flexDirection: 'column',
        children: segment.rows.map(row =>
          Text({ children: row.length ? row.map(span => (ROLE_STYLE[span.role].color ? Text({ ...ROLE_STYLE[span.role], children: span.text }) : span.text)) : ' ' }),
        ),
      })
    })
    return Box({
      flexDirection: 'row',
      children: [
        Text({ children: e.props.isFirstOfReply ? `${BULLET} ` : '  ' }),
        Box({ flexDirection: 'column', flexGrow: 1, gap: 1, children: body }),
      ],
    })
  })
}
