# Phase 69 — Stage 2: Query-time CLaRa Compression for `codrag`

## Goal
Add **query-time CLaRa** as an optional post-retrieval step for `/context` (and therefore `codrag`) so we can:

- Reduce prompt bloat (fit more useful evidence into the same `max_chars`/token budget)
- Keep indexing unchanged (no re-embedding / no rebuild coupling)
- Preserve citations/attribution using the existing `structured=true` mode

This stage intentionally does **not** change the vector index format or build pipeline.

## Current backend reality (important constraints)
CoDRAG currently uses:

- A per-project embedding index:
  - Vector store: `embeddings.npy` loaded into a NumPy matrix
  - Search: brute-force cosine similarity (`(emb @ qv) / (||emb||*||q||)`)
  - Optional boosts: keyword heuristics + SQLite FTS5 (`fts.sqlite3`) BM25-based boosts

There is no FAISS/Chroma/Annoy backend in this codepath today.

Implication:
- Query-time CLaRa can be implemented entirely inside context assembly (`get_context` / `get_context_structured`) without touching indexing.

## Proposed API surface (minimal, backwards-compatible)
Extend `POST /projects/{id}/context` with optional args.

### Request body additions
- `compression` (string, optional)
  - Allowed:
    - `"none"` (default)
    - `"clara"`
- `compression_target_chars` (int, optional)
  - If omitted, use `max_chars` as the target
- `compression_budget_tokens` (int, optional)
  - Optional alternative budget expression when the caller thinks in tokens
- `compression_level` (string, optional)
  - Allowed: `"light" | "standard" | "aggressive"`
- `compression_timeout_s` (float, optional)
  - Hard cap for the CLaRa step

### Response additions
For `structured=false`:
- Still return `{ "context": "..." }` (context may be compressed)

For `structured=true`:
- Add a `compression` object:
  - `enabled` (bool)
  - `mode` (string)
  - `input_chars` / `output_chars`
  - `input_estimated_tokens` / `output_estimated_tokens`
  - `timing_ms`
  - `error` (nullable string)

## Where compression should happen
### Recommended ordering
1. Retrieve `results = search(query, k, min_score)`
2. Assemble a *structured* intermediate representation:
   - `chunks_meta` and raw chunk texts (with headers)
3. Apply CLaRa over a representation that preserves provenance:
   - Either compress the full assembled context string
   - Or compress per-chunk and then repack (preferred if we want stable citations)

### Suggested strategy (start simple)
- **Stage 2A (fastest):** compress the final assembled string
  - Pros: minimal code changes
  - Cons: citations become fuzzier (still have headers embedded, but CLaRa may reorder/merge)

- **Stage 2B (better citations):** compress per chunk, keep chunk boundaries
  - Pros: structured citations remain meaningful
  - Cons: more implementation work

I recommend implementing **2A first** behind flags, then moving to **2B** once it proves useful.

## CLaRa integration options
We want query-time, so we need a callable function that takes text and returns compressed text.

### Option 1: CLaRa as an optional Python dependency (embedded)
- Add a small adapter module in the backend
- Pros:
  - Fully local
  - No network dependency
- Cons:
  - Dependency management + model/runtime requirements

### Option 2: CLaRa as a local sidecar HTTP service
- Backend calls `http://localhost:<port>/compress`
- Pros:
  - Decouples dependencies
  - Easy to swap implementations
- Cons:
  - Another service to run

Stage 2 should support both by defining a single internal interface:

- `compress(text, *, level, budget_chars, timeout_s) -> (compressed_text, stats)`

## MCP tool contract changes
Update tool schema to include the new optional args:

- `compression`
- `compression_target_chars`
- `compression_level`
- `compression_timeout_s`

Rules:
- Default remains `compression="none"`.
- MCP server should pass through args to HTTP unchanged.

## UI changes (optional but recommended)
In the dashboard:

- Add a **Compression** panel:
  - Toggle: Off / CLaRa
  - Level selector: light/standard/aggressive
  - Budget display: show `max_chars` and optional `target_chars`
  - “Preview compression” button that calls `/projects/{id}/context` with `structured=true`

If we don’t want to touch UI yet, Stage 2 can still be used via MCP + API.

## Performance + safety requirements
- Compression must be **best-effort**.
  - If CLaRa fails or times out, return uncompressed context and include `compression.error` in structured mode.
- Guardrails:
  - Never exceed `max_chars` after compression (hard truncate if needed)
  - Do not block builds or index loading

## Test plan
- Unit-ish tests (or manual validation) for:
  - `compression=none` returns identical output to current behavior
  - `compression=clara` returns <= target chars
  - `structured=true` includes compression metadata
  - Failure path: CLaRa unavailable -> fallback to uncompressed context

## TODO list (Stage 2)
### Stage 2A — minimal viable query-time compression
- [ ] Define compression adapter interface (embedded or sidecar)
- [ ] Implement `compression=clara` in `get_context` (final-string compression)
- [ ] Implement `compression=clara` in `get_context_structured` with `compression` metadata
- [ ] Extend Flask `/projects/{id}/context` endpoint to accept/pass new args
- [ ] Extend Python MCP server tool schema + request mapping
- [ ] Manual test via MCP (`compression="clara"`)

### Stage 2B — citation-friendly compression (recommended follow-up)
- [ ] Compress per chunk, preserve boundaries
- [ ] Add `chunks[i].compressed_content` (or equivalent) in structured output (if needed)
- [ ] Update packing logic to use compressed content for char budget

### Optional: UI wiring
- [ ] Add compression controls to the dashboard
- [ ] Display compression stats (input/output chars, timing)

## Non-goals (explicit)
- No build-time CLaRa storage in this stage
- No changes to embeddings / vector index format
- No incremental indexing / layered indices changes here
