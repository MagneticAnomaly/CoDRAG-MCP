import { cn } from '../../lib/utils';
import type { WatchStatus } from '../../types';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../primitives/Button';
import { WatchStatusIndicator } from './WatchStatusIndicator';

export interface WatchControlPanelProps {
  status: WatchStatus;
  onStartWatch: () => void;
  onStopWatch: () => void;
  onRebuildNow?: () => void;
  loading?: boolean;
  className?: string;
  bare?: boolean;
}

export function WatchControlPanel({
  status,
  onStartWatch,
  onStopWatch,
  onRebuildNow,
  loading = false,
  className,
  bare = false,
}: WatchControlPanelProps) {
  const isActive = status.state !== 'disabled';
  const Container = bare ? 'div' : 'div';

  return (
    <Container
      className={cn(
        !bare && 'rounded-lg border border-border bg-surface p-4 shadow-sm',
        bare && 'p-2',
        'flex flex-col gap-3',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <WatchStatusIndicator
          status={status}
          onRebuildNow={onRebuildNow}
          showDetails
        />

        <Button
          onClick={isActive ? onStopWatch : onStartWatch}
          variant={isActive ? 'outline' : 'default'}
          size="sm"
          loading={loading}
          icon={isActive ? EyeOff : Eye}
        >
          {isActive ? 'Disable Sync' : 'Enable Sync'}
        </Button>
      </div>
    </Container>
  );
}
