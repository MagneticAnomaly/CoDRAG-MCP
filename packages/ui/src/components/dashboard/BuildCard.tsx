import { FolderOpen, Play } from 'lucide-react';
import { Card, Title, TextInput } from '@tremor/react';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/utils';

export interface BuildCardProps {
  repoRoot: string;
  onRepoRootChange: (value: string) => void;
  onBuild: () => void;
  building?: boolean;
  disabled?: boolean;
  className?: string;
  bare?: boolean;
}

/**
 * BuildCard - Controls for triggering an index build.
 * 
 * Provides:
 * - Repository root path input
 * - Build button with loading state
 */
export function BuildCard({
  repoRoot,
  onRepoRootChange,
  onBuild,
  building = false,
  disabled = false,
  className,
  bare = false,
}: BuildCardProps) {
  const Container = bare ? 'div' : Card;

  return (
    <Container className={cn(!bare && 'border border-border bg-surface shadow-sm', className)}>
      {!bare && (
        <Title className="text-text mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          Rebuild Knowledge Base
        </Title>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Source Root
          </label>
          <TextInput
            value={repoRoot}
            onValueChange={onRepoRootChange}
            placeholder="/path/to/repo"
            disabled={disabled || building}
            className="w-full"
          />
        </div>

        <Button
          onClick={onBuild}
          disabled={building || disabled || !repoRoot.trim()}
          className="w-full"
          loading={building}
          icon={!building ? Play : undefined}
        >
          {building ? 'Building...' : 'Start Rebuild'}
        </Button>
      </div>
    </Container>
  );
}
