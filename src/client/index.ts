import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { createElement } from 'react'
import { JobsSection } from './jobs-section.js'
import { LABELS, NS } from './locale.js'

export const inject = ['locale', 'slots', 'uiWorkspace']

const SLOT = 'sidebar.footer.action'

export function apply(ctx: Context): void {
  const openSession = ctx.uiWorkspace.openSession.bind(ctx.uiWorkspace)
  ctx.effect(() => ctx.locale.register(NS, LABELS))
  ctx.effect(() => ctx.slots.inject(SLOT, () => ctx.slots.register({
    name: SLOT, id: NS, order: 100, locale: NS,
  }, ({ wide, t, useSessions, useWorkspaces }) => wide
    ? createElement(JobsSection, { t, useSessions, useWorkspaces, openSession })
    : null)))
}
