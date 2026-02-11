# Prevent Duplicate Library Uploads (Plan)

## Goal
Ensure the same library book cannot be inserted multiple times, regardless of whether it is added via:
- ZLibrary download/upload flow
- direct library PUT upload

## Current duplicate risks
1. `DownloadBookUseCase` always calls `bookRepository.create(...)` after upload.
2. `PutLibraryFileUseCase` always calls `bookRepository.create(...)` after upload.
3. DB currently has no unique constraints for dedupe keys (`zLibId`, `s3_storage_key`).
4. Concurrent requests can race and create duplicates even if app-level checks are added.

## Dedupe policy
Primary dedupe keys:
- ZLibrary books: `zLibId` (for active rows)
- Generic library uploads: `s3_storage_key` (for active rows)

Behavior on duplicate:
- Return success with existing row (idempotent behavior), do not create a new row.
- If matching row exists in trash, restore it and update metadata/content as needed instead of creating duplicate.

## Architecture changes

### 1) Database safety (required)
Add unique indexes in Drizzle schema + migration:
- Unique active `zLibId` (exclude null; exclude trashed rows)
- Unique active `s3_storage_key` (exclude trashed rows)

Because this is SQLite/libSQL, use partial unique indexes:
- `WHERE zLibId IS NOT NULL AND deleted_at IS NULL`
- `WHERE deleted_at IS NULL`

This guarantees no duplicates even under concurrent writes.

### 2) Repository API extensions
Add repository methods:
- `getByStorageKeyIncludingTrashed(storageKey)`
- `getByZLibIdIncludingTrashed(zLibId)`
- `createOrRestoreFromTrash(input)` (or explicit restore+update helpers)

Keep route/controllers thin; dedupe decisions remain in use-cases.

### 3) Use-case idempotency

#### DownloadBookUseCase
Flow:
1. Resolve existing by `zLibId` including trashed.
2. If active exists:
   - update metadata as needed
   - optionally overwrite storage object at existing key
   - return success (no new DB row)
3. If trashed exists:
   - restore row
   - refresh metadata/storage
   - return success
4. Else create row normally.

#### PutLibraryFileUseCase
Flow:
1. Resolve existing by `s3_storage_key` including trashed.
2. If active exists: overwrite object + return success.
3. If trashed exists: restore + overwrite object + return success.
4. Else create row normally.

### 4) Error mapping
If a unique constraint is still hit (race edge), catch DB unique violation and convert to idempotent success path by re-reading existing row.

## API response considerations
No breaking response shape changes are required.
Optional: include `created: boolean` for diagnostics.

## Files expected to change
- `src/lib/server/infrastructure/db/schema.ts`
- `drizzle/*` new migration
- `src/lib/server/application/ports/BookRepositoryPort.ts`
- `src/lib/server/infrastructure/repositories/BookRepository.ts`
- `src/lib/server/application/use-cases/DownloadBookUseCase.ts`
- `src/lib/server/application/use-cases/PutLibraryFileUseCase.ts`

## Validation plan
1. Upload same ZLibrary book twice -> one DB row only.
2. PUT same library file twice -> one DB row only.
3. Concurrent duplicate attempts -> still one DB row.
4. Duplicate when existing row is in trash -> restored, not duplicated.
5. `bun run check` passes.

## Rollout notes
- Apply migration before deploying code relying on unique indexes.
- Since duplicates may already exist, add a pre-migration cleanup step:
  - pick canonical row per dedupe key
  - move/remove extras safely.
