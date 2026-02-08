import { 
  Database, 
  Eye,
  Hammer, 
  Search, 
  Settings2, 
  FolderTree, 
  FileText, 
  Pin,
  SlidersHorizontal,
  List
} from 'lucide-react';
import type { PanelDefinition } from '../types/layout';

/**
 * Registry of all available dashboard panels
 * Used by PanelPicker and for rendering the modular layout
 */
export const PANEL_REGISTRY: PanelDefinition[] = [
  {
    id: 'status',
    title: 'Index Status',
    icon: Database,
    minHeight: 3,
    defaultHeight: 4,
    category: 'status',
    closeable: true,
  },
  {
    id: 'build',
    title: 'Build',
    icon: Hammer,
    minHeight: 4,
    defaultHeight: 6,
    category: 'status',
    closeable: true,
  },
  {
    id: 'llm-status',
    title: 'LLM Services',
    icon: Settings2,
    minHeight: 4,
    defaultHeight: 8,
    category: 'status',
    closeable: true,
  },
  {
    id: 'search',
    title: 'Search',
    icon: Search,
    minHeight: 5,
    defaultHeight: 7,
    category: 'search',
    closeable: false, // Core functionality
  },
  {
    id: 'context-options',
    title: 'Context Options',
    icon: SlidersHorizontal,
    minHeight: 3,
    defaultHeight: 8,
    category: 'context',
    closeable: true,
  },
  {
    id: 'results',
    title: 'Search Results',
    icon: List,
    minHeight: 6,
    defaultHeight: 10,
    category: 'search',
    closeable: true,
  },
  {
    id: 'context-output',
    title: 'Context Output',
    icon: FileText,
    minHeight: 6,
    defaultHeight: 10,
    category: 'context',
    closeable: true,
  },
  {
    id: 'roots',
    title: 'Index Scope',
    icon: FolderTree,
    minHeight: 3,
    defaultHeight: 8,
    category: 'config',
    closeable: true,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings2,
    minHeight: 4,
    defaultHeight: 6,
    category: 'config',
    closeable: true,
  },
  {
    id: 'file-tree',
    title: 'File Tree',
    icon: FolderTree,
    minHeight: 6,
    defaultHeight: 10,
    category: 'projects',
    closeable: true,
  },
  {
    id: 'pinned-files',
    title: 'Pinned Files',
    icon: Pin,
    minHeight: 6,
    defaultHeight: 10,
    category: 'projects',
    closeable: true,
  },
  {
    id: 'watch',
    title: 'File Watcher',
    icon: Eye,
    minHeight: 3,
    defaultHeight: 4,
    category: 'status',
    closeable: true,
  },
];

/**
 * Get panel definition by ID
 */
export function getPanelDefinition(id: string): PanelDefinition | undefined {
  return PANEL_REGISTRY.find((p) => p.id === id);
}

/**
 * Get panels grouped by category
 */
export function getPanelsByCategory(): Record<string, PanelDefinition[]> {
  const grouped: Record<string, PanelDefinition[]> = {};
  for (const panel of PANEL_REGISTRY) {
    if (!grouped[panel.category]) {
      grouped[panel.category] = [];
    }
    grouped[panel.category].push(panel);
  }
  return grouped;
}
