import { useEffect, useId, useState } from 'react'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session'
import { JOBS_PATH, parseActiveJobs } from '../lib/jobs.js'
import type { ActiveJob } from '../lib/jobs.js'
import type { NS } from './locale.js'
import { STYLES } from './styles.js'

type RosterState = { phase: 'loading' | 'unavailable' } | { phase: 'ready', jobs: readonly ActiveJob[] }

type JobsProps = Pick<PropsRuntime<'sidebar.footer.action'>, 'useSessions' | 'useWorkspaces'>
  & PropsLocale<typeof NS> & { openSession: (id: SessionId) => void }

function JobRow({ job, t, useSessions, useWorkspaces, openSession }: JobsProps & { job: ActiveJob }) {
  const owner = job.owner
  const session = useSessions((state: SessionListState) => owner === undefined ? undefined : state.byId[owner]?.displayTitle)
  const archived = useWorkspaces((state: WorkspaceSnapshot) => owner !== undefined && state.archivedSessionIds.includes(owner))
  const label = job.label.trim() || job.id
  const source = owner === undefined ? t('unowned') : session ?? owner
  const text = <>
    <span className="dsh-background-jobs-dot" aria-hidden="true" />
    <span className="dsh-background-jobs-details">
      <span className="dsh-background-jobs-label" title={label}>{label}</span>
      <span className="dsh-background-jobs-meta">
        <span className="dsh-background-jobs-owner" title={source}>{source}</span>
        <span className="dsh-background-jobs-phase">{t(job.status)}</span>
      </span>
    </span>
  </>

  return <li data-job-id={job.id}>{owner !== undefined && session && !archived
    ? <button type="button" className="dsh-background-jobs-row" data-status={job.status}
      onClick={() => openSession(owner)}>{text}</button>
    : <div className="dsh-background-jobs-row" data-status={job.status}>{text}</div>}
  </li>
}

export function JobsSection(props: JobsProps) {
  const id = useId()
  const paneId = useId()
  const [state, setState] = useState<RosterState>({ phase: 'loading' })
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const source = new EventSource(JOBS_PATH)
    source.onmessage = (event: MessageEvent<string>) => {
      const jobs = parseActiveJobs(event.data)
      setState(jobs === undefined ? { phase: 'unavailable' } : { phase: 'ready', jobs })
    }
    source.onerror = () => setState({ phase: 'unavailable' })
    return () => source.close()
  }, [])

  const count = state.phase === 'ready' ? state.jobs.length : undefined
  const title = props.t('heading')
  return <section className="dsh-background-jobs" aria-labelledby={id}>
    <style>{STYLES}</style>
    <header className="dsh-background-jobs-header">
      <h2 id={id}>
        {count
          ? <button type="button" className="dsh-background-jobs-heading" aria-expanded={expanded}
              aria-controls={paneId} onClick={() => setExpanded(open => !open)}>
              <span className="dsh-background-jobs-title" title={title}>{title}</span>
              <span className="dsh-background-jobs-arrow" aria-hidden="true" />
            </button>
          : <span className="dsh-background-jobs-heading">
              <span className="dsh-background-jobs-title" title={title}>{title}</span>
            </span>}
      </h2>
      <span className="dsh-background-jobs-count" aria-live="polite">{count}</span>
    </header>
    <div id={paneId} hidden={!expanded && state.phase === 'ready'}>
      {state.phase === 'ready'
        ? state.jobs.length > 0 && <ul className="dsh-background-jobs-list" tabIndex={0} aria-labelledby={id}>
          {state.jobs.map(job => <JobRow key={job.id} job={job} {...props} />)}
        </ul>
        : <p className="dsh-background-jobs-status" role="status">{props.t(state.phase)}</p>}
    </div>
  </section>
}
