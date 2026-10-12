import assert from 'node:assert/strict'
import { test } from 'node:test'
import { type Mode, type Segment, transform } from '../src/transform.ts'

const FLOW = 'flowchart LR\n  A[Start] --> B[Done]'
const CLOSED = '```mermaid\n' + FLOW + '\n```'
const OPEN = '```mermaid\n' + FLOW
const WIDE = 100

const plain = (segments: Segment[] | null) =>
  segments?.map(s => (s.kind === 'diagram' ? s.rows.map(r => r.map(x => x.text).join('').trimEnd()).join('\n') : `[${s.kind}] ${s.text}`)).join('\n---\n') ?? null
const run = (markdown: string, mode: Mode = 'streaming', width: number | undefined = WIDE) => transform(markdown, { mode, width })
const unmeasured = (markdown: string) => transform(markdown, { mode: 'streaming', width: undefined })

test('mode matrix: off never draws, final draws closed fences only, streaming draws both', () => {
  assert.equal(run(CLOSED, 'off'), null)
  assert.equal(run(OPEN, 'off'), null)
  assert.equal(run(OPEN, 'final'), null)
  assert.equal(run(CLOSED, 'final')?.[0].kind, 'diagram')
  assert.equal(run(CLOSED, 'streaming')?.[0].kind, 'diagram')
  assert.equal(run(OPEN, 'streaming')?.[0].kind, 'diagram')
})

test('an unclosed trailing fence keeps the prose before it', () => {
  assert.equal(plain(run('Intro\n\n' + OPEN)), '[markdown] Intro\n\n---\n┌───────┐    ┌──────┐\n│ Start ├───▶│ Done │\n└───────┘    └──────┘')
})

test('an unclosed fence with warnings still draws while streaming', () => {
  const segments = run('```mermaid\nflowchart LR\n  A --> B\n  B --')
  assert.deepEqual(segments?.map(s => s.kind), ['diagram'])
})

test('a diagram wider than the room keeps the raw fence; exactly as wide draws', () => {
  assert.equal(run(CLOSED, 'streaming', 20), null)
  assert.equal(run(CLOSED, 'streaming', 21)?.[0].kind, 'diagram')
})

test('no measured width keeps the raw fence', () => {
  assert.equal(unmeasured(CLOSED), null)
})

test('a closed fence with warnings keeps the raw fence and adds one warning line', () => {
  const fence = '```mermaid\nflowchart LR\n  A[Foo] invalid\n  B[Bar] also-invalid\n```'
  assert.deepEqual(run(fence), [
    { kind: 'markdown', text: fence },
    { kind: 'warning', text: 'Mermaid diagram not rendered: dropped, expected a link: "invalid" (+1 more)' },
  ])
  assert.equal(plain(run('```mermaid\nflowchart LR\n  A[Foo] invalid\n```')), '[markdown] ```mermaid\nflowchart LR\n  A[Foo] invalid\n```\n---\n[warning] Mermaid diagram not rendered: dropped, expected a link: "invalid"')
})

test('unsupported types keep the raw fence', () => {
  assert.equal(run('```mermaid\ngantt\n  title X\n  section A\n  t :a1, 2024-01-01, 1d\n```'), null)
})

test('non-mermaid fences and their content are left alone, mermaid look-alikes inside them included', () => {
  assert.equal(run('```ts\nconst a = 1\n```'), null)
  assert.equal(run('````md\n' + CLOSED + '\n````'), null)
  assert.equal(run('    ```mermaid\n    ' + FLOW + '\n    ```'), null, 'indented code is not a fence')
  assert.equal(run('```mermaidx\n' + FLOW + '\n```'), null)
})

test('tilde fences, case-insensitive info strings and indented fences draw', () => {
  assert.equal(run('~~~ Mermaid title\n' + FLOW + '\n~~~')?.[0].kind, 'diagram')
  assert.equal(run('   ```mermaid\n   flowchart LR\n   A[Start] --> B[Done]\n   ```')?.[0].kind, 'diagram')
})

test('closing needs the same character and at least the opening length', () => {
  assert.equal(run('````mermaid\n' + FLOW + '\n```', 'final'), null)
  assert.equal(run('```mermaid\n' + FLOW + '\n~~~', 'final'), null)
  assert.equal(run('```mermaid\n' + FLOW + '\n````  ', 'final')?.[0].kind, 'diagram')
  assert.match(plain(run('````mermaid\nflowchart LR\n  A[a ``` b] --> B\n````'))!, /a ``` b/)
})

test('several diagrams split the prose into merged markdown segments', () => {
  const segments = run(`One\ntwo\n\n${CLOSED}\n\nMiddle\n\n\`\`\`js\nx\n\`\`\`\n\n${CLOSED}\nEnd`)
  assert.deepEqual(segments?.map(s => s.kind), ['markdown', 'diagram', 'markdown', 'diagram', 'markdown'])
  assert.equal((segments![2] as { text: string }).text, '\nMiddle\n\n```js\nx\n```\n')
  assert.equal((segments![0] as { text: string }).text, 'One\ntwo\n')
})

test('a fence kept raw merges into the prose around it', () => {
  const segments = run(`Before\n\`\`\`mermaid\ngantt\n\`\`\`\nAfter\n${CLOSED}`)
  assert.deepEqual(segments, [{ kind: 'markdown', text: 'Before\n```mermaid\ngantt\n```\nAfter' }, segments![1]])
})

test('no mermaid at all passes through', () => {
  assert.equal(run('Just words.'), null)
})
