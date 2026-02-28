# Z-UI Visual Redesign Implementation Plan (Step-by-Step, Stats Page Excluded)

## Summary
Implement the completed Figma Make redesign in `z-ui` as a phased visual refresh, preserving current backend/API behavior and key product flows, with minor UX tweaks allowed.
Source of truth for visuals: Figma Make project `utCrFYX60uzHS2o2YR37Cs`.
Explicit exclusion: no dedicated stats page implementation in this phase.

## Scope
- In scope: app shell, login, search, library, book detail modal, queue, trash/archived visuals, connect-ZLibrary modal visuals, shared components/tokens, desktop-first.
- Out of scope: dedicated stats/analytics route/page, backend/API schema changes, DB changes, KOReader plugin changes.
- Responsive scope: desktop first in each step, then one dedicated responsive polish step.

## Non-Negotiable Functional Parity (must keep)
- Keep both Z-Library auth modes (`password` and `remix token`) in connect flow.
- Keep library upload and library-file download actions.
- Keep device download tracking controls (remove one device, reset all status).
- Keep metadata refetch action.
- Keep full metadata edit set currently supported.
- Keep `library / archived / trash` view model and sort options.
- Keep search title-adjust modal before download/queue action.
- Keep queue polling and queue timestamps/retry visibility.
- Keep full progress-history detail behavior in book detail.
- Keep ratings and read/archive/exclude toggles with current semantics.

## Public APIs / Interfaces / Types
- No server API contract changes expected.
- No DB or migration changes expected.
- Client-facing TypeScript interfaces remain stable; only optional UI-local view-model types may be added.
- No route additions for stats page.

## Implementation Phases (one screen per step)
1. Plan file bootstrap.
2. App shell + global tokens.
3. Login screen.
4. Search screen.
5. Library main + detail modal.
6. Queue screen.
7. Trash + archived visual pass.
8. Connect Z-Library modal polish.
9. Responsive polish pass.

## Acceptance Criteria Per Step
- Visuals align with Figma Make for that step’s surface.
- Existing user flow for that surface remains functional (no regression in API calls/state transitions).
- `bun run check` passes with zero TypeScript errors.
- Manual smoke checks for that surface are completed before next step.
- No implementation of a dedicated stats page.

## Test Scenarios
- Login: valid/invalid creds, restore session, redirect behavior.
- Connect modal: password auth and remix token auth both work; disconnect behavior unchanged.
- Search: search request, title-adjust modal, download action, queue action.
- Library: switch library/archived/trash views, sort modes, open detail modal, edit/save metadata, refetch metadata, rating updates, read/archive/exclude toggles, progress history render, download file, upload file, remove device download, reset download status, move to trash, restore, delete permanent.
- Queue: auto-refresh updates, status transitions rendering, retry/remove actions, error states.
- Responsive: key breakpoints for login/search/library/queue/layout interactions.

## Risks
- Large single-file UI complexity in `library/+page.svelte` can introduce regressions during styling changes.
- Visual refactor may accidentally break interactive states due to mixed logic+markup coupling.
- Inconsistent token adoption across pages can cause drift if step boundaries are not enforced.

## Cutover / Rollback
- Cutover strategy: incremental merge per step (small PRs), no feature flag.
- Rollback strategy: revert the affected step commit/PR only; backend remains untouched.
- Stability gate: do not start next step until current step passes smoke + `bun run check`.

## Assumptions and Defaults Chosen
- Design source: Figma Make output is primary source.
- Scope style: visual refresh with minor UX tweaks allowed, but no flow rewrites.
- Stats scope: only dedicated stats page excluded; inline counters allowed where already present.
- Delivery unit: one screen per step.
- Responsive: desktop first, then dedicated responsive polish step.
