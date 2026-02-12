import { cn } from '../../lib/utils';
import { Button } from '../primitives/Button';
import { Select } from '../primitives/Select';
import { StepperNumberInput } from '../primitives/StepperNumberInput';
import { Brain, Calendar, Clock, Gauge, Play, Info } from 'lucide-react';

export interface DeepAnalysisSchedule {
  mode: 'manual' | 'threshold' | 'scheduled';
  threshold_percent?: number;
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  day_of_week?: number;
  hour?: number;
  budget_max_tokens: number;
  budget_max_minutes: number;
  budget_max_items: number;
  priority: 'lowest_confidence' | 'highest_connectivity';
}

export interface DeepAnalysisStatus {
  last_run_at?: string;
  last_run_items?: number;
  last_run_tokens?: number;
  next_run_at?: string;
  queue_size?: number;
  avg_confidence?: number;
}

export interface DeepAnalysisSettingsProps {
  schedule: DeepAnalysisSchedule;
  onScheduleChange: (schedule: DeepAnalysisSchedule) => void;
  status?: DeepAnalysisStatus;
  largeModelConfigured?: boolean;
  onRunNow?: () => void;
  running?: boolean;
  className?: string;
}

const MODE_OPTIONS = [
  { value: 'manual', label: 'Manual only (run from dashboard)' },
  { value: 'threshold', label: 'After major changes' },
  { value: 'scheduled', label: 'Scheduled' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

const DAY_OPTIONS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${i === 0 ? '12' : i > 12 ? String(i - 12) : String(i)}:00 ${i < 12 ? 'AM' : 'PM'}`,
}));

const PRIORITY_OPTIONS = [
  { value: 'lowest_confidence', label: 'Lowest confidence first' },
  { value: 'highest_connectivity', label: 'Most-connected first' },
];

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatNumber(n?: number): string {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function DeepAnalysisSettings({
  schedule,
  onScheduleChange,
  status,
  largeModelConfigured = false,
  onRunNow,
  running = false,
  className,
}: DeepAnalysisSettingsProps) {
  const update = (patch: Partial<DeepAnalysisSchedule>) =>
    onScheduleChange({ ...schedule, ...patch });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Brain className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-text">Deep Analysis</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Reasoning model validates augmentations and builds codebase ontology.
            Uses <strong>Tier 0 (ground truth)</strong> evidence only — no hallucination risk.
          </p>
        </div>
      </div>

      {/* Model requirement warning */}
      {!largeModelConfigured && (
        <div className="flex gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-xs">
            Configure a <strong>Large Model</strong> in AI Models settings to enable deep analysis.
          </span>
        </div>
      )}

      {/* Schedule mode */}
      <section className="space-y-3">
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Schedule
        </h4>
        <Select
          value={schedule.mode}
          onChange={(e) => update({ mode: e.target.value as DeepAnalysisSchedule['mode'] })}
          options={MODE_OPTIONS}
          size="sm"
          disabled={!largeModelConfigured}
        />

        {schedule.mode === 'threshold' && (
          <div className="space-y-1.5 pl-1">
            <label className="text-xs text-text-muted">
              Trigger when &gt; <strong>{schedule.threshold_percent ?? 20}%</strong> of files changed
            </label>
            <StepperNumberInput
              value={schedule.threshold_percent ?? 20}
              onValueChange={(v) => update({ threshold_percent: v })}
              min={5}
              max={80}
              step={5}
              disabled={!largeModelConfigured}
            />
          </div>
        )}

        {schedule.mode === 'scheduled' && (
          <div className="space-y-3 pl-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Frequency</label>
                <Select
                  value={schedule.frequency ?? 'weekly'}
                  onChange={(e) => update({ frequency: e.target.value as DeepAnalysisSchedule['frequency'] })}
                  options={FREQUENCY_OPTIONS}
                  size="sm"
                  disabled={!largeModelConfigured}
                />
              </div>
              {(schedule.frequency ?? 'weekly') !== 'daily' && (
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Day</label>
                  <Select
                    value={String(schedule.day_of_week ?? 0)}
                    onChange={(e) => update({ day_of_week: Number(e.target.value) })}
                    options={DAY_OPTIONS}
                    size="sm"
                    disabled={!largeModelConfigured}
                  />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Time</label>
              <Select
                value={String(schedule.hour ?? 2)}
                onChange={(e) => update({ hour: Number(e.target.value) })}
                options={HOUR_OPTIONS}
                size="sm"
                disabled={!largeModelConfigured}
              />
            </div>
          </div>
        )}
      </section>

      {/* Budget controls */}
      <section className="space-y-3">
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5" /> Budget Per Session
        </h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-text-muted">Max tokens</label>
            <StepperNumberInput
              value={schedule.budget_max_tokens}
              onValueChange={(v) => update({ budget_max_tokens: v })}
              min={1000}
              max={500000}
              step={5000}
              disabled={!largeModelConfigured}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-muted">Max time (minutes)</label>
            <StepperNumberInput
              value={schedule.budget_max_minutes}
              onValueChange={(v) => update({ budget_max_minutes: v })}
              min={5}
              max={480}
              step={5}
              disabled={!largeModelConfigured}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-muted">Max items per session</label>
            <StepperNumberInput
              value={schedule.budget_max_items}
              onValueChange={(v) => update({ budget_max_items: v })}
              min={10}
              max={1000}
              step={10}
              disabled={!largeModelConfigured}
            />
          </div>
        </div>
      </section>

      {/* Priority */}
      <section className="space-y-2">
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">Priority</h4>
        <Select
          value={schedule.priority}
          onChange={(e) => update({ priority: e.target.value as DeepAnalysisSchedule['priority'] })}
          options={PRIORITY_OPTIONS}
          size="sm"
          disabled={!largeModelConfigured}
        />
      </section>

      {/* Status */}
      {status && (
        <section className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Status
          </h4>
          <div className="rounded-md border border-border bg-surface-raised p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Last run</span>
              <span className="text-text font-medium">
                {formatDate(status.last_run_at)}
                {status.last_run_items != null && ` — ${status.last_run_items} items`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Tokens used</span>
              <span className="text-text font-medium">{formatNumber(status.last_run_tokens)}</span>
            </div>
            {schedule.mode !== 'manual' && (
              <div className="flex justify-between">
                <span className="text-text-muted">Next run</span>
                <span className="text-text font-medium">{formatDate(status.next_run_at)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-muted">Validation queue</span>
              <span className="text-text font-medium">
                {formatNumber(status.queue_size)} items
                {status.avg_confidence != null && (
                  <span className="text-text-subtle ml-1">(avg conf: {(status.avg_confidence * 100).toFixed(0)}%)</span>
                )}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Run now button */}
      {onRunNow && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRunNow}
          disabled={!largeModelConfigured || running}
          className="w-full"
        >
          <Play className="w-3.5 h-3.5 mr-1.5" />
          {running ? 'Running...' : 'Run Deep Analysis Now'}
        </Button>
      )}
    </div>
  );
}
