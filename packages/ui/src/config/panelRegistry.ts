import { 
  BookOpen,
  Brain,
  Database, 
  Eye,
  GitBranch,
  Search, 
  Settings2, 
  FolderTree, 
  FileText, 
  Pin,
  SlidersHorizontal,
  List,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import type { PanelDefinition } from '../types/layout';

/**
 * Registry of all available dashboard panels
 * Used by PanelPicker and for rendering the modular layout
 */
export const PANEL_REGISTRY: PanelDefinition[] = [
  {
    id: 'log-console',
    title: 'Process Logs',
    description: 'Real-time logs from the CoDRAG daemon.',
    icon: Terminal,
    minHeight: 3,
    defaultHeight: 5,
    category: 'status',
    closeable: true,
    resizable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#logs',
  },
  {
    id: 'usage-guide',
    title: 'Quick Start',
    description: 'MCP tool names and usage examples to get started with your AI assistant.',
    icon: BookOpen,
    minHeight: 3,
    defaultHeight: 6,
    category: 'status',
    closeable: true,
    resizable: false,
    docsUrl: 'https://docs.codrag.io',
  },
  {
    id: 'status',
    title: 'Knowledge Base Status',
    description: 'Status of your vector search index (Docs + Code).',
    icon: Database,
    minHeight: 3,
    defaultHeight: 4,
    category: 'status',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#status',
  },
  {
    id: 'llm-status',
    title: 'AI Gateway',
    description: 'Connection status for local (Ollama) and cloud (OpenAI/Anthropic) models.',
    icon: Settings2,
    minHeight: 4,
    defaultHeight: 8,
    category: 'status',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#llm-status',
  },
  {
    id: 'search',
    title: 'Knowledge Query',
    description: 'Semantic search across documentation, plans, and codebase meanings.',
    icon: Search,
    minHeight: 5,
    defaultHeight: 7,
    category: 'search',
    closeable: false, // Core functionality
    docsUrl: 'https://docs.codrag.io/dashboard#search',
  },
  {
    id: 'context-options',
    title: 'Context Assembler',
    description: 'Configure and assemble the context prompt from search results.',
    icon: SlidersHorizontal,
    minHeight: 3,
    defaultHeight: 8,
    category: 'context',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#context-options',
  },
  {
    id: 'results',
    title: 'Retrieved Context',
    description: 'Chunks of code and text retrieved from the Knowledge Base.',
    icon: List,
    minHeight: 6,
    defaultHeight: 10,
    category: 'search',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#results',
  },
  {
    id: 'context-output',
    title: 'Prompt Buffer',
    description: 'The final assembled context, ready to be copied to your LLM.',
    icon: FileText,
    minHeight: 6,
    defaultHeight: 10,
    category: 'context',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#context-output',
  },
  {
    id: 'roots',
    title: 'Knowledge Scope',
    description: 'Define the active scope for the AI (Docs + Code).',
    icon: FolderTree,
    minHeight: 3,
    defaultHeight: 8,
    category: 'config',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#roots',
  },
  {
    id: 'file-tree',
    title: 'File Tree',
    description: 'Navigate your project files.',
    icon: FolderTree,
    minHeight: 6,
    defaultHeight: 10,
    category: 'projects',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#file-tree',
  },
  {
    id: 'pinned-files',
    title: 'Pinned Files',
    description: 'Quick access to frequently used files.',
    icon: Pin,
    minHeight: 6,
    defaultHeight: 10,
    category: 'projects',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#pinned-files',
  },
  {
    id: 'watch',
    title: 'Live Sync',
    description: 'Monitor file changes and auto-rebuild status.',
    icon: Eye,
    minHeight: 3,
    defaultHeight: 4,
    category: 'status',
    closeable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#watch',
  },
  {
    id: 'trace',
    title: 'Cross-Reference Graph',
    description: 'Navigate the complete web of relationships across the entire codebase.',
    icon: GitBranch,
    minHeight: 6,
    defaultHeight: 10,
    category: 'search',
    closeable: true,
    resizable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#trace',
  },
  {
    id: 'trace-coverage',
    title: 'Cross-Reference Status',
    description: 'Completeness of the full-codebase cross-reference map.',
    icon: ShieldCheck,
    minHeight: 6,
    defaultHeight: 10,
    category: 'status',
    closeable: true,
    resizable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#trace-coverage',
  },
  {
    id: 'trace-pipeline',
    title: 'AI Pipeline',
    description: 'Status of the three-stage trace pipeline: Structural Graph → LLM Augmentation → Deep Validation.',
    icon: Brain,
    minHeight: 3,
    defaultHeight: 5,
    category: 'status',
    closeable: true,
    resizable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#trace-pipeline',
  },
  {
    id: 'deep-analysis',
    title: 'Deep Analysis',
    description: 'Reasoning model validation and ontology synthesis settings.',
    icon: Brain,
    minHeight: 6,
    defaultHeight: 12,
    category: 'config',
    closeable: true,
    resizable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#deep-analysis',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Project-level and global configuration.',
    icon: Settings2,
    minHeight: 6,
    defaultHeight: 10,
    category: 'config',
    closeable: true,
    resizable: true,
    docsUrl: 'https://docs.codrag.io/dashboard#settings',
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
