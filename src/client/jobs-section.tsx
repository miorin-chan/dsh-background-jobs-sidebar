import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { IconTriangleRightFillRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session'
import { JOBS_PATH, parseActiveJobs } from '../lib/jobs.js'
import type { ActiveJob } from '../lib/jobs.js'
import { reconcileRows } from './job-entries.js'
import type { JobEntry, JobMotion } from './job-entries.js'
import { observeListSpace } from './list-space.js'
import type { NS } from './locale.js'
import { STYLES } from './styles.js'

type RosterState = { phase: 'loading' | 'unavailable' } | { phase: 'ready', rows: readonly JobEntry[] }
type SectionState = { expanded: boolean, roster: RosterState }

type JobsProps = Pick<PropsRuntime<'sidebar.footer.action'>, 'useSessions' | 'useWorkspaces'>
  & PropsLocale<typeof NS> & { openSession: (id: SessionId) => void }

type JobRowProps = JobsProps & {
  entry: JobEntry
  onMotionEnd: (id: ActiveJob['id'], motion: JobMotion) => void
}

function JobRow({ entry: { job, motion }, onMotionEnd, t, useSessions, useWorkspaces, openSession }: JobRowProps) {
  const ref = useRef<HTMLLIElement>(null)
  useLayoutEffect(() => {
    const row = ref.current
    if (row === null) return
    row.inert = motion !== undefined
    if (motion === undefined) return

    // A cancelled transition also settles when the user enables reduced motion.
    let current = true
    const animations = row.getAnimations?.() ?? []
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (current) onMotionEnd(job.id, motion)
    })
    return () => { current = false }
  }, [motion, job.id, onMotionEnd])

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

  return <li ref={ref} className="dsh-background-jobs-entry" data-job-id={job.id} data-motion={motion}>
    <div className="dsh-background-jobs-clip">
      {owner !== undefined && session && !archived
        ? <button type="button" className="dsh-background-jobs-row" data-status={job.status}
          onClick={() => openSession(owner)}>{text}</button>
        : <div className="dsh-background-jobs-row" data-status={job.status}>{text}</div>}
    </div>
  </li>
}

export function JobsSection(props: JobsProps) {
  const id = useId()
  const paneId = useId()
  const section = useRef<HTMLElement>(null)
  const [listClipped, setListClipped] = useState(false)
  const [{ expanded, roster }, setState] = useState<SectionState>({ expanded: true, roster: { phase: 'loading' } })
  const listExpanded = expanded && !listClipped

  useLayoutEffect(() => {
    if (section.current !== null) return observeListSpace(section.current, setListClipped)
  }, [])

  useEffect(() => {
    const source = new EventSource(JOBS_PATH)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const unavailable = () => setState(state => ({ ...state, roster: { phase: 'unavailable' } }))
    source.onmessage = (event: MessageEvent<string>) => {
      const jobs = parseActiveJobs(event.data)
      if (jobs === undefined) {
        unavailable()
        return
      }
      const animate = !reducedMotion.matches
      setState(state => {
        const rows = animate && state.expanded && state.roster.phase === 'ready'
          ? reconcileRows(state.roster.rows, jobs)
          : jobs.map(job => ({ job }))
        return { ...state, roster: { phase: 'ready', rows } }
      })
    }
    source.onerror = unavailable
    return () => source.close()
  }, [])

  const finishRowMotion = useCallback((id: ActiveJob['id'], motion: JobMotion) => {
    setState(state => {
      if (state.roster.phase !== 'ready') return state
      const rows = state.roster.rows.flatMap(entry => {
        if (entry.job.id !== id || entry.motion !== motion) return [entry]
        return motion === 'exit' ? [] : [{ job: entry.job }]
      })
      return { ...state, roster: { phase: 'ready', rows } }
    })
  }, [])

  const count = roster.phase === 'ready' ? roster.rows.filter(entry => entry.motion !== 'exit').length : undefined
  const title = props.t('heading')
  // The count stays beside the label, as the file header of SearchBlock in
  // @deepseek-ai/dsh-client-ui-primitives@0.2.2-rc.5 pairs a path with its match count.
  // The trailing edge of sidebar section headers belongs to icon actions.
  const label = <span className="dsh-background-jobs-label-group">
    <span className="dsh-background-jobs-title">{title}</span>
    <span className="dsh-background-jobs-count" aria-live="polite">{count}</span>
  </span>
  return <section ref={section} className="dsh-background-jobs" aria-labelledby={id}
    data-list-clipped={listClipped ? '' : undefined}>
    <style>{STYLES}</style>
    <header className="dsh-background-jobs-header">
      <h2 id={id}>
        <Tooltip label={title} side="right" onlyWhenClipped portal>
          {/* The disclosure stays available without jobs, so a collapsed section
              stays collapsed when the next job starts. */}
          <button type="button" className="dsh-background-jobs-heading" aria-expanded={listExpanded}
            aria-controls={paneId} aria-disabled={listClipped || undefined} onClick={() => {
              if (!listClipped) setState(state => ({ ...state, expanded: !state.expanded }))
            }}>
            {label}
            <span className="dsh-background-jobs-arrow" aria-hidden="true">
              <IconTriangleRightFillRegular size={16} />
            </span>
          </button>
        </Tooltip>
      </h2>
    </header>
    <div id={paneId} className="dsh-background-jobs-pane"
      ref={pane => { if (pane !== null) pane.inert = !listExpanded }}>
      <div className="dsh-background-jobs-clip">
        {roster.phase === 'ready'
          ? roster.rows.length > 0 && <ul className="dsh-background-jobs-list" tabIndex={0} aria-labelledby={id}
            ref={list => { if (list !== null) list.inert = count === 0 }}>
            {roster.rows.map(entry => <JobRow key={entry.job.id} entry={entry} onMotionEnd={finishRowMotion} {...props} />)}
          </ul>
          : <p className="dsh-background-jobs-status" role="status">{props.t(roster.phase)}</p>}
      </div>
    </div>
  </section>
}
