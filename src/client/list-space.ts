const LIMIT_PROPERTY = '--dsh-background-jobs-list-limit'
// Row geometry in styles.ts: 5px top padding, 18px label, 16px metadata, 5px bottom padding.
const ROW_HEIGHT = 44
const LABEL_BOTTOM = 23

/** Content extent of the native scrollports, excluding unused viewport space. */
function contentBlockSize(scroller: HTMLElement): number {
  const top = scroller.getBoundingClientRect().top - scroller.scrollTop
  return Array.from(scroller.children).reduce((height, child) => {
    const rect = child.getBoundingClientRect()
    return rect.height > 0 ? Math.max(height, rect.bottom - top) : height
  }, 0)
}

export function observeListSpace(section: HTMLElement): (() => void) | undefined {
  // In rc.5 the footer outlet is boxless, inside the actions row and foot.
  const outlet = section.closest('[data-slot="sidebar.footer.action"]')
  const foot = outlet?.parentElement?.parentElement
  const column = foot?.parentElement
  const scrollport = column?.querySelector<HTMLElement>('[data-sidebar-scrollport]')
  const header = section.querySelector<HTMLElement>('.dsh-background-jobs-header')
  if (!foot || !column || !scrollport || !header) return

  let frame: number | undefined
  let observed = new Set<Element>()
  const sizes = new ResizeObserver(schedule)
  const contents = new MutationObserver(schedule)
  contents.observe(scrollport, { childList: true, subtree: true })

  const measure = () => {
    frame = undefined
    const sessions = scrollport.querySelector<HTMLElement>('[data-sidebar-list-area]')
    const next = new Set<Element>([column, foot, section, scrollport, ...scrollport.children, ...(sessions?.children ?? [])])
    for (const element of observed) if (!next.has(element)) sizes.unobserve(element)
    for (const element of next) if (!observed.has(element)) sizes.observe(element)
    observed = next

    // Search and tall session lists are sized to the current viewport. Count
    // the rows themselves so unused space stays available to the jobs list.
    let navigation = contentBlockSize(scrollport)
    if (sessions) navigation += contentBlockSize(sessions) - sessions.getBoundingClientRect().height

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
    const clipped = limit < LABEL_BOTTOM
    if (clipped && section.querySelector('.dsh-background-jobs-list')?.contains(document.activeElement)) {
      header.querySelector('button')?.focus({ preventScroll: true })
    }
    section.style.setProperty(LIMIT_PROPERTY, `${clipped ? 0 : limit}px`)
    section.toggleAttribute('data-list-clipped', clipped)
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
    section.removeAttribute('data-list-clipped')
  }
}
