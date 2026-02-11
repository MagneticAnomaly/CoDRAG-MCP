import { Badge, Card, Flex, Title } from '@tremor/react';
import { FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { CopyButton } from '../context/CopyButton';
import { ProjectTabs } from '../navigation/ProjectTabs';
import type { ProjectTab } from '../navigation/ProjectTabs';
import { EmptyState } from '../patterns/EmptyState';
import { CodeViewer } from './CodeViewer';

export interface PinnedTextFile {
  id: string;
  path: string;
  name: string;
  content: string;
}

export interface PinnedTextFilesPanelProps {
  files: PinnedTextFile[];
  onUnpin: (fileId: string) => void;
  title?: string;
  className?: string;
  bare?: boolean;
}

export function PinnedTextFilesPanel({
  files,
  onUnpin,
  title = 'Pinned Files',
  className,
  bare = false,
}: PinnedTextFilesPanelProps) {
  const [activeFileId, setActiveFileId] = useState<string | undefined>(files[0]?.id);

  useEffect(() => {
    setActiveFileId((current) => {
      if (files.length === 0) return undefined;
      if (current && files.some((f) => f.id === current)) return current;
      return files[0].id;
    });
  }, [files]);

  const activeFile = useMemo(() => {
    if (files.length === 0) return undefined;
    return files.find((f) => f.id === activeFileId) ?? files[0];
  }, [files, activeFileId]);

  const tabs = useMemo<ProjectTab[]>(
    () => files.map((f) => ({ id: f.id, name: f.name, path: f.path })),
    [files]
  );

  const Container = bare ? 'div' : Card;

  return (
    <Container className={cn(!bare && 'border border-border bg-surface shadow-sm', 'flex flex-col', className)}>
      {!bare && (
        <Flex justifyContent="between" alignItems="center" className="mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Title className="text-text truncate">{title}</Title>
            <Badge color="gray" size="xs">{files.length}</Badge>
          </div>
          {activeFile && <CopyButton text={activeFile.content} label="Copy" />}
        </Flex>
      )}

      {files.length === 0 ? (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <EmptyState
            title="No pinned files"
            description="Click a file in the tree to pin it here."
            icon={<FileText />}
            className="w-full"
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ProjectTabs
            tabs={tabs}
            activeTabId={activeFileId}
            onTabSelect={setActiveFileId}
            onTabClose={onUnpin}
          />
          
          {activeFile && (
            <CodeViewer 
              content={activeFile.content}
              path={activeFile.path}
            />
          )}
        </div>
      )}
    </Container>
  );
}
