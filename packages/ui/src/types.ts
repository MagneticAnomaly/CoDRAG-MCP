/**
 * CoDRAG UI Type Definitions
 */

/**
 * Status states for index/build indicators
 * These are the core states that appear throughout the UI
 */
export type StatusState = 
  | 'fresh'      // Index is up-to-date
  | 'stale'      // Changes detected, rebuild needed
  | 'building'   // Build in progress
  | 'pending'    // Build queued
  | 'error'      // Build failed or error state
  | 'disabled';  // Feature disabled

/**
 * Search result from the CoDRAG API
 */
export interface SearchResult {
  chunk_id: string;
  source_path: string;
  span: {
    start_line: number;
    end_line: number;
  };
  preview: string;
  score: number;
  // Optional extras for different contexts
  section?: string;
  content?: string;
}

/**
 * Code chunk for display
 */
export interface CodeChunk {
  id: string;
  source_path: string;
  span: {
    start_line: number;
    end_line: number;
  };
  content: string;
  language?: string;
}

/**
 * Project summary for list display
 */
export interface ProjectSummary {
  id: string;
  name: string;
  path: string;
  mode: ProjectMode;
  status: StatusState;
  chunk_count?: number;
  last_build_at?: string;
}

// ============================================================
// Phase 03 - Auto-Rebuild Types
// ============================================================

/**
 * Watch state for file watcher
 */
export type WatchState = 'disabled' | 'idle' | 'debouncing' | 'building' | 'throttled';

/**
 * Build phase for progress reporting
 */
export type BuildPhase = 
  | 'scanning' 
  | 'chunking' 
  | 'embedding' 
  | 'writing' 
  | 'complete'
  | 'trace_scan'
  | 'trace_parse'
  | 'trace_write';

/**
 * Watch status from API
 */
export interface WatchStatus {
  enabled: boolean;
  state: WatchState;
  debounce_ms?: number;
  stale?: boolean;
  pending?: boolean;
  pending_paths_count?: number;
  next_rebuild_at?: string | null;
  last_event_at?: string | null;
  last_rebuild_at?: string | null;
}

/**
 * Build history entry
 */
export interface BuildHistoryEntry {
  id: string;
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  stats?: {
    files_scanned: number;
    chunks_created: number;
    chunks_embedded: number;
    duration_ms: number;
  };
  error?: string;
}

// ============================================================
// Phase 04 - Trace Index Types
// ============================================================

/**
 * Node kind in trace graph
 */
export type NodeKind = 'file' | 'symbol' | 'external_module';

/**
 * Edge kind in trace graph
 */
export type EdgeKind = 'contains' | 'imports' | 'calls' | 'implements' | 'documented_by';

/**
 * Trace node from API
 */
export interface TraceNode {
  id: string;
  kind: NodeKind;
  name: string;
  file_path: string;
  span: { start_line: number; end_line: number };
  language: string | null;
  metadata: {
    symbol_type?: string;
    qualname?: string;
    docstring?: string;
    decorators?: string[];
    is_async?: boolean;
    is_public?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Trace edge from API
 */
export interface TraceEdge {
  id: string;
  kind: EdgeKind;
  source: string;
  target: string;
  metadata: {
    confidence: number;
    import?: string;
    [key: string]: unknown;
  };
}

/**
 * Trace status from API
 */
export interface TraceStatus {
  enabled: boolean;
  exists: boolean;
  building: boolean;
  counts: { nodes: number; edges: number };
  last_build_at: string | null;
  last_error: string | null;
}

/**
 * File entry in trace coverage report
 */
export interface TraceCoverageFile {
  path: string;
  language: string | null;
  size: number;
  modified: string;
  created: string;
}

/**
 * Trace coverage summary
 */
export interface TraceCoverageSummary {
  total: number;
  traced: number;
  untraced: number;
  stale: number;
  ignored: number;
  coverage_pct: number;
  last_build_at: string | null;
}

/**
 * Full trace coverage report from API
 */
export interface TraceCoverage {
  traced: TraceCoverageFile[];
  untraced: TraceCoverageFile[];
  stale: TraceCoverageFile[];
  ignored: TraceCoverageFile[];
  summary: TraceCoverageSummary;
  building: boolean;
}

/**
 * Trace expand options for context assembly
 */
export interface TraceExpandOptions {
  enabled: boolean;
  hops: number;
  direction: 'in' | 'out' | 'both';
  edge_kinds: EdgeKind[];
  max_nodes: number;
  max_additional_chunks: number;
  max_additional_chars: number;
}

// ============================================================
// Phase 05 - MCP Types
// ============================================================

/**
 * MCP tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputs: MCPToolInput[];
  example?: string;
}

export interface MCPToolInput {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
}

// ============================================================
// Phase 06 - Team & Enterprise Types
// ============================================================

/**
 * Project mode
 */
export type ProjectMode = 'standalone' | 'embedded' | 'custom';

/**
 * Server mode for network access
 */
export type ServerMode = 'local' | 'remote';

/**
 * License tier
 */
export type LicenseTier = 'free' | 'pro' | 'team' | 'enterprise';

/**
 * Team config status
 */
export type TeamConfigStatus = 'none' | 'applied' | 'overridden' | 'conflict';

/**
 * LLM service status (basic)
 */
export interface LLMStatus {
  ollama: {
    url: string;
    connected: boolean;
    models: string[];
  };
  clara: {
    url: string;
    enabled: boolean;
    connected: boolean;
  };
}

// ============================================================
// LLM Configuration Types (AI Models Settings)
// ============================================================

/**
 * Provider types for LLM endpoints
 */
export type LLMProvider = 'ollama' | 'openai' | 'openai-compatible' | 'anthropic';

/**
 * Model source for embedding/CLaRa
 */
export type ModelSource = 'endpoint' | 'huggingface';

/**
 * Saved endpoint configuration
 */
export interface SavedEndpoint {
  id: string;
  name: string;
  provider: LLMProvider;
  url: string;
  api_key?: string;
}

/**
 * Embedding model configuration
 */
export interface EmbeddingConfig {
  source: ModelSource;
  // Endpoint mode
  endpoint_id?: string;
  model?: string;
  // HuggingFace mode
  hf_repo_id?: string;
  hf_downloaded?: boolean;
  hf_model_path?: string;
  hf_download_progress?: number;
}

/**
 * Generic LLM slot configuration (small/large models)
 */
export interface LLMSlotConfig {
  enabled: boolean;
  endpoint_id?: string;
  model?: string;
}

/**
 * CLaRa compression configuration
 */
export interface ClaraConfig {
  enabled: boolean;
  source: ModelSource;
  // HuggingFace mode
  hf_downloaded?: boolean;
  hf_model_path?: string;
  hf_download_progress?: number;
  // Remote mode
  remote_url?: string;
}

/**
 * Full LLM configuration
 */
export interface LLMConfig {
  embedding: EmbeddingConfig;
  small_model: LLMSlotConfig;
  large_model: LLMSlotConfig;
  clara: ClaraConfig;
  saved_endpoints: SavedEndpoint[];
}

/**
 * Model slot type for UI
 */
export type ModelSlotType = 'embedding' | 'small' | 'large' | 'clara';

/**
 * HuggingFace download status
 */
export interface HFDownloadStatus {
  model_type: ModelSlotType;
  status: 'idle' | 'downloading' | 'complete' | 'error';
  progress?: number;
  bytes_downloaded?: string;
  error?: string;
}

/**
 * Endpoint test result
 */
export interface EndpointTestResult {
  success: boolean;
  message: string;
  models?: string[];
}

/**
 * Server status (team/enterprise mode)
 */
export interface ServerStatus {
  mode: ServerMode;
  requires_auth: boolean;
  bind_address?: string;
}

/**
 * Team configuration
 */
export interface TeamConfig {
  include_globs: string[];
  exclude_globs: string[];
  trace_enabled: boolean;
  embedding_model: string;
}

/**
 * License information
 */
export interface LicenseInfo {
  tier: LicenseTier;
  valid: boolean;
  expires_at?: string;
  seats_used?: number;
  seats_total?: number;
  features: string[];
}

/**
 * Project configuration
 */
export interface ProjectConfig {
  include_globs: string[];
  exclude_globs: string[];
  max_file_bytes: number;
  trace: { enabled: boolean };
  auto_rebuild: { enabled: boolean; debounce_ms?: number };
}

/**
 * Full project details
 */
export interface Project {
  id: string;
  name: string;
  path: string;
  mode: ProjectMode;
  config: ProjectConfig;
  created_at: string;
  updated_at: string;
}

/**
 * Index status from API
 */
export interface IndexStatus {
  exists: boolean;
  total_chunks: number;
  embedding_dim?: number;
  embedding_model?: string;
  last_build_at: string | null;
  last_error: ApiError | null;
}

/**
 * Full project status from API
 */
export interface ProjectStatus {
  building: boolean;
  stale: boolean;
  index: IndexStatus;
  trace: TraceStatus;
  watch: WatchStatus;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  hint?: string;
  details?: Record<string, unknown>;
}
