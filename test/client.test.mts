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

type ElementNode = { type?: unknown, props?: Record<string, unknown> }

function findElement(node: unknown, match: (element: ElementNode) => boolean): ElementNode | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, match)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (node === null || typeof node !== 'object') return undefined
  const element = node as ElementNode
  if (match(element)) return element
  return findElement(element.props?.children, match)
}

test('marks the header job count with data-active only when active jobs exceed zero', () => {
  const states: unknown[] = []
  const cleanups: (() => void)[] = []
  let hookIndex = 0
  let pendingEffects: (() => void)[] = []

  const registerEffect = (defer: boolean) => (install: () => void | (() => void), deps?: readonly unknown[]) => {
    const index = hookIndex++
    const prev = states[index] as { deps?: readonly unknown[], cleanup?: () => void } | undefined
    if (prev && deps !== undefined && prev.deps !== undefined && !deps.some((dep, i) => !Object.is(dep, prev.deps?.[i]))) return
    states[index] = { deps }
    const run = () => {
      prev?.cleanup?.()
      const cleanup = install()
      if (typeof cleanup === 'function') {
        (states[index] as { cleanup?: () => void }).cleanup = cleanup
        cleanups.push(cleanup)
      }
    }
    if (defer) pendingEffects.push(run)
    else run()
  }

  const react = {
    ...require('react'),
    useCallback: <T>(fn: T) => fn,
    useId: () => {
      const index = hookIndex++
      if (!(index in states)) states[index] = `:r${index}:`
      return states[index]
    },
    useRef: <T>(initial: T) => {
      const index = hookIndex++
      if (!(index in states)) states[index] = { current: initial }
      return states[index]
    },
    useState: <T>(initial: T | (() => T)) => {
      const index = hookIndex++
      if (!(index in states)) {
        states[index] = typeof initial === 'function' ? (initial as () => T)() : initial
      }
      return [
        states[index] as T,
        (next: T | ((prev: T) => T)) => {
          states[index] = typeof next === 'function'
            ? (next as (prev: T) => T)(states[index] as T)
            : next
        },
      ] as const
    },
    useEffect: registerEffect(true),
    useLayoutEffect: registerEffect(false),
  }

  const fakePlugin = registration.factory((id: string) => {
    assert.ok(seeded.has(id), `unexpected client import ${id}`)
    if (id === 'react') return react
    if (id === '@deepseek-ai/dsh-client-ui-primitives') {
      return {
        IconTriangleRightFillRegular: () => null,
        Tooltip: ({ children }: { children?: unknown }) => children,
      }
    }
    return require(id)
  })

  const disposers: (() => void)[] = []
  const components = new Map<string, (props: Record<string, unknown>) => { type: (props: Record<string, unknown>) => unknown, props: Record<string, unknown> }>()
  fakePlugin.apply({
    effect(install: () => () => void) { disposers.push(install()) },
    locale: { register: () => () => {} },
    slots: {
      inject: (_name: string, register: () => () => void) => register(),
      register: (spec: { id: string }, component: (props: Record<string, unknown>) => { type: (props: Record<string, unknown>) => unknown, props: Record<string, unknown> }) => {
        components.set(spec.id, component)
        return () => { components.delete(spec.id) }
      },
    },
    uiWorkspace: { openSession() {} },
  })

  const footer = components.get('dsh-background-jobs-sidebar')!
  const open = footer({
    wide: true,
    t: (key: string) => key,
    useSessions: () => undefined,
    useWorkspaces: () => false,
  })

  const sources: { url: string, onmessage: ((event: MessageEvent<string>) => void) | null, onerror: (() => void) | null, closed: boolean, close: () => void }[] = []
  const previousEventSource = globalThis.EventSource
  const previousMatchMedia = globalThis.window.matchMedia
  globalThis.EventSource = class {
    url: string
    onmessage: ((event: MessageEvent<string>) => void) | null = null
    onerror: (() => void) | null = null
    closed = false
    constructor(url: string) {
      this.url = url
      sources.push(this)
    }
    close() { this.closed = true }
  } as unknown as typeof EventSource
  globalThis.window.matchMedia = ((query: string) => ({ media: query, matches: false })) as unknown as typeof window.matchMedia

  try {
    const render = () => {
      hookIndex = 0
      pendingEffects = []
      const tree = open.type(open.props)
      for (const runEffect of pendingEffects) runEffect()
      return tree
    }
    const countPropsOf = (tree: unknown) => {
      const node = findElement(tree, element => element.props?.className === 'dsh-background-jobs-count')
      assert.ok(node?.props)
      return node.props
    }

    // Initial loading render.
    const loadingTree = render()
    const styleNode = findElement(loadingTree, element => element.type === 'style')
    assert.equal(typeof styleNode?.props?.children, 'string')
    assert.match(styleNode!.props!.children as string, /\.dsh-background-jobs-count\[data-active\]\s*\{\s*color:\s*var\(--dsw-alias-state-business-primary\);?\s*\}/)
    assert.equal(countPropsOf(loadingTree).children, undefined)
    assert.equal(countPropsOf(loadingTree)['data-active'], undefined)
    assert.equal(sources.length, 1)

    // Ready with 0 jobs.
    sources[0].onmessage?.({ data: '[]' } as MessageEvent<string>)
    const emptyTree = render()
    assert.equal(countPropsOf(emptyTree).children, 0)
    assert.equal(countPropsOf(emptyTree)['data-active'], undefined)

    // Ready with 1 active job.
    sources[0].onmessage?.({
      data: JSON.stringify([{ id: 'job-1', label: 'Build', startedAt: 1, status: 'running' }]),
    } as MessageEvent<string>)
    const activeTree = render()
    assert.equal(countPropsOf(activeTree).children, 1)
    assert.equal(countPropsOf(activeTree)['data-active'], '')

    // Returns to 0 jobs immediately even while the exiting row stays mounted for its transition.
    sources[0].onmessage?.({ data: '[]' } as MessageEvent<string>)
    const exitingTree = render()
    assert.equal(countPropsOf(exitingTree).children, 0)
    assert.equal(countPropsOf(exitingTree)['data-active'], undefined)
    assert.ok(findElement(exitingTree, element => (element.props?.entry as { motion?: string } | undefined)?.motion === 'exit'))

    // Unavailable state clears both count and active attribute even from an active count.
    sources[0].onmessage?.({
      data: JSON.stringify([{ id: 'job-2', label: 'Test', startedAt: 2, status: 'running' }]),
    } as MessageEvent<string>)
    render()
    sources[0].onerror?.()
    const unavailableTree = render()
    assert.equal(countPropsOf(unavailableTree).children, undefined)
    assert.equal(countPropsOf(unavailableTree)['data-active'], undefined)

    for (const cleanup of cleanups) cleanup()
    assert.equal(sources[0].closed, true)
  } finally {
    for (const dispose of disposers.reverse()) dispose()
    if (previousEventSource === undefined) {
      delete (globalThis as Record<string, unknown>).EventSource
    } else {
      globalThis.EventSource = previousEventSource
    }
    if (previousMatchMedia === undefined) {
      delete (globalThis.window as Record<string, unknown>).matchMedia
    } else {
      globalThis.window.matchMedia = previousMatchMedia
    }
  }
})
