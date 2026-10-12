import { writeFileSync } from 'node:fs'
import { FIXTURES, drawn, fixtureNames } from '../test/golden.ts'

for (const name of fixtureNames()) {
  writeFileSync(new URL(`${name}.txt`, FIXTURES), drawn(name))
  console.log(name)
}
