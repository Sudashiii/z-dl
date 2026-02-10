# AGENTS.md

Workspace root: repository root of this project.

Project-specific agent instructions live in:
- `./z-ui/AGENTS.md`

When working in the `z-ui` project, follow that file as the authoritative guide.
Major workflow/technology changes should be captured there immediately so future turns keep the right context.
Current important note: DB migrations are handled in `z-ui` (Drizzle), not `z-mg`.
API route lookup is available at `GET /api/_routes` (JSON) and `GET /api/docs` (HTML) in `z-ui`.
Implementation plans for non-trivial `z-ui` work are mandatory in `./z-ui/docs/implementation-plans/`.

## KOReader plugin logging

- For `koreaderPlugins/sake.koplugin`, all logger output must use the prefix `[Sake]`.
- This applies to `logger.info`, `logger.warn`, `logger.error`, and any other logger levels.
- Do not add unprefixed plugin log messages.
