import { ApiClientError } from './errors';
import type {
  ApiEnvelope,
  AssembleContextRequest,
  AssembleContextResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
  DeleteProjectResponse,
  BuildProjectResponse,
  ListProjectsResponse,
  SearchRequest,
  SearchResponse,
  WatchActionResponse,
} from './types';
import type { LLMStatus, Project, ProjectStatus, TraceStatus, WatchStatus } from '../types';

export interface ApiClient {
  // Configuration
  readonly baseUrl: string;

  // Health
  getHealth(): Promise<{ status: string; version: string }>;

  // Projects CRUD
  listProjects(): Promise<ListProjectsResponse>;
  createProject(request: CreateProjectRequest): Promise<CreateProjectResponse>;
  getProject(projectId: string): Promise<{ project: Project }>;
  updateProject(projectId: string, request: UpdateProjectRequest): Promise<UpdateProjectResponse>;
  deleteProject(projectId: string, purge?: boolean): Promise<DeleteProjectResponse>;

  // Project status & build
  getProjectStatus(projectId: string): Promise<ProjectStatus>;
  buildProject(projectId: string, full?: boolean): Promise<BuildProjectResponse>;

  // Search & context
  search(projectId: string, request: SearchRequest): Promise<SearchResponse>;
  assembleContext(projectId: string, request: AssembleContextRequest): Promise<AssembleContextResponse>;

  // Trace
  getTraceStatus(projectId: string): Promise<TraceStatus>;

  // Roots & Files
  getProjectRoots(projectId: string): Promise<{ roots: string[] }>;
  getProjectFileContent(projectId: string, path: string): Promise<{ content: string; path: string; size: number }>;

  // Watch
  startWatch(projectId: string): Promise<WatchActionResponse>;
  stopWatch(projectId: string): Promise<WatchActionResponse>;
  getWatchStatus(projectId: string): Promise<WatchStatus>;

  // LLM
  getLLMStatus(): Promise<LLMStatus>;
}

export interface ApiClientConfig {
  baseUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export class CodragApiClient implements ApiClient {
  public readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config?: ApiClientConfig) {
    this.baseUrl = config?.baseUrl ?? 'http://127.0.0.1:8400';
    this.apiKey = config?.apiKey;
    this.fetchImpl = config?.fetchImpl ?? fetch;
  }

  // ── Health ──────────────────────────────────────────────────

  async getHealth(): Promise<{ status: string; version: string }> {
    // /health returns raw JSON, not an envelope
    const res = await this.fetchImpl(new URL('/health', this.baseUrl).toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new ApiClientError(`Health check failed: HTTP ${res.status}`);
    return res.json();
  }

  // ── Projects CRUD ──────────────────────────────────────────

  async listProjects(): Promise<ListProjectsResponse> {
    return this.requestEnvelope<ListProjectsResponse>('/projects');
  }

  async createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    return this.requestEnvelope<CreateProjectResponse>('/projects', {
      method: 'POST',
      body: request,
    });
  }

  async getProject(projectId: string): Promise<{ project: Project }> {
    return this.requestEnvelope<{ project: Project }>(`/projects/${encodeURIComponent(projectId)}`);
  }

  async updateProject(projectId: string, request: UpdateProjectRequest): Promise<UpdateProjectResponse> {
    return this.requestEnvelope<UpdateProjectResponse>(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'PUT',
      body: request,
    });
  }

  async deleteProject(projectId: string, purge = false): Promise<DeleteProjectResponse> {
    return this.requestEnvelope<DeleteProjectResponse>(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
      query: { purge },
    });
  }

  // ── Status & Build ─────────────────────────────────────────

  async getProjectStatus(projectId: string): Promise<ProjectStatus> {
    return this.requestEnvelope<ProjectStatus>(`/projects/${encodeURIComponent(projectId)}/status`);
  }

  async buildProject(projectId: string, full = false): Promise<BuildProjectResponse> {
    return this.requestEnvelope<BuildProjectResponse>(`/projects/${encodeURIComponent(projectId)}/build`, {
      method: 'POST',
      query: { full },
    });
  }

  // ── Search & Context ───────────────────────────────────────

  async search(projectId: string, request: SearchRequest): Promise<SearchResponse> {
    return this.requestEnvelope<SearchResponse>(`/projects/${encodeURIComponent(projectId)}/search`, {
      method: 'POST',
      body: request,
    });
  }

  async assembleContext(projectId: string, request: AssembleContextRequest): Promise<AssembleContextResponse> {
    return this.requestEnvelope<AssembleContextResponse>(`/projects/${encodeURIComponent(projectId)}/context`, {
      method: 'POST',
      body: request,
    });
  }

  // ── Trace ──────────────────────────────────────────────────

  async getTraceStatus(projectId: string): Promise<TraceStatus> {
    return this.requestEnvelope<TraceStatus>(`/projects/${encodeURIComponent(projectId)}/trace/status`);
  }

  // ── Roots ──────────────────────────────────────────────────

  async getProjectRoots(projectId: string): Promise<{ roots: string[] }> {
    return this.requestEnvelope<{ roots: string[] }>(`/projects/${encodeURIComponent(projectId)}/roots`);
  }

  async getProjectFileContent(projectId: string, path: string): Promise<{ content: string; path: string; size: number }> {
    return this.requestEnvelope<{ content: string; path: string; size: number }>(
      `/projects/${encodeURIComponent(projectId)}/file?path=${encodeURIComponent(path)}`
    );
  }

  // ── Watch ──────────────────────────────────────────────────

  async startWatch(projectId: string): Promise<WatchActionResponse> {
    return this.requestEnvelope<WatchActionResponse>(`/projects/${encodeURIComponent(projectId)}/watch/start`, {
      method: 'POST',
    });
  }

  async stopWatch(projectId: string): Promise<WatchActionResponse> {
    return this.requestEnvelope<WatchActionResponse>(`/projects/${encodeURIComponent(projectId)}/watch/stop`, {
      method: 'POST',
    });
  }

  async getWatchStatus(projectId: string): Promise<WatchStatus> {
    return this.requestEnvelope<WatchStatus>(`/projects/${encodeURIComponent(projectId)}/watch/status`);
  }

  // ── LLM ────────────────────────────────────────────────────

  async getLLMStatus(): Promise<LLMStatus> {
    return this.requestEnvelope<LLMStatus>('/llm/status');
  }

  private async requestEnvelope<T>(
    path: string,
    opts?: { method?: string; query?: Record<string, string | number | boolean | undefined>; body?: unknown }
  ): Promise<T> {
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const relativePath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(relativePath, baseUrl);

    if (opts?.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (opts?.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    console.log(`[ApiClient] Requesting: ${url.toString()}`, {
      method: opts?.method ?? 'GET',
      headers,
      body: opts?.body
    });

    let res: Response;
    try {
      res = await this.fetchImpl(url.toString(), {
        method: opts?.method ?? 'GET',
        headers,
        body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch (err) {
      console.error('[ApiClient] Network Error Details:', {
        url: url.toString(),
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      throw new ApiClientError('Network error contacting CoDRAG daemon', { url: url.toString() });
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      console.error(`[ApiClient] Invalid JSON from ${url.toString()}:`, res.status);
      throw new ApiClientError('Invalid JSON response from CoDRAG daemon', {
        status: res.status,
        url: url.toString(),
      });
    }

    console.log(`[ApiClient] Response from ${url.toString()}:`, json);

    const envelope = json as ApiEnvelope<T>;
    if (typeof envelope !== 'object' || envelope === null || typeof envelope.success !== 'boolean') {
      throw new ApiClientError('Unexpected response shape from CoDRAG daemon', {
        status: res.status,
        url: url.toString(),
      });
    }

    if (!envelope.success) {
      const message = envelope.error?.message ?? 'Request failed';
      throw new ApiClientError(message, {
        status: res.status,
        code: envelope.error?.code,
        apiError: envelope.error ?? undefined,
        url: url.toString(),
      });
    }

    if (envelope.data === null || envelope.data === undefined) {
      throw new ApiClientError('Envelope success=true but data was null', {
        status: res.status,
        url: url.toString(),
      });
    }

    return envelope.data;
  }
}

export function createCodragApiClient(config?: ApiClientConfig): ApiClient {
  return new CodragApiClient(config);
}
