import { expect, test } from 'claude-code/testing'

const PLUGIN = 'mermaid-mod'
const REPLY = 'Before the diagram.\n\n```mermaid\nflowchart LR\n  A[Start] --> B[Done]\n```\n\nAfter it.'
const VIEWPORT = { columns: 100, rows: 40 }
const COMMAND = { origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: VIEWPORT.columns } } as const

test('a reply with a mermaid fence becomes Markdown prose around coloured Text rows', async ($, on) => {
  on('ui.render', { component: 'AssistantMessage' }, (_$, e) => ({ type: 'Markdown', props: { text: e.props.text } }))
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AssistantMessage', props: { text: REPLY, isFirstOfReply: true }, viewport: VIEWPORT })
  expect(await ui.drawn()).toMatchObject({ type: 'Box' })
  expect(await ui.find({ type: 'Markdown', text: /Before the diagram/ })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: /After it/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /│ Start ├───▶│ Done │/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '⏺' })).toBeDefined()
  const json = JSON.stringify(await ui.drawn())
  expect(json).toContain('"color":"subtle"')
  expect(json).toContain('"color":"suggestion"')
  expect(await ui.find({ type: 'Markdown', text: /```mermaid[\s\S]*After it/ })).toBeDefined()
  expect(json.indexOf('Start ├')).toBeLessThan(json.indexOf('```mermaid'))
})

test('a later block of the reply draws no bullet', async ($, on) => {
  on('ui.render', { component: 'AssistantMessage' }, (_$, e) => ({ type: 'Markdown', props: { text: e.props.text } }))
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AssistantMessage', props: { text: REPLY, isFirstOfReply: false }, viewport: VIEWPORT })
  expect(await ui.find({ type: 'Text', text: /Start/ })).toBeDefined()
  expect(JSON.stringify(await ui.drawn())).not.toContain('⏺')
})

test('a reply without mermaid passes through untouched', async ($, on) => {
  on('ui.render', { component: 'AssistantMessage' }, (_$, e) => ({ type: 'Markdown', props: { text: e.props.text } }))
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AssistantMessage', props: { text: 'Just words.', isFirstOfReply: true }, viewport: VIEWPORT })
  expect(await ui.drawn()).toEqual({ type: 'Markdown', props: { text: 'Just words.' } })
})

test('/mermaid saves the mode to the store, and session start reads it back', async ($, on) => {
  const store = new Map<string, unknown>()
  // The kit wants `{ value }` from a bottom hook on a `$` call, which the typings don't model; mock.store can't be read back.
  on('store.get', (_$, e) => ({ value: store.get(e.key) }) as never)
  on('store.set', (_$, e) => {
    store.set(e.key, e.value)
    return { value: undefined } as never
  })
  on('command.register', (_$, e) => ({ value: { command: e.name } }) as never)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('ui.render', { component: 'AssistantMessage' }, (_$, e) => ({ type: 'Markdown', props: { text: e.props.text } }))

  expect(await $.command.run({ ...COMMAND, command: 'mermaid', args: 'off' })).toMatchObject({ text: 'mermaid: off, both' })
  expect(store.get('mode')).toBe('off')
  expect(await $.command.run({ ...COMMAND, command: 'mermaid', args: '' })).toMatchObject({ text: 'mermaid: off, both' })
  expect((await $.command.run({ ...COMMAND, command: 'mermaid', args: 'loud' })).text).toContain('unknown setting')

  const mount = async () =>
    (await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AssistantMessage', props: { text: REPLY, isFirstOfReply: true }, viewport: VIEWPORT })).drawn()
  expect(await mount()).toMatchObject({ type: 'Markdown' })

  store.set('mode', 'final')
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  expect(await mount()).toMatchObject({ type: 'Box' })
  expect(await $.command.run({ ...COMMAND, command: 'mermaid', args: '' })).toMatchObject({ text: 'mermaid: final, both' })

  expect(await $.command.run({ ...COMMAND, command: 'mermaid', args: 'diagram' })).toMatchObject({ text: 'mermaid: final, diagram' })
  expect(store.get('display')).toBe('diagram')
  expect(JSON.stringify(await mount())).not.toContain('```mermaid')
})
