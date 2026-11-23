import type { ActiveJob } from '../lib/jobs.js'

export type JobMotion = 'enter' | 'exit'
export type JobEntry = { job: ActiveJob, motion?: JobMotion }

/** Keep animated rows in place until their transition settles. */
export function reconcileRows(previous: readonly JobEntry[], jobs: readonly ActiveJob[]): JobEntry[] {
  const active = new Map(jobs.map(job => [job.id, job]))
  const rows = previous.map((entry): JobEntry => {
    const job = active.get(entry.job.id)
    if (job === undefined) return { ...entry, motion: 'exit' }
    active.delete(job.id)
    return { job, motion: entry.motion === 'exit' ? 'enter' : entry.motion }
  })
  for (const job of active.values()) rows.push({ job, motion: 'enter' })
  return rows.sort((left, right) => right.job.startedAt - left.job.startedAt)
}
