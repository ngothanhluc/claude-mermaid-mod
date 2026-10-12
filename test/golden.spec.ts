import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { FIXTURES, drawn, fixtureNames } from './golden.ts'

for (const name of fixtureNames()) {
  test(`${name} draws as recorded`, () => {
    assert.equal(drawn(name), readFileSync(new URL(`${name}.txt`, FIXTURES), 'utf8'))
  })
}
