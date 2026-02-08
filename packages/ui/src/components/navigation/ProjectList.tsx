import type { ReactNode } from 'react';
import type { ProjectSummary } from '../../types';
import { StatusBadge } from '../status/StatusBadge';
import { cn } from '../../lib/utils';
import { FolderPlus } from 'lucide-react';
import { Button } from '../primitives/Button';

export interface ProjectListProps {
  projects: ProjectSummary[];
  selectedProjectId?: string;
  onProjectSelect: (projectId: string) => void;
  onAddProject: () => void;
  extraActions?: ReactNode;
  className?: string;
}

export interface ProjectListItemProps {
  project: ProjectSummary;
  selected: boolean;
  onClick: () => void;
}

/**
 * ProjectListItem - Single project row in the sidebar
 */
function ProjectListItem({ project, selected, onClick }: ProjectListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-border',
        'hover:bg-surface-raised transition-colors',
        selected ? 'bg-surface-raised border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("font-medium truncate text-sm", selected ? "text-primary" : "text-text")}>
          {project.name}
        </span>
        <StatusBadge status={project.status} showLabel={false} />
      </div>
      <span className="text-xs text-text-muted truncate block mt-1">
        {project.path}
      </span>
    </button>
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
            />
          ))
        )}
      </div>
      <div className="p-4 border-t border-border flex gap-2">
        <Button
          onClick={onAddProject}
          variant="outline"
          className="flex-1 bg-surface hover:bg-surface-raised"
          icon={FolderPlus}
        >
          Add Project
        </Button>
        {extraActions}
      </div>
    </div>
  );
}
