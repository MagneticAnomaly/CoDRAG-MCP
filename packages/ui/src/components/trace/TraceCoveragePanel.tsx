import { useState, useCallback } from 'react';
import {
  FileCode,
  Clock,
  AlertTriangle,
  EyeOff,
  Search,
  Play,
  RefreshCw,
  X,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../primitives/Button';
import type { TraceCoverageFile, TraceCoverageSummary } from '../../types';

export interface TraceCoveragePanelProps {
  /** Coverage summary stats */
  summary: TraceCoverageSummary | null;
  /** Untraced files (eligible but not yet traced) */
  untracedFiles: TraceCoverageFile[];
  /** Stale files (traced but content changed) */
  staleFiles: TraceCoverageFile[];
  /** Ignored files (excluded by trace ignore patterns) */
  ignoredFiles: TraceCoverageFile[];
  /** Whether trace is currently building */
  building: boolean;
  /** Whether coverage data is loading */
  loading: boolean;
  /** Trigger trace build for all untraced/stale files */
  onTraceAll: () => void;
  /** Trigger re-trace for stale files only */
  onRetraceStale: () => void;
  /** Add an ignore pattern */
  onAddIgnorePattern: (pattern: string) => void;
  /** Remove an ignore pattern (un-ignore a file) */
  onRemoveIgnorePattern: (pattern: string) => void;
  /** Refresh coverage data */
  onRefresh: () => void;
  className?: string;
}

const LANG_LABELS: Record<string, string> = {
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  go: 'Go',
  rust: 'Rust',
};

function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return date.toLocaleDateString();
}

function CoverageBar({ summary }: { summary: TraceCoverageSummary }) {
  const { traced, untraced, stale, total } = summary;
  if (total === 0) return null;

  const tracedPct = (traced / total) * 100;
  const stalePct = (stale / total) * 100;
  const untracedPct = (untraced / total) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{traced}/{total} files traced</span>
        <span className="font-mono font-semibold text-text">{summary.coverage_pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-raised overflow-hidden flex">
        {tracedPct > 0 && (
          <div
            className="bg-success transition-all duration-500"
            style={{ width: `${tracedPct}%` }}
            title={`${traced} traced`}
          />
        )}
        {stalePct > 0 && (
          <div
            className="bg-warning transition-all duration-500"
            style={{ width: `${stalePct}%` }}
            title={`${stale} stale`}
          />
        )}
        {untracedPct > 0 && (
          <div
            className="bg-text-subtle/20 transition-all duration-500"
            style={{ width: `${untracedPct}%` }}
            title={`${untraced} untraced`}
          />
        )}
      </div>
      <div className="flex gap-3 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success" /> {traced} traced
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-warning" /> {stale} stale
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-text-subtle/30" /> {untraced} untraced
        </span>
      </div>
    </div>
  );
}

function FileRow({
  file,
  timeField,
  actionLabel,
  onAction,
}: {
  file: TraceCoverageFile;
  timeField: 'modified' | 'created';
  actionLabel?: string;
  onAction?: (path: string) => void;
}) {
  const langLabel = file.language ? (LANG_LABELS[file.language] || file.language) : null;
  const timeValue = timeField === 'modified' ? file.modified : file.created;

  return (
    <div className="group flex items-center gap-2 px-3 py-1.5 hover:bg-surface-raised rounded-md transition-colors">
      <FileCode className="w-3.5 h-3.5 text-text-subtle shrink-0" />
      <span className="text-xs font-mono text-text truncate flex-1" title={file.path}>
        {file.path}
      </span>
      <span className="text-[10px] text-text-muted shrink-0 hidden sm:inline">
        {formatTimeAgo(timeValue)}
      </span>
      {langLabel && (
        <span className="text-[10px] text-text-subtle bg-surface-raised px-1.5 py-0.5 rounded shrink-0 hidden md:inline">
          {langLabel}
        </span>
      )}
      {actionLabel && onAction && (
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] h-5 px-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onAction(file.path)}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  icon: Icon,
  iconColor,
  action,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  icon: typeof AlertTriangle;
  iconColor: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div>
      <button
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface-raised rounded-md transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-subtle shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-subtle shrink-0" />
        )}
        <Icon className={cn('w-3.5 h-3.5 shrink-0', iconColor)} />
        <span className="text-xs font-semibold text-text">{title}</span>
        <span className="text-[10px] text-text-muted font-mono">({count})</span>
        {action && <span className="ml-auto">{action}</span>}
      </button>
      {open && <div className="ml-2">{children}</div>}
    </div>
  );
}

export function TraceCoveragePanel({
  summary,
  untracedFiles,
  staleFiles,
  ignoredFiles,
  building,
  loading,
  onTraceAll,
  onRetraceStale,
  onAddIgnorePattern,
  onRemoveIgnorePattern,
  onRefresh,
  className,
}: TraceCoveragePanelProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'ignored'>('queue');
  const [ignoreInput, setIgnoreInput] = useState('');

  const handleAddIgnore = useCallback(() => {
    const pattern = ignoreInput.trim();
    if (pattern) {
      onAddIgnorePattern(pattern);
      setIgnoreInput('');
    }
  }, [ignoreInput, onAddIgnorePattern]);

  const handleIgnoreKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAddIgnore();
      if (e.key === 'Escape') setIgnoreInput('');
    },
    [handleAddIgnore]
  );

  const queueCount = untracedFiles.length + staleFiles.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Trace Coverage
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-6 w-6"
            title="Refresh coverage"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
        </div>

        {loading && !summary ? (
          <div className="flex items-center gap-2 text-xs text-text-muted py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading coverage data...
          </div>
        ) : summary ? (
          <CoverageBar summary={summary} />
        ) : null}

        {building && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-1.5 rounded-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Trace build in progress...
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={cn(
            'flex-1 text-xs font-medium py-2 px-3 transition-colors border-b-2',
            activeTab === 'queue'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          )}
          onClick={() => setActiveTab('queue')}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Queue
            {queueCount > 0 && (
              <span className="text-[10px] bg-warning/15 text-warning px-1.5 py-0.5 rounded-full font-mono">
                {queueCount}
              </span>
            )}
          </span>
        </button>
        <button
          className={cn(
            'flex-1 text-xs font-medium py-2 px-3 transition-colors border-b-2',
            activeTab === 'ignored'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          )}
          onClick={() => setActiveTab('ignored')}
        >
          <span className="flex items-center justify-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5" />
            Ignored
            {ignoredFiles.length > 0 && (
              <span className="text-[10px] bg-text-subtle/15 text-text-subtle px-1.5 py-0.5 rounded-full font-mono">
                {ignoredFiles.length}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {activeTab === 'queue' && (
          <div className="p-2 space-y-1">
            {queueCount === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                <FileCode className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium">All files traced</p>
                <p className="text-[10px] mt-1">No pending or stale files</p>
              </div>
            ) : (
              <>
                <CollapsibleSection
                  title="Untraced"
                  count={untracedFiles.length}
                  icon={Clock}
                  iconColor="text-text-subtle"
                  defaultOpen={true}
                  action={
                    untracedFiles.length > 0 && !building ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-5 px-2 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTraceAll();
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Trace All
                      </Button>
                    ) : undefined
                  }
                >
                  {untracedFiles.map((f) => (
                    <FileRow key={f.path} file={f} timeField="created" />
                  ))}
                </CollapsibleSection>

                <CollapsibleSection
                  title="Stale"
                  count={staleFiles.length}
                  icon={AlertTriangle}
                  iconColor="text-warning"
                  defaultOpen={true}
                  action={
                    staleFiles.length > 0 && !building ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-5 px-2 text-warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetraceStale();
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Re-trace
                      </Button>
                    ) : undefined
                  }
                >
                  {staleFiles.map((f) => (
                    <FileRow key={f.path} file={f} timeField="modified" />
                  ))}
                </CollapsibleSection>
              </>
            )}
          </div>
        )}

        {activeTab === 'ignored' && (
          <div className="p-2 space-y-2">
            {/* Add ignore pattern input */}
            <div className="flex items-center gap-1.5 px-2">
              <div className="flex-1 flex items-center gap-1.5 bg-surface border border-border rounded-md px-2 py-1">
                <Search className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                <input
                  type="text"
                  value={ignoreInput}
                  onChange={(e) => setIgnoreInput(e.target.value)}
                  onKeyDown={handleIgnoreKeyDown}
                  placeholder="Add ignore pattern (e.g. **/tests/**)"
                  className="flex-1 text-xs bg-transparent outline-none text-text placeholder:text-text-subtle"
                />
                {ignoreInput && (
                  <button
                    onClick={() => setIgnoreInput('')}
                    className="text-text-subtle hover:text-text"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 shrink-0"
                onClick={handleAddIgnore}
                disabled={!ignoreInput.trim()}
                title="Add pattern"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {ignoredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                <EyeOff className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium">No ignored files</p>
                <p className="text-[10px] mt-1">Add patterns above to exclude files from trace</p>
              </div>
            ) : (
              <div>
                {ignoredFiles.map((f) => (
                  <FileRow
                    key={f.path}
                    file={f}
                    timeField="modified"
                    actionLabel="Un-ignore"
                    onAction={(path) => onRemoveIgnorePattern(path)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with last build time */}
      {summary?.last_build_at && (
        <div className="px-4 py-2 border-t border-border text-[10px] text-text-muted">
          Last traced: {formatTimeAgo(summary.last_build_at)}
        </div>
      )}
    </div>
  );
}
