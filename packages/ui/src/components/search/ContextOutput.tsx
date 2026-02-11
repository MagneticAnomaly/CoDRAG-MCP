import { cn } from '../../lib/utils';
import { FileText } from 'lucide-react';
import { Card, Title, Flex, Badge } from '@tremor/react';

export interface ContextMeta {
  chunks?: { source_path: string; section: string; score: number; truncated: boolean }[];
  total_chars?: number;
  estimated_tokens?: number;
}

export interface ContextOutputProps {
  context: string;
  meta?: ContextMeta | null;
  className?: string;
  bare?: boolean;
}

/**
 * ContextOutput - Displays assembled context with metadata.
 * 
 * Features:
 * - Monospace code display
 * - Metadata bar (chunks, chars, tokens)
 * - Scrollable content area
 */
export function ContextOutput({
  context,
  meta,
  className,
  bare = false,
}: ContextOutputProps) {
  if (!context) {
    return null;
  }

  const Container = bare ? 'div' : Card;

  return (
    <Container className={cn(!bare && 'border border-border bg-surface shadow-sm', className)}>
      {!bare && (
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Flex justifyContent="start" alignItems="center" className="gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <Title className="text-text">Prompt Buffer</Title>
          </Flex>
          {meta && (
            <Flex justifyContent="end" className="gap-2">
               <Badge color="gray" size="xs">{meta.chunks?.length ?? 0} chunks</Badge>
               <Badge color="gray" size="xs">{meta.total_chars?.toLocaleString()} chars</Badge>
               <Badge color="blue" size="xs">~{meta.estimated_tokens?.toLocaleString()} tokens</Badge>
            </Flex>
          )}
        </Flex>
      )}
      
      <div className={cn(
        "bg-surface-raised border border-border rounded-lg overflow-hidden",
        bare && "h-full"
      )}>
        <pre className={cn(
          "p-4 text-xs whitespace-pre-wrap font-mono text-text overflow-y-auto custom-scrollbar",
          bare ? "h-full" : "max-h-96"
        )}>
          {context}
        </pre>
      </div>
    </Container>
  );
}
