import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
let registration
globalThis.window = { __ModuleLoader__: { load(entry) { registration = entry } } }
await import('../client.js')

assert.equal(registration.id, '@miorin/dsh-background-jobs-sidebar')
// The shell seeds these modules; the primitives are resolved only when the section renders.
const seeded = new Set(['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'])
const plugin = registration.factory((id: string) => {
  assert.ok(seeded.has(id), `unexpected client import ${id}`)
  return id === '@deepseek-ai/dsh-client-ui-primitives' ? {} : require(id)
})
const slot = 'sidebar.footer.action'

test('registers the localized sidebar layer and removes its effects on unload', () => {
  const disposers = []
  const dictionaries = new Map()
  const components = new Map()
  plugin.apply({
    effect(install) { disposers.push(install()) },
    locale: {
      register(namespace, labels) {
        dictionaries.set(namespace, labels)
        return () => { dictionaries.delete(namespace) }
      },
    },
    slots: {
      inject(name, register) {
        assert.equal(name, slot)
        return register()
      },
      register(spec, component) {
        assert.equal(spec.name, slot)
        assert.equal(spec.locale, spec.id)
        assert.equal(spec.order, 100)
        components.set(spec.id, component)
        return () => { components.delete(spec.id) }
      },
    },
    uiWorkspace: { openSession() {} },
  })

  const labels = dictionaries.get('dsh-background-jobs-sidebar')
  assert.equal(labels.zh.heading, '后台任务')
  assert.equal(Object.keys(labels).length, 8)

  const footer = components.get('dsh-background-jobs-sidebar')
  const open = footer({ wide: true })
  assert.equal(open.type.name, 'JobsSection')
  assert.equal(footer({ wide: false }), null)

  for (const dispose of disposers.reverse()) dispose()
  assert.equal(components.size, 0)
  assert.equal(dictionaries.size, 0)
})
