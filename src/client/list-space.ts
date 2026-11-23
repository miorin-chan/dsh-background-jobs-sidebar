const LIMIT_PROPERTY = '--dsh-background-jobs-list-limit'
// Row geometry in styles.ts: 5px top padding, 18px label, 16px metadata, 5px bottom padding.
const ROW_HEIGHT = 44
const LABEL_BOTTOM = 23

type MeasureChild = (child: HTMLElement, style: CSSStyleDeclaration) => number | undefined

function* flowChildren(parent: HTMLElement, observed: Set<Element>): Generator<[HTMLElement, CSSStyleDeclaration]> {
  for (const child of parent.children) {
    if (!(child instanceof HTMLElement) || child.tagName === 'STYLE') continue
    const style = getComputedStyle(child)
    if (style.display === 'contents') {
      yield* flowChildren(child, observed)
    } else if (style.position !== 'absolute' && style.position !== 'fixed') {
      observed.add(child)
      if (style.display !== 'none') yield [child, style]
    }
  }
}

/** Measure the unscrolled flow, substituting content sizes for stretched or clipped children. */
function contentBlockSize(parent: HTMLElement, observed: Set<Element>, measureChild?: MeasureChild): number {
  const top = parent.getBoundingClientRect().top - parent.scrollTop
  let end = 0
  let offset = 0
  for (const [child, style] of flowChildren(parent, observed)) {
    const rect = child.getBoundingClientRect()
    const height = measureChild?.(child, style) ?? rect.height
    end = Math.max(end, rect.top - top + offset + height + (Number.parseFloat(style.marginBlockEnd) || 0))
    // Following panes start after the substituted content, with their original gaps.
    offset += height - rect.height
  }
  const style = getComputedStyle(parent)
  return end + Number.parseFloat(style.paddingBlockEnd) + Number.parseFloat(style.borderBlockEndWidth)
}

function navigationBlockSize(scrollport: HTMLElement, observed: Set<Element>): number {
  const outlet = scrollport.querySelector<HTMLElement>('[data-slot="sidebar.workspaces"]')
  const sessions = outlet?.querySelector<HTMLElement>('[data-sidebar-list-area]')
  const workspace = sessions?.parentElement
  const region = outlet?.parentElement
  if (!workspace || !region) return contentBlockSize(scrollport, observed)
  observed.add(workspace)

  const measurePane: MeasureChild = (child, style) => {
    if (child === sessions || style.overflowY === 'auto' || style.overflowY === 'scroll') {
      return contentBlockSize(child, observed)
    }
    if (style.display === 'flex' && style.flexDirection === 'column' && Number(style.flexGrow) > 0) {
      return contentBlockSize(child, observed, measurePane)
    }
  }

  // With a pane below sessions, the workspace grid track can fill the viewport
  // even when its contents fit in much less space. Measure inside that track.
  return contentBlockSize(scrollport, observed, child => child === region
    ? workspace.getBoundingClientRect().top - region.getBoundingClientRect().top
      + contentBlockSize(workspace, observed, measurePane)
    : undefined)
}

export function observeListSpace(section: HTMLElement, setClipped: (clipped: boolean) => void): (() => void) | undefined {
  // In rc.5 the footer outlet is boxless, inside the actions row and foot.
  const outlet = section.closest('[data-slot="sidebar.footer.action"]')
  const foot = outlet?.parentElement?.parentElement
  const column = foot?.parentElement
  const scrollport = column?.querySelector<HTMLElement>('[data-sidebar-scrollport]')
  const header = section.querySelector<HTMLElement>('.dsh-background-jobs-header')
  if (!foot || !column || !scrollport || !header) return

  let frame: number | undefined
  let clipped = false
  let observed = new Set<Element>()
  const sizes = new ResizeObserver(schedule)
  const contents = new MutationObserver(schedule)
  contents.observe(scrollport, { childList: true, subtree: true })

  const measure = () => {
    frame = undefined
    const next = new Set<Element>([column, foot, section, scrollport, header])
    const navigation = navigationBlockSize(scrollport, next)
    for (const element of observed) if (!next.has(element)) sizes.unobserve(element)
    for (const element of next) if (!observed.has(element)) sizes.observe(element)
    observed = next

    // Exclude the jobs section itself from the footer measurement so the limit
    // stays independent of the current list height and its transitions.
    const paddingEnd = Number.parseFloat(getComputedStyle(column).paddingBlockEnd)
    const bottom = column.getBoundingClientRect().top + column.clientTop + column.clientHeight - paddingEnd
    const otherFooter = foot.getBoundingClientRect().height - section.getBoundingClientRect().height
    const available = Math.max(0, bottom - scrollport.getBoundingClientRect().top
      - otherFooter - header.getBoundingClientRect().height)
    // Keep a scrollable row when sessions fill the column and space allows.
    const minimum = Math.min(ROW_HEIGHT, available / 2)
    const limit = Math.floor(Math.max(available - Math.max(0, navigation), minimum))
    const nextClipped = limit < LABEL_BOTTOM
    if (nextClipped !== clipped) {
      if (nextClipped && section.querySelector('.dsh-background-jobs-list')?.contains(document.activeElement)) {
        header.querySelector('button')?.focus({ preventScroll: true })
      }
      clipped = nextClipped
      setClipped(clipped)
    }
    section.style.setProperty(LIMIT_PROPERTY, `${clipped ? 0 : limit}px`)
  }

  function schedule() {
    if (frame === undefined) frame = requestAnimationFrame(measure)
  }

  measure()
  return () => {
    if (frame !== undefined) cancelAnimationFrame(frame)
    contents.disconnect()
    sizes.disconnect()
    section.style.removeProperty(LIMIT_PROPERTY)
  }
}
