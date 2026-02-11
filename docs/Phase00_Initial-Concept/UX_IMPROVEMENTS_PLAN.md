# UX Improvements Plan: Log Console & Progress Indicators

## Objective
Enhance system visibility by providing real-time feedback on background processes (indexing, trace building) through a live log console and granular progress indicators.

## 1. Backend Architecture (Event Streaming)

We will implement a Server-Sent Events (SSE) endpoint in the FastAPI daemon to broadcast real-time events to the frontend.

### 1.1. Event Bus
- **Endpoint**: `GET /events`
- **Transport**: Server-Sent Events (SSE)
- **Event Types**:
  - `log`: Console log records.
  - `progress`: Task progress updates.
  - `state`: Global state changes (optional, for immediate status reflection).

### 1.2. Log Capture
- Implement a custom `logging.Handler` (`BroadcastLogHandler`) attached to the root logger.
- Pushes formatted log records (timestamp, level, logger, message) to an `asyncio.Queue` (broadcast hub).
- Filters: Allow frontend to filter, but backend streams all `INFO`+ (or `DEBUG` if configured).

### 1.3. Progress Capture
- Create a `ProgressManager` singleton to track active tasks.
- **Callback Integration**:
  - Wiring `CodeIndex.build(progress_callback=...)` -> `ProgressManager.emit(...)`.
  - Wiring `TraceBuilder.build(progress_callback=...)` -> `ProgressManager.emit(...)`.
- **Event Payload**: `{ task_id: string, message: string, current: number, total: number, percent: number }`.

## 2. Frontend Architecture (Dashboard)

### 2.1. Event Connection
- **Hook**: `useEventStream()` in `@codrag/ui`.
- **State**:
  - `logStore`: Array of log entries (capped size, e.g., 1000 lines).
  - `progressStore`: Map of `task_id` -> progress state.

### 2.2. New Components (`@codrag/ui`)

#### `LogConsole`
- **Location**: Bottom of the first column (below File Tree / Knowledge Scope).
- **Features**:
  - Terminal-like appearance (dark background, monospace).
  - Auto-scroll to bottom.
  - Filters (Info, Warn, Error).
  - Clear button.
  - Expand/Collapse toggle.

#### `ProgressBar`
- **Location**: Integrated into `IndexStatusCard` and `TraceStatusCard`.
- **Placement**: Immediately below the card header/toolbar.
- **Visuals**:
  - Slim, animated progress bar.
  - Text label: "Scanning files... (45%)" or "Indexing... 120/500".
  - Consistent with AI Gateway progress visuals.

## 3. Implementation Plan

### Phase A: Backend Plumbing
1.  Add `BroadcastLogHandler` to `server.py`.
2.  Implement `ProgressManager` and wire into `_build_worker` and `trace_build`.
3.  Add `GET /events` endpoint using `StreamingResponse`.

### Phase B: UI Components
1.  Create `LogConsole` component in `packages/ui`.
2.  Create `ProgressIndicator` component in `packages/ui`.
3.  Update `IndexStatusCard` and `TraceStatusCard` to accept a `progress` prop.

### Phase C: Dashboard Integration
1.  Add `useEventStream` to `App.tsx`.
2.  Pass log stream to new `LogConsole` panel in layout.
3.  Pass progress state to status cards.

## 4. Updates to Master TODO
- Track backend and frontend tasks in Phase02 and Phase00 lists.
