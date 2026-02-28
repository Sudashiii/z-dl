# Progress History Detail View Plan

## Goal

Add a progress detail view that shows timestamped progress snapshots for a book, and when page count is known, show page ranges (for example: page 20 -> 40).

## Scope

1. Persist progress history snapshots when progress is updated.
2. Expose progress history through a dedicated API endpoint.
3. Show progress history in the library detail modal with computed page ranges.
4. Keep controller logic thin and use existing use-case + result pattern conventions.

## Design

### Data model

- Add a new table: `BookProgressHistory`
  - `id` (PK)
  - `book_id` (FK -> `Books.id`, cascade delete)
  - `progress_percent` (real, normalized 0..1)
  - `recorded_at` (text timestamp)
- Add index on (`book_id`, `recorded_at`) for efficient reads.

### Application layer

- Introduce a dedicated `BookProgressHistoryRepositoryPort` and implementation.
- Update `PutProgressUseCase`:
  - after successful progress write, append a snapshot if percent is valid.
  - store normalized percent (0..1), timestamp generated server-side.
- New use-case: `GetBookProgressHistoryUseCase`
  - input: `bookId`
  - returns ordered snapshots (newest first).

### API layer

- Add endpoint: `GET /api/library/:id/progress-history`
  - parse id
  - call `GetBookProgressHistoryUseCase`
  - return `{ success: true, bookId, history: [...] }`
  - error format stays `{"error":"msg"}`.

### UI

- Add client route + `ZUI` facade method for progress history.
- In library book detail modal:
  - add `View Progress History` action.
  - render list of entries with timestamp, percent, and optional page range.
  - page range per transition:
    - previous snapshot percent -> current snapshot percent
    - convert percent to page using total pages.

## Risks

- Existing progress updates might be frequent; table growth is expected. We can add retention later if needed.
- If progress is unchanged repeatedly, noise may appear. Initial implementation records all valid updates; dedupe can be added later.

## Done criteria

- Migration applies cleanly.
- Progress uploads create history entries.
- `GET /api/library/:id/progress-history` returns data.
- Detail modal shows timestamps + percent and page ranges when `pages` exists.
- `bun run check` passes.
