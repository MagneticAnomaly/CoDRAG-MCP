import type { Meta, StoryObj } from '@storybook/react';
import { TracePipelineStatus } from '../../components/trace/TracePipelineStatus';
import type { AugmentationStatus, DeepAnalysisRunStatus } from '../../types';

const meta: Meta<typeof TracePipelineStatus> = {
  title: 'Dashboard/Widgets/Trace/PipelineStatus',
  component: TracePipelineStatus,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof TracePipelineStatus>;

const traceDisabled = {
  enabled: false,
  exists: false,
  building: false,
  counts: { nodes: 0, edges: 0 },
  last_build_at: null,
};

const traceNotBuilt = {
  enabled: true,
  exists: false,
  building: false,
  counts: { nodes: 0, edges: 0 },
  last_build_at: null,
};

const traceBuilding = {
  enabled: true,
  exists: false,
  building: true,
  counts: { nodes: 0, edges: 0 },
  last_build_at: null,
};

const traceReady = {
  enabled: true,
  exists: true,
  building: false,
  counts: { nodes: 1245, edges: 3890 },
  last_build_at: new Date(Date.now() - 3_600_000).toISOString(),
};

const augNone: AugmentationStatus = {
  enabled: false,
  total_nodes: 0,
  augmented_nodes: 0,
  validated_nodes: 0,
  avg_confidence: 0,
  low_confidence_count: 0,
};

const augPartial: AugmentationStatus = {
  enabled: true,
  total_nodes: 1245,
  augmented_nodes: 620,
  validated_nodes: 0,
  avg_confidence: 0.72,
  low_confidence_count: 180,
  last_augment_at: new Date(Date.now() - 86_400_000).toISOString(),
  model: 'llama3.2:3b',
};

const augFull: AugmentationStatus = {
  enabled: true,
  total_nodes: 1245,
  augmented_nodes: 1200,
  validated_nodes: 450,
  avg_confidence: 0.85,
  low_confidence_count: 45,
  last_augment_at: new Date(Date.now() - 7_200_000).toISOString(),
  model: 'llama3.2:3b',
};

const deepNone: DeepAnalysisRunStatus = {
  queue_size: 180,
  avg_confidence: 0.72,
  running: false,
};

const deepRan: DeepAnalysisRunStatus = {
  last_run_at: new Date(Date.now() - 604_800_000).toISOString(), // 1 week ago
  last_run_items: 47,
  last_run_tokens: 23_450,
  queue_size: 133,
  avg_confidence: 0.78,
  running: false,
};

const deepStale: DeepAnalysisRunStatus = {
  last_run_at: new Date(Date.now() - 2_592_000_000).toISOString(), // 30 days ago
  last_run_items: 47,
  last_run_tokens: 23_450,
  queue_size: 400,
  avg_confidence: 0.55,
  running: false,
};

export const Disabled: Story = {
  args: {
    trace: traceDisabled,
  },
};

export const TraceNotBuilt: Story = {
  args: {
    trace: traceNotBuilt,
  },
};

export const TraceBuilding: Story = {
  args: {
    trace: traceBuilding,
  },
};

export const TraceReadyNoModels: Story = {
  args: {
    trace: traceReady,
    augmentation: augNone,
  },
};

export const TraceReadySmallModel: Story = {
  args: {
    trace: traceReady,
    augmentation: augNone,
    smallModelConfigured: true,
    onRunAugmentation: () => alert('Running augmentation...'),
    onBuildTrace: () => alert('Building trace...'),
  },
};

export const PartialAugmentation: Story = {
  args: {
    trace: traceReady,
    augmentation: augPartial,
    deepAnalysis: deepNone,
    smallModelConfigured: true,
    onRunAugmentation: () => alert('Running augmentation...'),
    onRunDeepAnalysis: () => alert('Running deep analysis...'),
    onBuildTrace: () => alert('Building trace...'),
  },
};

export const FullPipelineHealthy: Story = {
  args: {
    trace: traceReady,
    augmentation: augFull,
    deepAnalysis: deepRan,
    smallModelConfigured: true,
    largeModelConfigured: true,
    onRunAugmentation: () => alert('Running augmentation...'),
    onRunDeepAnalysis: () => alert('Running deep analysis...'),
    onBuildTrace: () => alert('Building trace...'),
  },
};

export const DeepAnalysisStale: Story = {
  args: {
    trace: traceReady,
    augmentation: augPartial,
    deepAnalysis: deepStale,
    smallModelConfigured: true,
    largeModelConfigured: true,
    onRunAugmentation: () => alert('Running augmentation...'),
    onRunDeepAnalysis: () => alert('Running deep analysis...'),
    onBuildTrace: () => alert('Building trace...'),
  },
};

export const Augmenting: Story = {
  args: {
    trace: traceReady,
    augmentation: augPartial,
    smallModelConfigured: true,
    augmenting: true,
    onBuildTrace: () => alert('Building trace...'),
  },
};

export const DeepAnalyzing: Story = {
  args: {
    trace: traceReady,
    augmentation: augFull,
    deepAnalysis: deepRan,
    smallModelConfigured: true,
    largeModelConfigured: true,
    deepAnalyzing: true,
    onBuildTrace: () => alert('Building trace...'),
  },
};

export const NeedsBothModels: Story = {
  args: {
    trace: traceReady,
    augmentation: augNone,
    smallModelConfigured: false,
    largeModelConfigured: false,
  },
};
