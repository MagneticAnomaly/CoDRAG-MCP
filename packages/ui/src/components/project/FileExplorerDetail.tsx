import { useState, useCallback } from 'react';
import { FolderTree as FolderTreeIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FolderTree } from './FolderTree';
import type { TreeNode } from './FolderTree';
import { FilePreviewPane } from './FilePreviewPane';

export interface FileExplorerDetailProps {
  treeData: TreeNode[];
  pinnedPaths: Set<string>;
  onPinFile: (path: string) => void;
  onUnpinFile: (path: string) => void;
  /** Async loader for file content. If omitted, mock content is shown. */
  onLoadFileContent?: (path: string) => Promise<string>;
  includedPaths?: Set<string>;
  onToggleInclude?: (paths: string[], action: 'add' | 'remove') => void;
  className?: string;
}

export function FileExplorerDetail({
  treeData,
  pinnedPaths,
  onPinFile,
  onUnpinFile,
  onLoadFileContent,
  includedPaths,
  onToggleInclude,
  className,
}: FileExplorerDetailProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleNodeClick = useCallback(
    async (node: TreeNode, path: string) => {
      if (node.type !== 'file') return;

      setSelectedPath(path);
      setFileContent(null);
      setFileError(null);

      if (onLoadFileContent) {
        setFileLoading(true);
        try {
          const content = await onLoadFileContent(path);
          setFileContent(content);
        } catch (e) {
          setFileError(e instanceof Error ? e.message : 'Failed to load file');
        } finally {
          setFileLoading(false);
        }
      } else {
        setFileContent(
          `// Content of ${path}\n// (mock data — connect onLoadFileContent for real content)\n`
        );
      }
    },
    [onLoadFileContent]
  );

  return (
    <div className={cn('h-full flex flex-col md:flex-row', className)}>
      {/* Tree pane */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 border-b md:border-b-0 md:border-r border-border overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <FolderTreeIcon className="w-4 h-4" />
            Project Files
          </h3>
          <FolderTree
            data={treeData}
            compact
            includedPaths={includedPaths}
            onToggleInclude={onToggleInclude}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>

      {/* Preview pane */}
      <div className="flex-1 min-w-0 min-h-0">
        <FilePreviewPane
          path={selectedPath}
          content={fileContent}
          loading={fileLoading}
          error={fileError}
          isPinned={selectedPath ? pinnedPaths.has(selectedPath) : false}
          onPin={onPinFile}
          onUnpin={onUnpinFile}
        />
      </div>
    </div>
  );
}
