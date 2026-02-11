import { cn } from '../../lib/utils';
import type { WatchState, WatchStatus } from '../../types';
import { Eye, Clock, AlertTriangle, PlayCircle, Loader2 } from 'lucide-react';
import { Button } from '../primitives/Button';

export interface WatchStatusIndicatorProps {
  status: WatchStatus;
  onRebuildNow?: () => void;
  showDetails?: boolean;
  className?: string;
}

const stateConfig: Record<WatchState, { label: string; icon: any; classes: string }> = {
  disabled: { 
    label: 'Sync Inactive', 
    icon: Eye,
    classes: 'bg-surface-raised text-text-muted border-border' 
  },
  idle: { 
    label: 'Live Syncing', 
    icon: Clock,
    classes: 'bg-success-muted/10 text-success border-success-muted/20' 
  },
  debouncing: { 
    label: 'Changes Detected', 
    icon: AlertTriangle,
    classes: 'bg-warning-muted/10 text-warning border-warning-muted/20' 
  },
  building: { 
    label: 'Indexing', 
    icon: Loader2,
    classes: 'bg-info-muted/10 text-info border-info-muted/20' 
  },
  throttled: { 
    label: 'Sync Paused', 
    icon: Clock,
    classes: 'bg-warning-muted/10 text-warning border-warning-muted/20' 
  },
};

export function WatchStatusIndicator({
  status,
  onRebuildNow,
  showDetails = false,
  className,
}: WatchStatusIndicatorProps) {
  const config = stateConfig[status.state];
  const Icon = config.icon;
  const pendingPathsCount = status.pending_paths_count ?? 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
          config.classes
        )}>
          <Icon className={cn("w-3.5 h-3.5", status.state === 'building' && "animate-spin")} />
          {config.label}
        </span>
        
        {status.stale && status.state !== 'building' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-warning-muted/10 text-warning border-warning-muted/20">
            Stale
          </span>
        )}
        
        {status.pending && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-info-muted/10 text-info border-info-muted/20">
            Pending
          </span>
        )}
      </div>

      {showDetails && (
        <div className="space-y-1 text-xs text-text-muted bg-surface-raised/50 p-2 rounded border border-border/50">
          {pendingPathsCount > 0 && (
            <p>{pendingPathsCount} files changed since last build</p>
          )}
          
          {status.state === 'debouncing' && status.next_rebuild_at && (
            <p>Auto-rebuild scheduled</p>
          )}
          
          {status.last_rebuild_at && (
            <p>Last rebuild: {status.last_rebuild_at}</p>
          )}
        </div>
      )}

      {status.stale && status.state !== 'building' && onRebuildNow && (
        <Button
          onClick={onRebuildNow}
          variant="outline"
          size="sm"
          className="self-start shadow-sm bg-surface"
          icon={PlayCircle}
        >
          Rebuild Now
        </Button>
      )}
    </div>
  );
}
