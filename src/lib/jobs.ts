import type { JobView } from '@deepseek-ai/dsh-jobs'

export const JOBS_PATH = '/api/dsh-background-jobs.watch'

export type ActiveJob = Pick<JobView, 'id' | 'label' | 'owner' | 'startedAt'> & {
  readonly status: 'running' | 'stopping'
}

function isActiveJob(value: unknown): value is ActiveJob {
  return typeof value === 'object' && value !== null
    && 'id' in value && typeof value.id === 'string' && value.id !== ''
    && 'label' in value && typeof value.label === 'string'
    && (!('owner' in value) || typeof value.owner === 'string')
    && 'startedAt' in value && typeof value.startedAt === 'number' && Number.isFinite(value.startedAt)
    && 'status' in value && (value.status === 'running' || value.status === 'stopping')
}

export function parseActiveJobs(data: string): readonly ActiveJob[] | undefined {
  try {
    const value: unknown = JSON.parse(data)
    return Array.isArray(value) && value.every(isActiveJob) ? value : undefined
  } catch {
    return undefined
  }
}
