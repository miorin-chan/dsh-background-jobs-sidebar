import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reconcileRows } from '../src/client/job-entries.ts'
import type { ActiveJob } from '../src/lib/jobs.ts'

const first: ActiveJob = { id: 'job-first' as ActiveJob['id'], label: 'First', startedAt: 1, status: 'running' }
const second: ActiveJob = { id: 'job-second' as ActiveJob['id'], label: 'Second', startedAt: 2, status: 'running' }

test('preserves in-flight row transitions across duplicate and consecutive task snapshots', () => {
  const entering = reconcileRows([], [first])
  assert.deepEqual(reconcileRows(entering, [first]), [{ job: first, motion: 'enter' }])

  const stopping = { ...first, status: 'stopping' } as const
  const both = reconcileRows(entering, [second, stopping])
  assert.deepEqual(both, [{ job: second, motion: 'enter' }, { job: stopping, motion: 'enter' }])

  const leaving = reconcileRows(both, [second])
  assert.deepEqual(leaving, [{ job: second, motion: 'enter' }, { job: stopping, motion: 'exit' }])
  assert.deepEqual(reconcileRows(leaving, [second]), leaving)
})
