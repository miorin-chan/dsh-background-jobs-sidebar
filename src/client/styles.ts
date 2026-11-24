export const STYLES = `
  /* The rc.5 footer is a flex row. Give the final, wide entry its own line. */
  div:has(> .dsh-background-jobs),
  div:has(> [data-slot="sidebar.footer.action"] > .dsh-background-jobs) { flex-wrap: wrap; }
  .dsh-background-jobs {
    flex: 0 0 100%;
    min-inline-size: 0;
  }
  /* The header reads as a sidebar section header, like the Files header of
     dsh-preview-file-navigation 0.1.0, src/client/index.tsx (sectionCss): the label follows
     .sectionHeader and .sectionLabel in src/client/rows/WorkspaceBrowser.module.css, and the
     arrow follows .arrow and .chevron in src/client/rows/Rows.module.css, both from
     @deepseek-ai/dsh-client-ui-workspace 0.2.2-rc.5. Label, count and arrow form one
     disclosure target, so hover only brightens their color, as .row does in
     src/DisclosureRow.module.css of @deepseek-ai/dsh-client-ui-primitives 0.2.2-rc.5. */
  .dsh-background-jobs-header {
    display: flex;
    align-items: center;
    block-size: 36px;
    min-inline-size: 0;
  }
  .dsh-background-jobs-header h2 {
    display: flex;
    min-inline-size: 0;
    max-inline-size: calc(100% - var(--dsh-sidebar-row-padding, 12px) + 5px);
    margin: 0;
    margin-inline-start: calc(var(--dsh-sidebar-row-padding, 12px) - 5px);
    font: inherit;
  }
  .dsh-background-jobs-heading {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    min-inline-size: 0;
    max-inline-size: 100%;
    block-size: 24px;
    margin: 0;
    padding: 0;
    padding-inline-start: 4px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--dsw-alias-label-tertiary);
    font: inherit;
    text-align: start;
    transition: color 100ms ease;
  }
  button.dsh-background-jobs-heading { cursor: pointer; }
  /* Baseline-align the count with the label, as .fileHeader does in
     src/SearchBlock.module.css of @deepseek-ai/dsh-client-ui-primitives 0.2.2-rc.5. */
  .dsh-background-jobs-label-group {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    min-inline-size: 0;
    line-height: 20px;
  }
  .dsh-background-jobs-title {
    flex: 0 1 auto;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dsh-background-jobs-count {
    flex: none;
    font-variant-numeric: tabular-nums;
  }
  .dsh-background-jobs-count:empty { display: none; }
  .dsh-background-jobs-arrow {
    display: inline-grid;
    flex: none;
    place-items: center;
    inline-size: 22px;
    block-size: 24px;
    color: var(--dsw-alias-label-caption);
    transition: color 100ms ease;
  }
  .dsh-background-jobs-arrow > svg { transition: transform 150ms var(--ds-ease-in-out, ease-in-out); }
  .dsh-background-jobs-heading:dir(rtl) .dsh-background-jobs-arrow > svg { transform: rotate(180deg); }
  .dsh-background-jobs-heading[aria-expanded="true"] .dsh-background-jobs-arrow > svg { transform: rotate(90deg); }
  @media (hover: hover) {
    button.dsh-background-jobs-heading:not([aria-disabled="true"]):hover,
    button.dsh-background-jobs-heading:not([aria-disabled="true"]):hover .dsh-background-jobs-arrow {
      color: var(--dsw-alias-label-secondary);
    }
  }
  .dsh-background-jobs .dsh-background-jobs-heading:focus-visible {
    outline: var(--dsw-focus-ring-width, 1px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
    outline-offset: -2px;
  }
  .dsh-background-jobs-status {
    margin: 0;
    padding: 0 12px 4px;
    color: var(--dsw-alias-label-secondary);
    font-size: 12px;
  }
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
    .dsh-background-jobs-heading,
    .dsh-background-jobs-arrow,
    .dsh-background-jobs-arrow > svg { transition: none; }
  }
  .dsh-background-jobs-list {
    list-style: none;
    margin: 0;
    padding: 0 2px;
    max-block-size: var(--dsh-background-jobs-list-limit, min(13rem, 28dvh));
    overflow: auto;
  }
  .dsh-background-jobs[data-list-clipped] .dsh-background-jobs-list { visibility: hidden; }
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
