import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apply } from '../index.js'
import { JOBS_PATH, parseActiveJobs } from '../lib/jobs.js'

function view(id: string, startedAt: number, owner?: string, status = 'running') {
  return { id, startedAt, owner, status, label: `Task ${id}`, kind: 'bash', output: { total: 0, earliest: 0 } }
}

function fixture(seed: ReturnType<typeof view>[] = []) {
  const disposers = []
  let listen
  let route
  apply({
    effect(install) { disposers.push(install()) },
    sessions: { list: () => [{ id: 'a' }, { id: 'b' }] },
    jobs: {
      list: (owner?: string) => seed.filter(job => !job.owner || job.owner === owner),
      events: {
        subscribe(filter, listener) {
          assert.deepEqual(filter, { owners: 'all' })
          listen = listener
          return () => { listen = undefined }
        },
      },
    },
    connection: {
      fetch: {
        register(entry) {
          assert.equal(entry.path, JOBS_PATH)
          assert.deepEqual(entry.methods, ['GET'])
          route = entry
          return async () => { route = undefined }
        },
      },
    },
  })
  return {
    emit(event) { listen?.(event) },
    listening: () => listen !== undefined,
    route: () => route,
    async open(signal?: AbortSignal) {
      const response = await route.fetch(new Request(`http://localhost${JOBS_PATH}`, { signal }))
      assert.match(response.headers.get('content-type'), /^text\/event-stream/)
      assert.equal(response.headers.get('cache-control'), 'no-store, no-transform')
      return response.body.getReader()
    },
    async dispose() { for (const dispose of disposers.reverse()) await dispose() },
  }
}

async function readRows(reader) {
  const next = await reader.read()
  assert.equal(next.done, false)
  const frame = new TextDecoder().decode(next.value)
  assert.match(frame, /^data: .*\n\n$/)
  const rows = parseActiveJobs(frame.slice(6))
  assert.ok(rows)
  return rows
}

test('streams already-running and newly registered jobs across owners, then removes settled rows', async () => {
  const shared = view('shared', 1)
  const a = view('a-started', 2, 'a')
  const b = view('b-started', 3, 'b', 'stopping')
  const finished = view('finished', 4, 'b', 'completed')
  const host = fixture([shared, a, b, finished])
  const reader = await host.open()
  const ids = async () => (await readRows(reader)).map(job => job.id)
  const newlyStarted = view('newly-registered', 5, 'another-live-owner')
  try {
    assert.deepEqual(await ids(), [b.id, a.id, shared.id])

    host.emit({ type: 'registered', job: newlyStarted })
    assert.deepEqual(await ids(), [newlyStarted.id, b.id, a.id, shared.id])

    host.emit({ type: 'output', id: a.id, total: 10 })
    host.emit({ type: 'progress', job: { ...a, progress: 'Rebuilding' } })
    host.emit({ type: 'stopping', job: { ...a, status: 'stopping' } })
    const rows = await readRows(reader)
    assert.equal(rows.find(job => job.id === a.id)?.status, 'stopping')
    assert.deepEqual(Object.keys(rows[0]).sort(), ['id', 'label', 'owner', 'startedAt', 'status'])

    host.emit({ type: 'settled', job: { ...b, status: 'killed' } })
    assert.deepEqual(await ids(), [newlyStarted.id, a.id, shared.id])
    host.emit({ type: 'removed', job: shared })
    assert.deepEqual(await ids(), [newlyStarted.id, a.id])
  } finally {
    await reader.cancel()
    await host.dispose()
  }
})

test('closes disconnected and disabled streams and unregisters the route', async () => {
  const host = fixture()
  const abort = new AbortController()
  const reader = await host.open(abort.signal)
  const otherReader = await host.open()
  assert.deepEqual(await readRows(reader), [])
  assert.deepEqual(await readRows(otherReader), [])
  const pending = reader.read()
  abort.abort()
  assert.equal((await pending).done, true)

  const otherPending = otherReader.read()
  await host.dispose()
  assert.equal((await otherPending).done, true)
  assert.equal(host.route(), undefined)
  assert.equal(host.listening(), false)
})

test('accepts an empty snapshot and rejects malformed or settled rows', () => {
  assert.deepEqual(parseActiveJobs('[]'), [])
  assert.equal(parseActiveJobs('data: missing payload'), undefined)
  assert.equal(parseActiveJobs(JSON.stringify([view('finished', 1, 'a', 'failed')])), undefined)
  assert.equal(parseActiveJobs(JSON.stringify([{ ...view('invalid-owner', 1), owner: 1 }])), undefined)
})
