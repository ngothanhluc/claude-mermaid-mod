import assert from 'node:assert/strict'
import { test } from 'node:test'
import { render } from '../hooks/vendor/lovely-mermaid.js'
import { normalize } from '../src/normalize.ts'

test('whitespace between an arrow and its |label| is removed, so the target survives', () => {
  const source = 'flowchart LR\n  A --> |yes| B\n  C -.-> \t|no| D'
  assert.equal(normalize(source), 'flowchart LR\n  A -->|yes| B\n  C -.->|no| D')
  const art = render(normalize(source))
  assert.deepEqual(art?.warnings, [])
  assert.match(art!.plain.join('\n'), /│ B │/)
})

test('entity codes #quot; and #NNN; decode to characters', () => {
  assert.equal(normalize('A["say #quot;hi#quot; #35;1 #9829;"]'), 'A["say "hi" #1 ♥"]')
  assert.equal(normalize('#99999999;'), '#99999999;')
})
