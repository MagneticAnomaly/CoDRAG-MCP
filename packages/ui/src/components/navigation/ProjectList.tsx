import { useState, type ReactNode } from 'react';
import type { ProjectSummary } from '../../types';
import { StatusBadge } from '../status/StatusBadge';
import { cn } from '../../lib/utils';
import { FolderPlus, X } from 'lucide-react';
import { Button } from '../primitives/Button';

export interface ProjectListProps {
  projects: ProjectSummary[];
  selectedProjectId?: string;
  onProjectSelect: (projectId: string) => void;
  onAddProject: () => void;
  onDeleteProject?: (projectId: string) => void;
  extraActions?: ReactNode;
  className?: string;
}

export interface ProjectListItemProps {
  project: ProjectSummary;
  selected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

/**
 * ProjectListItem - Single project row in the sidebar
 */
function ProjectListItem({ project, selected, onClick, onDelete }: ProjectListItemProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      className={cn(
        'w-full text-left px-4 py-3 border-b border-border group relative',
        'hover:bg-surface-raised transition-colors cursor-pointer',
        selected ? 'bg-surface-raised border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      {confirming ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-text-muted flex-1">Delete project?</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete?.(); setConfirming(false); }}
            className="text-xs h-6 px-2"
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
            className="text-xs h-6 px-2"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className={cn("font-medium truncate text-sm", selected ? "text-primary" : "text-text")}>
              {project.name}
            </span>
            <div className="flex items-center gap-1">
              <StatusBadge status={project.status} showLabel={false} />
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-error/10 text-text-muted hover:text-error"
                  aria-label={`Delete ${project.name}`}
                  title="Delete project"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <span className="text-xs text-text-muted truncate block mt-1">
            {project.path}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * ProjectList - List of registered projects in sidebar
 * 
 * Displays:
 * - List of projects with status indicators
 * - Selected state highlighting
 * - Add project button
 */
export function ProjectList({
  projects,
  selectedProjectId,
  onProjectSelect,
  onAddProject,
  onDeleteProject,
  extraActions,
  className,
}: ProjectListProps) {
  return (
    <div className={cn('flex flex-col h-full bg-surface', className)}>
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-muted flex flex-col items-center gap-2 mt-4">
            <div className="p-3 rounded-full bg-surface-raised">
              <FolderPlus className="w-6 h-6 text-text-subtle" />
            </div>
            No projects yet
          </div>
        ) : (
          projects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              selected={project.id === selectedProjectId}
              onClick={() => onProjectSelect(project.id)}
              onDelete={onDeleteProject ? () => onDeleteProject(project.id) : undefined}
            />
          ))
        )}
      </div>
      <div className="px-2 py-2 border-t border-border flex gap-1.5">
        <Button
          onClick={onAddProject}
          variant="outline"
          size="sm"
          className="flex-1 bg-surface hover:bg-surface-raised"
          icon={FolderPlus}
        >
          Add Project
        </Button>
        {extraActions && (
          <div className="flex-1 [&>div]:w-full [&_button:first-child]:w-full">
            {extraActions}
          </div>
        )}
      </div>
    </div>
  );
}
