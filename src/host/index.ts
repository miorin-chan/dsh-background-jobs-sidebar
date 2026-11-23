import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-connection'
import type { JobId, JobView } from '@deepseek-ai/dsh-jobs'
import type { SessionStore } from '@deepseek-ai/dsh-session'
import { JOBS_PATH } from '../lib/jobs.js'
import type { ActiveJob } from '../lib/jobs.js'

export const inject = ['connection', 'jobs', 'sessions']

function toActiveJob({ id, label, owner, startedAt, status }: JobView): ActiveJob | undefined {
  if (status === 'running' || status === 'stopping') return { id, label, owner, startedAt, status }
}

interface JobRoster {
  frame(): Uint8Array
  subscribe(send: () => void): () => void
}

function watchJobs(roster: JobRoster, signal: AbortSignal): Response {
  let send: () => void
  let stop: () => void
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let lastFrame: Uint8Array | undefined
      send = () => {
        const frame = roster.frame()
        // A slow reader gets the latest snapshot on pull without queuing older updates.
        if (frame !== lastFrame && (controller.desiredSize ?? 0) > 0) {
          controller.enqueue(frame)
          lastFrame = frame
        }
      }
      const unsubscribe = roster.subscribe(send)
      const abort = () => {
        stop()
        controller.close()
      }
      stop = () => {
        unsubscribe()
        signal.removeEventListener('abort', abort)
      }
      if (signal.aborted) abort()
      else {
        signal.addEventListener('abort', abort, { once: true })
        send()
      }
    },
    pull: () => send(),
    cancel: () => stop(),
  })
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}

// Client and Host both declare `sessions` on Cordis Context.
type HostContext = Omit<Context, 'sessions'> & { sessions: SessionStore }

export function apply(ctx: HostContext): void {
  const jobs = ctx.jobs
  const active = new Map<JobId, ActiveJob>()
  // The registry lists unowned jobs alone or in union with one live Session's jobs.
  const existing = [
    ...jobs.list(),
    ...ctx.sessions.list().flatMap(({ id }) => jobs.list(id).filter(job => job.owner === id)),
  ]
  for (const job of existing.map(toActiveJob)) {
    if (job) active.set(job.id, job)
  }

  const encoder = new TextEncoder()
  const subscribers = new Set<() => void>()
  let frame: Uint8Array | undefined
  const roster: JobRoster = {
    frame() {
      if (frame === undefined) {
        const rows = [...active.values()].sort((left, right) => right.startedAt - left.startedAt)
        frame = encoder.encode(`data: ${JSON.stringify(rows)}\n\n`)
      }
      return frame
    },
    subscribe(send) {
      subscribers.add(send)
      return () => { subscribers.delete(send) }
    },
  }

  ctx.effect(() => jobs.events.subscribe({ owners: 'all' }, event => {
    if (event.type === 'output' || event.type === 'progress') return
    const job = event.type === 'removed' ? undefined : toActiveJob(event.job)
    if (job) active.set(job.id, job)
    else if (!active.delete(event.job.id)) return

    frame = undefined
    for (const send of subscribers) send()
  }))

  ctx.effect(() => {
    const lifetime = new AbortController()
    // Connection admits only authenticated owner peers to an exact Fetch route.
    const unregister = ctx.connection.fetch.register({
      path: JOBS_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async request => watchJobs(roster, AbortSignal.any([request.signal, lifetime.signal])),
    })
    return async () => {
      lifetime.abort()
      await unregister()
    }
  })
}
