import { Pin, PinOff, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../primitives/Button';
import { CopyButton } from '../context/CopyButton';

export interface FilePreviewPaneProps {
  path: string | null;
  content: string | null;
  loading?: boolean;
  error?: string | null;
  isPinned?: boolean;
  onPin?: (path: string) => void;
  onUnpin?: (path: string) => void;
  className?: string;
}

export function FilePreviewPane({
  path,
  content,
  loading = false,
  error = null,
  isPinned = false,
  onPin,
  onUnpin,
  className,
}: FilePreviewPaneProps) {
  if (!path) {
    return (
      <div className={cn('flex items-center justify-center h-full text-text-muted text-sm', className)}>
        <div className="text-center space-y-2">
          <FileText className="w-8 h-8 mx-auto opacity-40" />
          <p>Select a file to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with path + actions */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface shrink-0">
        <span className="text-xs font-mono text-text truncate flex-1">{path}</span>
        <div className="flex items-center gap-1 shrink-0">
          {content && <CopyButton text={content} label="Copy" />}
          <Button
            variant={isPinned ? 'default' : 'outline'}
            size="sm"
            onClick={() => (isPinned ? onUnpin?.(path) : onPin?.(path))}
            title={isPinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
          >
            {isPinned ? (
              <PinOff className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Pin className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isPinned ? 'Unpin' : 'Pin'}
          </Button>
        </div>
      </div>

      {/* File content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          Loading…
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-error text-sm p-4">
          {error}
        </div>
      ) : (
        <pre className="flex-1 min-h-0 p-4 text-xs whitespace-pre-wrap font-mono text-text overflow-y-auto custom-scrollbar">
          {content ?? ''}
        </pre>
      )}
    </div>
  );
}
