// CoDRAG UI - Shared Component Library
// This package provides the design system foundation for CoDRAG app and website

// Utilities
export { cn } from './lib/utils';

// Types
export type { 
  StatusState, 
  SearchResult, 
  CodeChunk, 
  ProjectSummary, 
  ProjectConfig, 
  ProjectMode,
  LLMConfig, 
  SavedEndpoint, 
  EndpointTestResult,
  ProjectStatus,
  WatchStatus,
  WatchState,
  ApiError,
  TraceCoverageFile,
  TraceCoverageSummary,
  TraceCoverage,
} from './types';

// Components - Status
export { StatusBadge, StatusCard, BuildProgress } from './components/status';
export type { StatusBadgeProps, StatusCardProps, BuildProgressProps } from './components/status';

// Components - Navigation
export { Sidebar, ProjectList, ProjectTabs, AppShell } from './components/navigation';
export type { SidebarProps, ProjectListProps, ProjectTabsProps, ProjectTab, AppShellProps } from './components/navigation';

// Components - Search
export { SearchInput, SearchResultRow, ChunkViewer, SearchPanel, ContextOptionsPanel, SearchResultsList, ChunkPreview, ContextOutput } from './components/search';
export type { SearchInputProps, SearchResultRowProps, ChunkViewerProps, SearchPanelProps, ContextOptionsPanelProps, SearchResultsListProps, ChunkPreviewProps, ContextOutputProps, ContextMeta } from './components/search';

// Components - Context
export { CopyButton, CitationBlock, ContextViewer } from './components/context';
export type { CopyButtonProps, CitationBlockProps, ContextViewerProps, ContextChunk } from './components/context';

// Components - Patterns (shared states)
export { EmptyState, LoadingState, ErrorState } from './components/patterns';
export type { EmptyStateProps, LoadingStateProps, ErrorStateProps } from './components/patterns';

// Components - Dashboard
export { IndexStatusCard, BuildCard, IndexStatsDisplay, LLMStatusWidget } from './components/dashboard';
export type { IndexStatusCardProps, IndexStats, BuildCardProps, IndexStatsProps, StatItem, LLMStatusWidgetProps, LLMServiceStatus } from './components/dashboard';

// Components - LLM
export { ModelCard, EndpointManager, AIModelsSettings } from './components/llm';

// Components - Primitives
export { Button } from './components/primitives/Button';
export { Select } from './components/primitives/Select';
export type { SelectProps, SelectOption } from './components/primitives/Select';
export { PathInput } from './components/primitives/PathInput';
export type { PathInputProps, PathPickerMode } from './components/primitives/PathInput';

// Components - Project
export { FolderTree, sampleFileTree, ProjectSettingsPanel, FolderTreePanel, PinnedTextFilesPanel, AddProjectModal, FilePreviewPane, FileExplorerDetail } from './components/project';
export type { FolderTreeProps, TreeNode, FileStatus, ProjectSettingsPanelProps, FolderTreePanelProps, PinnedTextFilesPanelProps, PinnedTextFile, AddProjectModalProps, FilePreviewPaneProps, FileExplorerDetailProps } from './components/project';

// Components - Watch (Phase 03)
export { WatchStatusIndicator, WatchControlPanel } from './components/watch';
export type { WatchStatusIndicatorProps, WatchControlPanelProps } from './components/watch';

// Components - Trace (Phase 04)
export { TraceStatusCard, TraceExplorer, TraceCoveragePanel } from './components/trace';
export type { TraceStatusCardProps, TraceExplorerProps, TraceCoveragePanelProps } from './components/trace';

// Components - Layout (Modular Dashboard - Phase 15)
export { PanelChrome, DashboardGrid, PanelPicker, ModularDashboard, useLayoutPersistence } from './components/layout';
export type { PanelChromeProps, DashboardGridProps, PanelPickerProps, ModularDashboardProps, PanelContentMap, DashboardLayoutApi } from './components/layout';

// Components - Marketing & Site (Phase 12)
export { MarketingHero, FeatureBlocks, codragFeatures, marketingFeatures, TierComparison, tierComparisonFeatures, TechStackMatrix, techStackComponents } from './components/marketing';
export type { MarketingHeroProps, FeatureBlocksProps, Feature, TierComparisonProps, TierFeature, TechStackMatrixProps, StackComponent } from './components/marketing';
export { SiteHeader, SiteFooter } from './components/site';
export type { SiteHeaderProps, SiteFooterProps, NavLink, FooterSection, FooterLink } from './components/site';

// Components - Docs (Phase 12)
export { DocsLayout, DocsSidebarNav, TableOfContents } from './components/docs';
export type { DocsLayoutProps, DocsSidebarNavProps, DocNode, TableOfContentsProps, TocItem } from './components/docs';

// Layout Types (Phase 15)
export type { 
  PanelConfig, 
  DashboardLayout, 
  PanelCategory, 
  PanelDefinition, 
  PanelProps, 
  GridLayoutItem 
} from './types/layout';
export { DEFAULT_LAYOUT, LAYOUT_STORAGE_KEY, BASE_COLS, toGridLayout, fromGridLayout, reflowLayout, computeGridCols, adjustLayoutForColChange } from './types/layout';

// Panel Registry (Phase 15)
export { PANEL_REGISTRY, getPanelDefinition, getPanelsByCategory } from './config/panelRegistry';

// API (typed client + Storybook mocking helpers)
export * from './api';
