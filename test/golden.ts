import { readdirSync, readFileSync } from 'node:fs'
import { transform } from '../src/transform.ts'

export const FIXTURES = new URL('./fixtures/', import.meta.url)

export const fixtureNames = () =>
  readdirSync(FIXTURES)
    .filter(f => f.endsWith('.mmd'))
    .map(f => f.slice(0, -4))

// What a fixture draws to: its diagram rows as plain text, or `null` when transform keeps the fence.
export function drawn(name: string): string {
  const source = readFileSync(new URL(`${name}.mmd`, FIXTURES), 'utf8')
  const segments = transform('```mermaid\n' + source + '```', { mode: 'final', width: 1000 })
  if (!segments) return 'null\n'
  return segments
    .map(s => (s.kind === 'diagram' ? s.rows.map(r => r.map(span => span.text).join('').trimEnd()).join('\n') : `${s.kind}: ${s.text}`))
    .join('\n') + '\n'
}
