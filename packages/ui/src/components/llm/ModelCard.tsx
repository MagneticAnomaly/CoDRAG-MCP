import { Button } from '../primitives/Button';
import { Select } from '../primitives/Select';
import { cn } from '../../lib/utils';
import type { SavedEndpoint, EndpointTestResult, ModelSource } from '../../types';
import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, Download, Cloud, Server, Database, RefreshCw } from 'lucide-react';

export interface ModelCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  
  // Current config
  enabled?: boolean;
  source?: ModelSource;
  endpoint?: string;
  model?: string;
  
  // Endpoint options
  endpoints: SavedEndpoint[];
  onEndpointChange?: (endpointId: string) => void;
  
  // Model selection
  availableModels?: string[];
  onModelChange?: (model: string) => void;
  onRefreshModels?: () => void;
  loadingModels?: boolean;
  
  // HuggingFace download (optional)
  hfEnabled?: boolean;
  hfRepoId?: string;
  hfDownloaded?: boolean;
  hfDownloadProgress?: number;
  onHFDownload?: () => void;
  onSourceChange?: (source: ModelSource) => void;
  
  // Status
  status?: 'connected' | 'disconnected' | 'not-configured' | 'downloading';
  onTest?: () => void;
  testResult?: EndpointTestResult;
  testingConnection?: boolean;
  
  className?: string;
}

export function ModelCard({
  title,
  description,
  icon,
  source = 'endpoint',
  endpoint,
  model,
  endpoints,
  onEndpointChange,
  availableModels = [],
  onModelChange,
  onRefreshModels,
  loadingModels = false,
  hfEnabled = false,
  hfRepoId,
  hfDownloaded = false,
  hfDownloadProgress,
  onHFDownload,
  onSourceChange,
  status = 'not-configured',
  onTest,
  testResult,
  testingConnection = false,
  className,
}: ModelCardProps) {
  const isActive = status === 'connected';
  const isDownloading = status === 'downloading';
  
  return (
    <div className={cn(
      'codrag-card rounded-lg border bg-surface p-6 transition-colors',
      isActive ? 'border-success/50 shadow-[0_0_15px_rgba(var(--success),0.1)]' : 'border-border',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-raised text-primary">
            {icon || <Database className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">{title}</h3>
            <p className="text-sm text-text-muted">{description}</p>
          </div>
        </div>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-medium border",
          status === 'connected' ? "bg-success-muted text-success border-success/20" :
          status === 'disconnected' ? "bg-error-muted text-error border-error/20" :
          status === 'downloading' ? "bg-info-muted text-info border-info/20" :
          "bg-surface-raised text-text-muted border-border"
        )}>
          {status === 'connected' ? 'Connected' :
           status === 'disconnected' ? 'Disconnected' :
           status === 'downloading' ? 'Downloading...' : 'Not Configured'}
        </span>
      </div>
      
      {/* Source Toggle (if HF enabled) */}
      {hfEnabled && onSourceChange && (
        <div className="mb-6 p-1 bg-surface-raised rounded-lg flex gap-1 border border-border">
          <button
            onClick={() => onSourceChange('endpoint')}
            className={cn(
              'flex-1 px-3 py-2 text-xs rounded-md transition-all font-medium flex items-center justify-center gap-2',
              source === 'endpoint'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-surface/50'
            )}
          >
            <Server className="w-3 h-3" />
            Use Endpoint
          </button>
          <button
            onClick={() => onSourceChange('huggingface')}
            className={cn(
              'flex-1 px-3 py-2 text-xs rounded-md transition-all font-medium flex items-center justify-center gap-2',
              source === 'huggingface'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-surface/50'
            )}
          >
            <Cloud className="w-3 h-3" />
            Download from HF
          </button>
        </div>
      )}
      
      {/* Endpoint Mode */}
      {source === 'endpoint' && (
        <div className="space-y-4">
          {/* Endpoint Selector */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Endpoint
            </label>
            <Select
              value={endpoint || ''}
              onChange={(e) => onEndpointChange?.(e.target.value || '')}
              placeholder="Select endpoint..."
              options={[
                ...endpoints.map((ep) => ({
                  value: ep.id,
                  label: `${ep.name} (${ep.provider})`,
                })),
                ...(endpoint ? [{ value: '__disconnect__', label: '✕  Disconnect' }] : []),
              ]}
              className="w-full"
            />
          </div>
          
          {/* Model Selector */}
          {endpoint && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Model
              </label>
              <div className="flex gap-2">
                <Select
                  value={model || ''}
                  onChange={(e) => onModelChange?.(e.target.value)}
                  placeholder="Select model..."
                  options={availableModels.map((m) => ({ value: m, label: m }))}
                  className="w-full flex-1"
                />
                {onRefreshModels && (
                  <Button
                    onClick={onRefreshModels}
                    disabled={loadingModels}
                    variant="outline"
                    className="bg-surface-raised hover:bg-border border-border h-full aspect-square p-0 w-[38px]"
                    title="Refresh Models"
                  >
                    <RefreshCw className={cn("w-4 h-4", loadingModels && "animate-spin")} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* HuggingFace Mode */}
      {source === 'huggingface' && hfEnabled && (
        <div className="space-y-4">
          <div className="p-4 bg-surface-raised rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text-muted">Model Repository</span>
              <code className="text-xs text-primary bg-primary-muted/20 px-1.5 py-0.5 rounded">{hfRepoId}</code>
            </div>
            
            {hfDownloaded ? (
              <div className="flex items-center gap-2 text-sm text-success font-medium bg-success-muted/10 p-3 rounded border border-success-muted/20">
                <CheckCircle className="w-4 h-4" />
                Downloaded & Ready
              </div>
            ) : isDownloading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Downloading model files...</span>
                  <span>{hfDownloadProgress ? `${Math.round(hfDownloadProgress * 100)}%` : '...'}</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-info transition-all duration-300"
                    style={{ width: `${(hfDownloadProgress || 0) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button
                onClick={onHFDownload}
                className="w-full"
                icon={Download}
              >
                Download Model
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Test Connection */}
      {onTest && source === 'endpoint' && endpoint && (
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            size="sm"
            variant="secondary"
            onClick={onTest}
            loading={testingConnection}
            className="w-full bg-surface-raised hover:bg-border border-border text-text"
          >
            Test Connection
          </Button>
          {testResult && (
            <div className={cn(
              'mt-3 p-3 rounded-md text-xs border flex items-start gap-2',
              testResult.success 
                ? 'bg-success-muted/10 text-success border-success-muted/20' 
                : 'bg-error-muted/10 text-error border-error-muted/20'
            )}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              {testResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
