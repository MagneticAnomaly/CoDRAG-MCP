# CoDRAG Master TODO (Cross-Phase Orchestrator)

## Purpose
This file orchestrates work across phases by:
- Defining cross-phase sprints (thematic bundles).
- Tracking shared implementation strategies/decisions that affect multiple phases.
- Linking to phase-level `TODO.md` files (where the detailed checklists live).

**Rule of thumb:**
- Phase `README.md` defines scope/spec.
- Phase `TODO.md` tracks execution (research + implementation + tests).
- This master file coordinates cross-phase sequencing and decision sync.

**Status key:**
- `[ ]` incomplete
- `[p]` in-progress — another AI is currently working on this task
- `[x]` complete

## Quick links (authoritative docs)
- `ROADMAP.md`
- `PHASES.md`
- `PHASE_DEPENDENCIES.md`
- `PHASE_RESEARCH_GATES.md`
- `RESEARCH_BACKLOG.md`
- `WORKFLOW_RESEARCH.md`
- `DECISIONS.md`
- `ARCHITECTURE.md`
- `API.md`

## Phase TODO index
- Phase00: `Phase00_Initial-Concept/TODO.md`
- Phase01: `Phase01_Foundation/TODO.md`
- Phase02: `Phase02_Dashboard/TODO.md`
- Phase03: `Phase03_AutoRebuild/TODO.md`
- Phase04: `Phase04_TraceIndex/TODO.md`
- Phase05: `Phase05_MCP_Integration/TODO.md`
- Phase06: `Phase06_Team_And_Enterprise/TODO.md`
- Phase07: `Phase07_Polish_Testing/TODO.md`
- Phase08: `Phase08_Tauri_MVP/TODO.md`
- Phase09: `Phase09_Post_MVP/TODO.md`
- Phase10: `Phase10_Business_And_Competitive_Research/TODO.md`
- Phase11: `Phase11_Deployment/TODO.md`
- Phase12: `Phase12_Marketing-Documentation-Website/TODO.md`
- Phase13: `Phase13_Storybook/TODO.md`
- Phase16: `Phase16_ContextIntelligence/README.md`

## Dependency anchors (planning)
- **Canonical dependency doc:** `PHASE_DEPENDENCIES.md`
- **MVP critical path (typical order):**
  - Phase01 → Phase02 → Phase03 → Phase04 (optional for MVP) → Phase05 → Phase07 → Phase08 → Phase11
- **Research-level dependencies (do not outrun these):**
  - Phase01 → Phase02 (UI depends on stable API shapes + persistence format)
  - Phase01 → Phase03 (auto-rebuild depends on stable IDs/hashes/manifest)
  - Phase01 → Phase05 (MCP depends on stable build/search/context)
  - Phase02 + Phase07 → Phase08 (packaging depends on stable UI and operational requirements)

---

## Cross-phase sprint plan
These sprints are intentionally cross-phase. Each sprint should end with:
- Updated phase TODO checkboxes.
- Updated strategy ledger (below) if decisions changed.
- A short “Sprint Notes” entry in this file (optional, at bottom).

### Sprint S-00: Research closure for MVP-critical phases (01–05)
**Goal:** unblock implementation by closing the highest-leverage research gaps.

- [x] S-00.1 Close Phase01 research blockers (manifest schema, stable IDs, recovery model) ✅
  - Manifest schema: defined with version, file_hashes, build stats, config
  - Stable IDs: `ids.py` with sha256-based chunk/file/node IDs
  - Recovery: atomic build swap + stale build cleanup
- [p] S-00.2 Close Phase02 research blockers (UI IA + API shapes + error states)
  - API shapes: done. UI IA: largely done (modular dashboard). Error states: done (ErrorState component + ApiException).
  - Remaining: formal error code taxonomy documentation
- [x] S-00.3 Close Phase03 research blockers (watch strategy, debounce/throttle defaults) ✅
  - Watcher: chokidar via subprocess, debounce 5s default, throttle, watcher state machine
- [x] S-00.4 Close Phase04 research blockers (node/edge schema, analyzer MVP) ✅
  - Schema: file/symbol/external_module nodes, contains/imports/calls edges
  - Analyzer: Rust engine with 8 language parsers
- [x] S-00.5 Close Phase05 research blockers (tool schemas, selection rules, budgets) ✅
  - 4 tools: codrag_status, codrag_build, codrag_search, codrag_context
  - Budgets: k/max_chars/min_score caps in server.py

### Sprint S-01: Core trust loop (engine + contracts) 
**Goal:** make “add → build → search → context” reliable and contract-stable.

- [x] S-01.1 Core persistence + atomic build contract (Phase01) 
- [x] S-01.2 Error envelope + error code taxonomy alignment (Phase01/02/05/07)
- [x] S-01.3 Output budgets policy (k/max_chars/min_score) alignment (Phase01/02/05)

### Sprint S-02: Trust console UX (dashboard) 
**Goal:** a dashboard that answers “right project / fresh index / verifiable sources”.

- [x] S-02.1 Project navigation + tab model (Phase02) `AppShell` + `Sidebar` + `ProjectList` + `AddProjectModal`
- [x] S-02.2 Build/status UX + error playbooks (Phase02/07) `IndexStatusCard` + `BuildCard` + `ErrorState` + build polling
- [x] S-02.3 Search + chunk viewer + context output UX (Phase02) `SearchPanel` + `SearchResultsList` + `ChunkPreview` + `ContextOutput` + `ContextOptionsPanel`

### Sprint S-03: Freshness loop (auto-rebuild)
**Goal:** predictable staleness detection and bounded incremental rebuild.

- [x] S-03.1 Watcher + debounce + throttling behaviors (Phase03)
- [x] S-03.2 Incremental rebuild (hash + stable IDs) (Phase01/03) ✅
  - Per-file hash map stored in `manifest.json` (`file_hashes: {path: hash}`)
  - Cold-start incremental: loads previous index from disk when manifest has hashes (no in-memory state needed)
  - Deleted file detection: `files_deleted` count in build stats, stale chunks excluded
  - Noop detection: `mode="noop"` when nothing changed (all files reused, 0 embedded, 0 deleted)
  - Tests: `tests/test_incremental_rebuild.py` (7 tests)
- [x] S-03.3 Freshness UI and "what changed?" surfaces (Phase02/03) `WatchControlPanel` + `WatchStatusIndicator` + watch panel in dashboard

### Sprint S-04: Trace foundations + bounded expansion
**Goal:** structural grounding that stays small, inspectable, and safe.

- [x] S-04.1 Trace schema + stable IDs + build integration (Phase04/01) ✅
  - Rust engine: `codrag-walker`, `codrag-parser`, `codrag-graph`, `codrag-engine` (41 tests)
  - Python: `TraceBuilder.build()` + `TraceIndex` load/search/neighbors/status
  - 8 language parsers: Python, TS, JS, Go, Rust, Java, C, C++
  - Server: `/projects/{id}/trace/*` endpoints (status, build, search, nodes, neighbors)
- [x] S-04.2 Trace API + dashboard symbol browser (Phase04/02) ✅
  - API endpoints: done (search, node, neighbors, build)
  - `TraceStatusCard` UI component: done
  - `TraceExplorer` symbol browser: done (search, detail pane, neighbor navigation)
  - API client: `searchTrace`, `getTraceNode`, `getTraceNeighbors`, `buildTrace`
  - Panel registered as 'trace' / 'Symbol Browser' in dashboard
- [x] S-04.3 Trace-aware context expansion budgets (Phase04/01/02/05) ✅
  - `get_context_with_trace_expansion()` in `index.py` — follows trace edges to include related code
  - Server: `trace_expand` + `trace_max_chars` params on `POST /projects/{id}/context`
  - MCP: `trace_expand` param on `codrag_context` tool
  - Graceful fallback: returns normal context if trace not available

### Sprint S-05: IDE workflows (MCP) ✅ **LARGELY COMPLETE**
**Goal:** stable MCP tools with conservative defaults and debuggable project selection.

- [x] S-05.1 MCP stdio server (HTTP proxy) + daemon health behavior (Phase05/01) ✅
- [x] S-05.2 Tool schemas aligned with `API.md` and dashboard expectations (Phase05/02) ✅
- [x] S-05.3 Token-efficient output modes (lean-by-default) (Phase05) ✅

**Implementation:** `src/codrag/mcp_server.py` + `codrag mcp` + `codrag mcp-config`

### Sprint S-06: Reliability baseline + evaluation harness
**Goal:** prevent regressions; make failures actionable; define perf envelope.

- [x] S-06.1 Test fixtures + unit/integration test baseline (Phase07/01–05)  `tests/test_trust_loop_integration.py` + `tests/conftest.py`
- [x] S-06.2 Recovery + corruption detection behaviors (Phase07/01)  `tests/test_index_recovery.py` (13 tests)
- [x] S-06.3 "Gold queries" and manual eval loop (Phase07/04/05)  `tests/eval/` (10 gold queries + runner)

### Sprint S-07: Desktop packaging + deployment readiness
**Goal:** Tauri app + sidecar lifecycle + signed distribution path.

- [ ] S-07.1 Tauri wrapper + sidecar startup/shutdown + port strategy (Phase08)
- [ ] S-07.2 OS distribution + signing/notarization plan (Phase11)
- [ ] S-07.3 Offline-friendly licensing + feature gating plan (Phase11/07)

### Sprint S-08: Public docs + design system alignment
**Goal:** credible public-facing docs, consistent UI primitives across app + site.

- [ ] S-08.1 Getting started + MCP onboarding docs scaffold (Phase12/05)
- [ ] S-08.2 Visual direction prototypes + token strategy + Storybook baseline (Phase13/02/12)

### Sprint S-09: Team/enterprise feedback loop (design constraints, post-MVP implementation)
**Goal:** keep enterprise constraints influencing earlier phases without shipping risky surfaces in MVP.

- [ ] S-09.1 Embedded mode + network-mode safety baselines (Phase06)
- [ ] S-09.2 Policy/config provenance UX implications (Phase06/02)

### Sprint S-10: Context Intelligence (Phase16)
**Goal:** native embeddings (no Ollama required), user-defined path weighting, CLaRa context compression.

- [x] S-10.1 Native `nomic-embed-text` embedder via ONNX Runtime (Phase16) ✅
  - `NativeEmbedder` class in `src/codrag/core/embedder.py`
  - New deps: `onnxruntime`, `tokenizers`, `huggingface-hub`
  - Auto-download model on first use to `~/.cache/huggingface/`
  - Default embedder; Ollama becomes optional power-user config
  - CLI: `codrag models` pre-downloads for air-gapped setups
  - Tests: `tests/test_native_embedder.py` (12 tests)
- [x] S-10.2 User-defined path weights for context weighting (Phase16) ✅
  - `path_weights: Dict[str, float]` in `repo_policy.json`
  - Applied at search time via `_resolve_path_weight()` (longest-prefix match)
  - API: `GET/PUT /projects/{id}/path_weights` + `PUT /projects/{id}` accepts `path_weights`
  - UI: weight editor (click ×1.0 badge) in FolderTree + FolderTreePanel + FileExplorerDetail
  - Hot-update: weights apply immediately to searches without rebuild
  - Tests: `tests/test_path_weights.py` (15 tests)
- [x] S-10.3 CLaRa context compression via `CLaRa-Remembers-It-All` subtree (Phase16) ✅
  - `ContextCompressor` ABC + `ClaraCompressor` + `NoopCompressor` in `src/codrag/core/compressor.py`
  - Sidecar HTTP client calling CLaRa server at configurable URL (default `:8765`)
  - API: `compression="clara"` param on `/projects/{id}/context` + `GET /clara/status`
  - MCP: `codrag_context` tool accepts compression params
  - Graceful fallback: returns uncompressed on timeout/error
  - Tests: `tests/test_compressor.py` (19 tests)
- [x] S-10.4 Update marketing copy to reflect embeddings as built-in core feature (Phase12/16) ✅
  - All hero variants updated: "built-in embeddings", "no Ollama", path weights, CLaRa compression
  - Public docs: guides for embeddings, path weights, and CLaRa in `websites/apps/docs/`

---

## Cross-phase implementation strategy ledger
This section tracks shared decisions/strategies that must remain consistent across phases.

### STR-01: API response envelope and error model
- **Status:** ✅ Implemented
- **Source of truth:** `docs/API.md` + `src/codrag/server.py` (`ApiException`, `ok()` helper)
- **Implementation:** `{ok: true, data: ...}` / `{ok: false, error: {code, message, hint}}` envelope.
  `ApiException` with status_code/code/message/hint. Parity across HTTP + MCP.
- **Remaining:** formal error code taxonomy documentation

### STR-02: Stable IDs (chunks, files, trace nodes)
- **Status:** ✅ Implemented
- **Implementation:** `src/codrag/core/ids.py` — sha256-based derivations:
  - `stable_file_hash(content)` → 16-char hex
  - `stable_markdown_chunk_id(path, section, idx)`, `stable_code_chunk_id(path, idx)`
  - `stable_file_node_id(path)`, `stable_symbol_node_id(qualname, path, line)`
  - `stable_edge_id(kind, source, target)`
- **Guarantees:** deterministic, content-addressed for files, position-stable for chunks/nodes

### STR-03: Manifest schema + format versioning
- **Status:** ✅ Implemented
- **Implementation:** `src/codrag/core/manifest.py` — `MANIFEST_VERSION = "1.0"`
  Fields: version, built_at, model, roots, count, embedding_dim, build (stats), config, file_hashes
- **Remaining:** formal `format_version` bump policy for breaking changes

### STR-04: Atomic build + last-known-good snapshot behavior
- **Status:** ✅ Implemented (atomic build); partial (snapshot)
- **Implementation:** `CodeIndex._swap_index_dir()` — temp dir → backup → rename → cleanup.
  `_cleanup_stale_builds()` removes orphaned temp dirs older than 1 hour.
- **Remaining:** P01-I8 — search/context from snapshot while build runs (currently blocks)

### STR-05: Output budgets and backpressure policy
- **Status:** ✅ Implemented
- **Implementation:** server-enforced caps in `server.py`:
  - search: k ≤ 100, min_score ≥ 0.0
  - context: max_chars ≤ 20,000, k ≤ 50
  - MCP: MAX_SEARCH_K=100, MAX_CONTEXT_K=50, MAX_CONTEXT_CHARS=20,000
  - trace: max_nodes ≤ 100, max_edges ≤ 200, hops ≤ 3

### STR-06: Watcher strategy (OS events vs polling fallback)
- **Status:** ✅ Implemented
- **Implementation:** chokidar via Node.js subprocess (`src/codrag/watcher.py`).
  Debounce 5s default, throttle, state machine (disabled/idle/debouncing/building/throttled).
  Falls back gracefully if Node.js unavailable.

### STR-07: Trace analyzer strategy
- **Status:** ✅ Implemented
- **Implementation:** Rust engine with tree-sitter parsers for 8 languages.
  Python fallback via AST module. PyO3 bridge (`codrag_engine`).
  `CODRAG_ENGINE=rust|python|auto` env var for selection.

### STR-08: Packaging strategy (Python sidecar)
- **Status:** Proposed
- **Impacts:** Phase08 feasibility/schedule, Phase11 distribution constraints
- **Next actions:** decide PyInstaller vs PyOxidizer for MVP and document rationale

### STR-09: Licensing + feature gating strategy
- **Status:** ✅ Decided
- **Implementation:** Lemon Squeezy as MoR. "Activation Exchange" flow:
  LS issues key → user enters in app → exchange via api.codrag.io → signed Ed25519 offline license.
  Documented in ADR-013 + `docs/Phase11_Deployment/LEMON_SQUEEZY_INTEGRATION.md`.
- **Remaining:** actual enforcement code in Tauri app (S-07)

---

## Sprint notes (append-only)
Add brief notes here after completing a sprint:
- date
- what changed (decisions, scope)
- new blockers

### 2026-02-01: API envelope + manifest/IDs scaffolding

**What was built:**
- HTTP daemon now supports the `docs/API.md` envelope and UI-facing routes:
  - `/projects/*` endpoints
  - `/llm/status` and `/llm/test`
- Shared helpers:
  - `src/codrag/api/envelope.py` (envelope + exception handlers)
  - `src/codrag/core/ids.py` (stable IDs + file hashes)
  - `src/codrag/core/manifest.py` (manifest read/write + builder)
- Minimal tests added for envelope + manifest/ID roundtrips.

**Known followups:**
- `src/codrag/api/responses.py` duplicates envelope helpers (see `docs/QA.md`).
- Phase03 incremental rebuild spec requires richer per-file manifest fields (see `docs/QA.md`).

### 2026-02-01: Sprint S-05 (MCP Integration) Complete

**What was built:**
- `src/codrag/mcp_server.py` — Full MCP server implementation (stdio transport)
  - Tools: `codrag_status`, `codrag_build`, `codrag_search`, `codrag_context`
  - JSON-RPC protocol handling per spec 2025-11-25
  - Token-efficient lean outputs
  - Proper error codes (DAEMON_UNAVAILABLE, etc.)
- `codrag mcp` CLI command — Runs MCP server with `--project` or `--auto` modes
- `codrag mcp-config` CLI command — Generates configs for 5 IDEs:
  - Claude Desktop, Cursor, VS Code, JetBrains, Windsurf
- `tests/test_mcp_server.py` — Comprehensive test suite
- `mcp-server.json` — MCP Registry metadata file
- `src/codrag/api/responses.py` — Standardized API response envelope
- Updated CLI: `status`, `search`, `context`, `build` now connect to daemon

**Research completed:**
- MCP spec 2025-11-25 analysis (transports, tools, Tasks, etc.)
- IDE compatibility matrix (15+ clients support stdio)
- Official SDK survey (Python SDK recommended)

**Decisions made:**
- HTTP proxy architecture (MCP server → daemon API)
- stdio transport first (universal IDE support)
- Tool naming: lowercase + underscores (per SEP-986)

**Remaining for Phase05:**
- [x] P05-I7 Ambiguity handling for multi-project
- [x] P05-I11 Debug mode file logging
- [ ] P05-R5 Streamable HTTP transport (for remote/enterprise)
- [ ] P05-R7 Async Tasks for long builds
- [ ] P05-I19 PyPI verification for MCP Registry

### 2026-02-02: Documentation alignment + CLI/MCP gaps identified

**What was done:**
- Aligned `docs/Phase12.../MCP-Shim-strategy-and-examples.md` with canonical domain (`codrag.io`), repo name (`codrag-mcp`), and attribution policy (optional/user-controlled).
- Updated `docs/Phase14_MCP-CLI/PUBLIC_GITHUB_STRATEGY.md` with current implementation status.

**Known gaps to resolve (CLI/daemon):**
- [ ] CLI commands (`add`, `list`, `status`, `build`, `search`, `context`) do not unwrap `ApiEnvelope` from server responses — they expect raw dicts but daemon returns `{"success": true, "data": {...}}`.
- [ ] CLI extras (`activity`, `coverage`, `overview`) call root-level endpoints (`/status`, `/activity`, `/coverage`, `/trace/stats`) that are not implemented on the daemon. Migrate to `/projects/{id}/*` or add compatibility aliases.

### 2026-02-03: Dashboard “Pinned Files” feature groundwork

**What was built:**
- UI package groundwork for 2 new dashboard panels:
  - `file-tree`
  - `pinned-files`
  - Added new panel category: `projects`
  - Registered panels in `packages/ui/src/config/panelRegistry.ts`
  - Added default layout entries (hidden by default) in `packages/ui/src/types/layout.ts`
- UI behavior fix: `FolderTree` now propagates `onNodeClick` through nested nodes.
- Backend capability: added canonical file-content endpoint:
  - `GET /projects/{project_id}/file?path=<repo-root-relative-path>`
  - Includes path traversal + repo-root containment protections and a `max_file_bytes` limit.

**Research / gotchas discovered:**
- Python `Path.match()` has surprising edge cases with patterns like `**/*.md` and `**/.git/**` at repo root.
- Implemented glob checks using `fnmatch` with a normalization rule for patterns starting with `**/` (also test without that prefix) to ensure root-level files match as expected.

**Remaining work (next):**
- Implement `usePinnedFiles` (localStorage + fetch content) and wire `FolderTreePanel` + `PinnedTextFilesPanel` into:
  - `src/codrag/dashboard/src/App.tsx`
  - Storybook `FullDashboard` demo
- Add missing scrollbar utilities + update UI package exports for new panels.
- [ ] MCP direct mode (`codrag mcp --mode direct`) needs verification/smoke test.

### 2026-02-03: Progress capture + next TODOs

 **Progress captured/verified:**
 - Websites monorepo scaffold exists under `websites/apps/*`:
   - `websites/apps/marketing`, `websites/apps/docs`, `websites/apps/support`, `websites/apps/payments`
   - Each is a Next.js app using `@codrag/ui` and the shared Tailwind preset.
 - Dev-only website UI controls implemented:
   - `DevToolbar` added (dev-only gated) to all 4 app layouts to switch `theme`, `dark`, and marketing `hero` variant via URL query params.
   - Marketing homepage wired to render a hero variant dynamically in dev (via `DevMarketingHero`).
 - Canonical daemon API uses `/projects/*` routes (legacy `/api/code-index/*` still exists in server but should be treated as compatibility only).

 **What’s left (prioritized):**

 #### Implementation
 - [ ] Websites: fix Next.js dev static asset 404s on ports 3000–3003 (`/_next/static/css/app/layout.css`, `/_next/static/chunks/main-app.js`, `app-pages-internals.js`)
   - Symptom: HTML can return `200`, but CSS/JS requests 404 causing unstyled/broken pages.
   - First attempt: stop all website dev servers, wipe `.next`, restart via `scripts/run_websites.sh --clean --dev`.
 - [x] Fix CLI HTTP client to unwrap `ApiEnvelope` everywhere (core commands and any remaining helpers). ✅ **DONE: `_unwrap_envelope` wired into all HTTP helpers**
 - [x] Resolve CLI endpoint drift: ✅ **DONE: all CLI commands use `/projects/{project_id}/*` routes**
 - [x] Project Primer MVP: ✅ **DONE**
   - config schema in `repo_policy.py` (filenames, score_boost, always_include, max_primer_chars)
   - score boost in `CodeIndex.search()` via `_primer_boosts()`
   - always-include option in `get_context_structured()` with deduplication
   - `FakeEmbedder` added for testing; 14 tests in `tests/test_primer.py`
 - [x] Atomic build + last-known-good snapshot (temp dir + swap) and recovery behavior on crash/interruption. ✅ **DONE**
   - Implemented in `CodeIndex.build()`: builds to `.index_build_<uuid>`, atomic swap via rename
   - Added `_cleanup_stale_builds()` to auto-recover on init
   - 4 tests in `tests/test_atomic_build.py`
 - [x] Implement staleness semantics (`status.stale`) for watcher/index ✅ **DONE**
   - `AutoRebuildWatcher.status()` now returns `stale` (bool) + `stale_since` (ISO timestamp)
   - Added project watcher endpoints: `/projects/{project_id}/watch/start|stop|status`
   - Project status endpoint exposes `stale` + `stale_since` at top level
   - 9 tests in `tests/test_watcher_staleness.py`
 - [x] MCP: add Streamable HTTP transport support (Phase05 P05-R5/P05-R7) ✅ **DONE**
   - Added `codrag mcp --transport http --port 8401`
   - Implemented SSE endpoint (`/sse`) and message endpoint (`/message`) using FastAPI/Uvicorn
 - [x] MCP direct mode smoke test ✅ **DONE: `tests/test_mcp_direct_smoke.py` (10 tests, uses FakeEmbedder)**

 ### 2026-02-04: Universal UI + Storybook-First Strategy

 **What changed:**
 - **Workflow Shift**: Switched from running 4x Next.js dev servers (fragile, slow) to Storybook-first development (fast, isolated).
 - **Universal UI**: All marketing/docs components (`MarketingHero`, `FeatureBlocks`, `IndexStats`, `TraceGraph`) are now canonical in `@codrag/ui`.
 - **Themes Ported**: All "Radical" visual directions (Neo-Brutalist, Retro, Glass, etc.) + required fonts are fully integrated into the shared package.

 ### 2026-02-05: Frontend-Backend Integration (S-02)

 **What was built:**
 - **Typed API Client** (`packages/ui/src/api/client.ts`): Extended `CodragApiClient` with 9 new methods:
   - Project CRUD: `createProject`, `getProject`, `updateProject`, `deleteProject`
   - Build: `buildProject` (with polling)
   - Roots: `getProjectRoots`
   - Watch: `startWatch`, `stopWatch`, `getWatchStatus`
   - Health: `getHealth`
 - **New API types** (`packages/ui/src/api/types.ts`): `CreateProjectRequest/Response`, `UpdateProjectRequest/Response`, `DeleteProjectResponse`, `BuildProjectResponse`, `WatchActionResponse`
 - **App.tsx full rewrite** (`src/codrag/dashboard/src/App.tsx`): 1009→573 lines, exclusively Storybook components:
   - `AppShell` + `Sidebar` + `ProjectList` for multi-project navigation
   - `AddProjectModal` for project creation via `POST /projects`
   - `LoadingState` / `ErrorState` pattern components
   - `Button` atomic primitive (newly exported from `@codrag/ui`)
   - `FolderTreePanel` wired to `/projects/{id}/roots`
   - All API calls via `useApiClient()` → canonical `/projects/{id}/*` routes
   - Removed: legacy `/api/code-index` routes, hand-rolled fetch, inline tree logic, raw HTML buttons
 - **main.tsx**: Wrapped with `ApiClientProvider` using `CodragApiClient`
 - **New exports from `@codrag/ui`**: `Button`, `AddProjectModal`, `AddProjectModalProps`

 **Additional work (same session):**
 - **Select primitive** (`packages/ui/src/components/primitives/Select.tsx`): New Storybook component with variants (default, ghost) and sizes
 - **Panel details**: Restored `panelDetails` prop with `AIModelsSettings` (LLM expanded view) and `FolderTree` (roots expanded view)
 - **LLM config handlers**: Full endpoint management (add/edit/delete/test), model fetching via `/api/llm/proxy/*`, model testing
 - **Pinned Files feature**: 
   - Added `getProjectFileContent` to API client (uses `GET /projects/{id}/file?path=...`)
   - Pinned files state with localStorage persistence
   - `FolderTreePanel` wired with `includedPaths`, `onToggleInclude`, `onNodeClick` for pin/unpin
   - `PinnedTextFilesPanel` in `panelContent` with `onUnpin`
   - Content fetched from backend on pin

 **Decisions:**
 - Dashboard uses `window.location.origin` as API base (works when served by daemon)
 - Build polling at 2s intervals until `status.building === false`
 - Project config loaded from `GET /projects/{id}` on project selection
 - Pinned file paths persisted in `localStorage` under key `codrag_pinned_files`

 ### 2026-02-05: HTTP API Integration Tests (S-06.1)

 **What was built:**
 - `tests/test_trust_loop_integration.py` — 18 tests covering the **core trust loop** HTTP API:
   - **Project Lifecycle**: add, get, list, delete, 404 handling
   - **Build Operations**: trigger build, wait for completion, status before build
   - **Search Operations**: search after build, search before build (409), min_score filtering
   - **Context Operations**: context assembly, max_chars limiting
   - **End-to-End**: full add → build → search → context flow
   - **Error Handling**: invalid project IDs across all endpoints

 **Test coverage now includes:**
 - `test_trust_loop_integration.py` (18 tests) — HTTP API integration
 - `test_mcp_direct_smoke.py` (10 tests) — MCP direct mode
 - `test_atomic_build.py` (4 tests) — Atomic build/recovery
 - `test_primer.py` (14 tests) — Primer feature
 - `test_watcher_staleness.py` (9 tests) — Watcher staleness
 - `test_trace_endpoints.py` — Trace API endpoints
 - `test_api_envelope.py` — Error envelope formatting

 #### Research / decisions
 - [x] STR-01: finalize error code taxonomy + `hint` rules across daemon/UI/MCP/CLI. ✅ **DONE: `docs/ERROR_CODES.md`**
 - [x] STR-03: manifest schema/versioning decision (per-file manifest fields vs format bump strategy). ✅ **DONE: `docs/MANIFEST_SCHEMA.md`**
 - [x] STR-04: atomic build + recovery contract (what gets swapped, how to detect partial builds). ✅ **DONE: `docs/ATOMIC_BUILD.md`**
 - [x] STR-05: budgets policy (server-enforced max caps) and alignment across UI + MCP + docs. ✅ **DONE: `docs/BUDGETS_POLICY.md`**
 - [x] Decide primer detection precedence (e.g. `AGENTS.md` vs `CODRAG_PRIMER.md`, root-only vs glob). ✅ **DONE: `docs/PRIMER_DETECTION.md`**

 #### Planning / coordination
 - [x] Sprint S-01: choose the next “trust loop hardening” bundle: ✅ **DONE**
   - CLI envelope + endpoint drift fixes
   - atomic build + recovery
   - minimal integration tests (add project → build → search → context) ✅ `tests/test_trust_loop_integration.py`
 - [x] Sprint S-08: publishable docs plan (Getting Started + MCP onboarding + Troubleshooting-first). ✅ **DONE**
   - `docs/GETTING_STARTED.md` — Installation and quick start
   - `docs/MCP_ONBOARDING.md` — AI assistant integration guide
   - `docs/TROUBLESHOOTING.md` — Common issues and solutions
