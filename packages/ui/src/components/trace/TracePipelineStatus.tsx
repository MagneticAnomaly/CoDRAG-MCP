import { cn } from '../../lib/utils';
import { Button } from '../primitives/Button';
import {
  GitBranch, Brain, ShieldCheck, Play, AlertTriangle, CheckCircle2,
  Circle, ArrowRight, Clock, Loader2,
} from 'lucide-react';
import type { AugmentationStatus, DeepAnalysisRunStatus } from '../../types';

// ── Types ────────────────────────────────────────────────────

export interface TraceStageInfo {
  enabled: boolean;
  exists: boolean;
  building: boolean;
  counts: { nodes: number; edges: number };
  last_build_at: string | null;
}

export interface TracePipelineStatusProps {
  trace: TraceStageInfo;
  augmentation?: AugmentationStatus;
  deepAnalysis?: DeepAnalysisRunStatus;
  smallModelConfigured?: boolean;
  largeModelConfigured?: boolean;
  onBuildTrace?: () => void;
  onRunAugmentation?: () => void;
  onRunDeepAnalysis?: () => void;
  augmenting?: boolean;
  deepAnalyzing?: boolean;
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────

type StageState = 'disabled' | 'not_built' | 'building' | 'stale' | 'ready' | 'warning';

function formatTimeAgo(iso?: string | null): string {
  if (!iso) return 'never';
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    const diffW = Math.floor(diffD / 7);
    if (diffW < 5) return `${diffW}w ago`;
    return date.toLocaleDateString();
  } catch {
    return iso ?? 'never';
  }
}

function computeTraceState(trace: TraceStageInfo): StageState {
  if (!trace.enabled) return 'disabled';
  if (trace.building) return 'building';
  if (!trace.exists) return 'not_built';
  return 'ready';
}

function computeAugmentState(
  trace: TraceStageInfo,
  aug?: AugmentationStatus,
): StageState {
  if (!trace.enabled || !trace.exists) return 'disabled';
  if (!aug || !aug.enabled) return 'not_built';
  if (aug.augmented_nodes === 0) return 'not_built';
  if (aug.low_confidence_count > aug.augmented_nodes * 0.3) return 'warning';
  if (aug.augmented_nodes < aug.total_nodes * 0.5) return 'stale';
  return 'ready';
}

function computeDeepState(
  trace: TraceStageInfo,
  aug?: AugmentationStatus,
  deep?: DeepAnalysisRunStatus,
): StageState {
  if (!trace.enabled || !trace.exists) return 'disabled';
  if (!aug || !aug.enabled || aug.augmented_nodes === 0) return 'disabled';
  if (deep?.running) return 'building';
  if (!deep?.last_run_at) return 'not_built';
  // Stale if >2 weeks since last run and queue > 0
  if (deep.last_run_at) {
    const diffMs = Date.now() - new Date(deep.last_run_at).getTime();
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    if (diffMs > twoWeeks && (deep.queue_size ?? 0) > 0) return 'stale';
  }
  if ((deep.queue_size ?? 0) > 0 && (deep.avg_confidence ?? 1) < 0.6) return 'warning';
  return 'ready';
}

interface Recommendation {
  level: 'info' | 'warning' | 'action';
  message: string;
  action?: string;
  onAction?: () => void;
}

function computeRecommendations(
  trace: TraceStageInfo,
  aug?: AugmentationStatus,
  deep?: DeepAnalysisRunStatus,
  smallModel?: boolean,
  largeModel?: boolean,
  onRunAug?: () => void,
  onRunDeep?: () => void,
  onBuildTrace?: () => void,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // No trace
  if (!trace.enabled) {
    recs.push({ level: 'info', message: 'Enable trace in project settings to unlock the code graph.' });
    return recs;
  }
  if (!trace.exists) {
    recs.push({
      level: 'action',
      message: 'Build the trace index to create the structural code graph.',
      action: onBuildTrace ? 'Build Trace' : undefined,
      onAction: onBuildTrace,
    });
    return recs;
  }

  // Trace ready but no augmentation
  if (!aug || !aug.enabled || aug.augmented_nodes === 0) {
    if (!smallModel) {
      recs.push({ level: 'warning', message: 'Configure a Small Model in AI settings to enable augmentation.' });
    } else {
      recs.push({
        level: 'action',
        message: `${trace.counts.nodes} nodes ready for augmentation. Run augmentation to add LLM summaries.`,
        action: 'Run Augmentation',
        onAction: onRunAug,
      });
    }
    return recs;
  }

  // Augmentation exists — check coverage
  const augPct = aug.total_nodes > 0 ? Math.round((aug.augmented_nodes / aug.total_nodes) * 100) : 0;
  if (augPct < 50) {
    recs.push({
      level: 'warning',
      message: `Only ${augPct}% of nodes augmented. Run augmentation to improve coverage.`,
      action: 'Run Augmentation',
      onAction: onRunAug,
    });
  }

  // Low confidence warning
  if (aug.low_confidence_count > 0) {
    const lowPct = aug.total_nodes > 0 ? Math.round((aug.low_confidence_count / aug.total_nodes) * 100) : 0;
    if (lowPct > 10) {
      if (!largeModel) {
        recs.push({
          level: 'warning',
          message: `${aug.low_confidence_count} nodes (${lowPct}%) have low confidence. Configure a Large Model to run deep analysis.`,
        });
      } else {
        recs.push({
          level: 'action',
          message: `${aug.low_confidence_count} nodes (${lowPct}%) have low confidence. Deep analysis can validate and correct them.`,
          action: 'Run Deep Analysis',
          onAction: onRunDeep,
        });
      }
    }
  }

  // Deep analysis staleness
  if (deep?.last_run_at) {
    const diffMs = Date.now() - new Date(deep.last_run_at).getTime();
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    if (diffMs > twoWeeks && (deep.queue_size ?? 0) > 10) {
      recs.push({
        level: 'info',
        message: `Last deep analysis was ${formatTimeAgo(deep.last_run_at)}. ${deep.queue_size} items in validation queue.`,
        action: largeModel ? 'Run Deep Analysis' : undefined,
        onAction: largeModel ? onRunDeep : undefined,
      });
    }
  } else if (aug.augmented_nodes > 0 && largeModel) {
    recs.push({
      level: 'info',
      message: 'Deep analysis has never been run. It validates augmentations using ground-truth evidence.',
      action: 'Run Deep Analysis',
      onAction: onRunDeep,
    });
  }

  return recs;
}

// ── Stage pill ───────────────────────────────────────────────

const STATE_STYLES: Record<StageState, { bg: string; border: string; text: string; icon: string }> = {
  disabled:  { bg: 'bg-surface-raised',     border: 'border-border',        text: 'text-text-subtle',  icon: 'text-text-subtle' },
  not_built: { bg: 'bg-surface-raised',     border: 'border-border',        text: 'text-text-muted',   icon: 'text-text-muted' },
  building:  { bg: 'bg-blue-500/10',        border: 'border-blue-500/30',   text: 'text-blue-400',     icon: 'text-blue-400' },
  stale:     { bg: 'bg-amber-500/10',       border: 'border-amber-500/30',  text: 'text-amber-400',    icon: 'text-amber-400' },
  ready:     { bg: 'bg-emerald-500/10',     border: 'border-emerald-500/30',text: 'text-emerald-400',  icon: 'text-emerald-400' },
  warning:   { bg: 'bg-orange-500/10',      border: 'border-orange-500/30', text: 'text-orange-400',   icon: 'text-orange-400' },
};

function StateIcon({ state }: { state: StageState }) {
  const cls = 'w-3.5 h-3.5';
  switch (state) {
    case 'disabled': return <Circle className={cls} />;
    case 'not_built': return <Circle className={cls} />;
    case 'building': return <Loader2 className={cn(cls, 'animate-spin')} />;
    case 'stale': return <Clock className={cls} />;
    case 'warning': return <AlertTriangle className={cls} />;
    case 'ready': return <CheckCircle2 className={cls} />;
  }
}

function StagePill({
  label,
  icon: Icon,
  state,
  stats,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  state: StageState;
  stats?: string;
}) {
  const s = STATE_STYLES[state];
  return (
    <div className={cn(
      'flex-1 min-w-0 rounded-lg border p-3 transition-colors',
      s.bg, s.border,
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn('w-4 h-4 shrink-0', s.icon)} />
        <span className={cn('text-xs font-semibold truncate', s.text)}>{label}</span>
        <span className="ml-auto">
          <StateIcon state={state} />
        </span>
      </div>
      {stats && (
        <p className="text-[10px] text-text-muted leading-tight truncate">{stats}</p>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <ArrowRight className="w-3.5 h-3.5 text-text-subtle shrink-0 mx-0.5" />
  );
}

// ── Main component ───────────────────────────────────────────

export function TracePipelineStatus({
  trace,
  augmentation,
  deepAnalysis,
  smallModelConfigured = false,
  largeModelConfigured = false,
  onBuildTrace,
  onRunAugmentation,
  onRunDeepAnalysis,
  augmenting = false,
  deepAnalyzing = false,
  className,
}: TracePipelineStatusProps) {
  const traceState = computeTraceState(trace);

  const effectiveAugState = augmenting
    ? 'building' as StageState
    : computeAugmentState(trace, augmentation);

  const effectiveDeepState = deepAnalyzing
    ? 'building' as StageState
    : computeDeepState(trace, augmentation, deepAnalysis);

  // Build stats strings
  const traceStats = traceState === 'ready'
    ? `${trace.counts.nodes.toLocaleString()} nodes · ${trace.counts.edges.toLocaleString()} edges`
    : traceState === 'building' ? 'Building...'
    : traceState === 'not_built' ? 'Not built yet'
    : traceState === 'disabled' ? 'Disabled'
    : '';

  const augStats = (() => {
    if (effectiveAugState === 'building') return 'Augmenting...';
    if (effectiveAugState === 'disabled') return 'Needs trace first';
    if (effectiveAugState === 'not_built') return smallModelConfigured ? 'Ready to augment' : 'No model configured';
    if (!augmentation) return '';
    const pct = augmentation.total_nodes > 0
      ? Math.round((augmentation.augmented_nodes / augmentation.total_nodes) * 100)
      : 0;
    const conf = augmentation.avg_confidence > 0
      ? `${Math.round(augmentation.avg_confidence * 100)}% conf`
      : '';
    return `${pct}% covered${conf ? ` · ${conf}` : ''}`;
  })();

  const deepStats = (() => {
    if (effectiveDeepState === 'building') return 'Validating...';
    if (effectiveDeepState === 'disabled') return 'Needs augmentation';
    if (effectiveDeepState === 'not_built') return largeModelConfigured ? 'Never run' : 'No model configured';
    if (!deepAnalysis) return '';
    const parts: string[] = [];
    if (deepAnalysis.last_run_at) parts.push(formatTimeAgo(deepAnalysis.last_run_at));
    if (deepAnalysis.queue_size != null) parts.push(`${deepAnalysis.queue_size} queued`);
    return parts.join(' · ') || 'Ready';
  })();

  const recommendations = computeRecommendations(
    trace, augmentation, deepAnalysis,
    smallModelConfigured, largeModelConfigured,
    onRunAugmentation, onRunDeepAnalysis, onBuildTrace,
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Pipeline stages */}
      <div className="flex items-center gap-1">
        <StagePill
          label="Trace"
          icon={GitBranch}
          state={traceState}
          stats={traceStats}
        />
        <Arrow />
        <StagePill
          label="Augmented"
          icon={Brain}
          state={effectiveAugState}
          stats={augStats}
        />
        <Arrow />
        <StagePill
          label="Validated"
          icon={ShieldCheck}
          state={effectiveDeepState}
          stats={deepStats}
        />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-1.5">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 px-3 py-2 rounded-md text-xs',
                rec.level === 'warning' && 'bg-amber-500/10 border border-amber-500/20 text-amber-300',
                rec.level === 'action' && 'bg-blue-500/10 border border-blue-500/20 text-blue-300',
                rec.level === 'info' && 'bg-surface-raised border border-border text-text-muted',
              )}
            >
              {rec.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              {rec.level === 'action' && <Play className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              {rec.level === 'info' && <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              <span className="flex-1 leading-relaxed">{rec.message}</span>
              {rec.action && rec.onAction && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={rec.onAction}
                  className="shrink-0 ml-1"
                >
                  {rec.action}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
