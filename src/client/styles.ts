export const STYLES = `
  /* The rc.5 footer is a flex row. Give the final, wide entry its own line. */
  div:has(> .dsh-background-jobs),
  div:has(> [data-slot="sidebar.footer.action"] > .dsh-background-jobs) { flex-wrap: wrap; }
  .dsh-background-jobs {
    flex: 0 0 100%;
    min-inline-size: 0;
  }
  /* Follow the workspace files header in dsh-preview-file-navigation 0.1.0,
     src/client/index.tsx (sectionCss), with the stronger secondary text token. */
  .dsh-background-jobs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    block-size: 36px;
    padding-inline: calc(var(--dsh-sidebar-row-padding, 12px) - 5px) var(--dsh-sidebar-row-padding, 12px);
    color: var(--dsw-alias-label-secondary);
  }
  .dsh-background-jobs-header h2 { min-inline-size: 0; margin: 0; font: inherit; }
  .dsh-background-jobs-heading {
    display: flex;
    align-items: center;
    gap: 3px;
    max-inline-size: 100%;
    block-size: 24px;
    margin: 0;
    padding: 0;
    padding-inline-start: 4px;
    border: 0;
    border-radius: var(--dsw-radius-sm);
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 20px;
    text-align: start;
  }
  button.dsh-background-jobs-heading { cursor: pointer; }
  .dsh-background-jobs-arrow {
    display: inline-grid;
    flex: 0 0 22px;
    place-items: center;
    color: var(--dsw-alias-label-caption);
  }
  /* Arrow timing from .arrow in @deepseek-ai/dsh-client-ui-workspace@0.2.2-rc.5,
     src/client/rows/Rows.module.css. */
  .dsh-background-jobs-arrow::before {
    content: '';
    inline-size: 6px;
    block-size: 8px;
    background: currentColor;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
    transition: transform 150ms var(--ds-ease-in-out, ease-in-out);
  }
  .dsh-background-jobs-heading:dir(rtl) .dsh-background-jobs-arrow::before { transform: rotate(180deg); }
  .dsh-background-jobs-heading[aria-expanded="true"] .dsh-background-jobs-arrow::before { transform: rotate(90deg); }
  @media (hover: hover) {
    button.dsh-background-jobs-heading:hover { color: var(--dsw-alias-label-primary); }
    button.dsh-background-jobs-heading:hover .dsh-background-jobs-arrow { color: inherit; }
  }
  .dsh-background-jobs-status,
  .dsh-background-jobs-count {
    color: var(--dsw-alias-label-secondary);
    font-size: 12px;
    margin: 0;
  }
  .dsh-background-jobs-status { padding: 0 12px 4px; }
  .dsh-background-jobs-count { flex: none; font-variant-numeric: tabular-nums; }
  /* Match the glide and fade timings of AnimatedRows in
     @deepseek-ai/dsh-client-ui-primitives@0.2.2-rc.5, src/AnimatedRows.tsx. */
  .dsh-background-jobs-pane,
  .dsh-background-jobs-entry {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 200ms ease-out, opacity 100ms ease-out;
  }
  .dsh-background-jobs-pane[inert],
  .dsh-background-jobs-entry[data-motion="exit"] {
    grid-template-rows: 0fr;
    opacity: 0;
  }
  @starting-style {
    .dsh-background-jobs-entry[data-motion="enter"] {
      grid-template-rows: 0fr;
      opacity: 0;
    }
  }
  .dsh-background-jobs-clip {
    min-block-size: 0;
    min-inline-size: 0;
    overflow: clip;
  }
  @media (prefers-reduced-motion: reduce) {
    .dsh-background-jobs-pane,
    .dsh-background-jobs-entry,
    .dsh-background-jobs-arrow::before { transition: none; }
  }
  .dsh-background-jobs-list {
    list-style: none;
    margin: 0;
    padding: 0 2px;
    max-block-size: min(13rem, 28dvh);
    overflow: auto;
  }
  .dsh-background-jobs-row {
    display: flex;
    align-items: start;
    gap: 8px;
    box-sizing: border-box;
    inline-size: 100%;
    padding: 5px 6px;
    border: 0;
    border-radius: var(--dsw-radius-sm);
    background: transparent;
    color: var(--dsw-alias-label-primary);
    font: inherit;
    text-align: start;
  }
  button.dsh-background-jobs-row { cursor: pointer; }
  button.dsh-background-jobs-row:hover { background: var(--dsw-alias-interactive-bg-hover); }
  .dsh-background-jobs :focus-visible {
    outline: 1px solid var(--dsw-alias-brand-primary);
    outline-offset: -1px;
  }
  .dsh-background-jobs-dot {
    flex: 0 0 6px;
    block-size: 6px;
    border-radius: 50%;
    margin: 6px 3px 0;
    background: var(--dsw-alias-state-business-primary);
  }
  .dsh-background-jobs-row[data-status="stopping"] .dsh-background-jobs-dot {
    background: var(--dsw-alias-state-warn-primary);
  }
  .dsh-background-jobs-details { flex: 1; min-inline-size: 0; }
  .dsh-background-jobs-title,
  .dsh-background-jobs-label,
  .dsh-background-jobs-owner {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dsh-background-jobs-label { font-size: 13px; line-height: 18px; }
  .dsh-background-jobs-meta {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    color: var(--dsw-alias-label-secondary);
    font-size: 11px;
    line-height: 16px;
  }
  .dsh-background-jobs-phase { flex: none; }
`
