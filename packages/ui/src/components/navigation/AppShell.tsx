import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface AppShellProps {
  sidebar: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * AppShell - Main application layout container
 * 
 * Provides structure for:
 * - Sidebar (project list)
 * - Project tabs (top)
 * - Main content area
 * 
 * Layout: [Sidebar] | [Tabs / Content]
 */
export function AppShell({
  sidebar,
  tabs,
  children,
  className,
}: AppShellProps) {
  return (
    <div className={cn('flex h-screen bg-background text-text overflow-hidden', className)}>
      {/* Sidebar */}
      <div className="flex-shrink-0">
        {sidebar}
      </div>
      
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-background">
        {/* Project tabs */}
        <div className="flex-shrink-0">
          {tabs}
        </div>
        
        {/* Content */}
        <main className="flex-1 overflow-auto p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
