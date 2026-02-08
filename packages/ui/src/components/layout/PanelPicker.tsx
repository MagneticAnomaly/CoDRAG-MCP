import { useState } from 'react';
import { Check, ClipboardCopy, ClipboardPaste, Columns3, Plus, RotateCcw } from 'lucide-react';
import type { DashboardLayout, PanelDefinition } from '../../types/layout';
import { cn } from '../../lib/utils';
import { Button } from '../primitives/Button';

export interface PanelPickerProps {
  layout: DashboardLayout;
  panelDefinitions: PanelDefinition[];
  onTogglePanel: (panelId: string) => void;
  onResetLayout: () => void;
  onRefitLayout?: () => void;
  onCopyLayout?: () => void;
  onPasteLayout?: () => void;
  className?: string;
}

export function PanelPicker({
  layout,
  panelDefinitions,
  onTogglePanel,
  onResetLayout,
  onRefitLayout,
  onCopyLayout,
  onPasteLayout,
  className,
}: PanelPickerProps) {
  const [open, setOpen] = useState(false);

  const visibleIds = new Set(
    layout.panels.filter((p) => p.visible).map((p) => p.id)
  );

  const handleToggle = (panelId: string) => {
    onTogglePanel(panelId);
  };

  const handleReset = () => {
    if (window.confirm('Reset layout to defaults? This will restore all panels to their original positions.')) {
      onResetLayout();
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        onClick={() => setOpen(!open)}
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-haspopup="true"
        icon={Plus}
      >
        Panels
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-border">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Toggle Panels
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {panelDefinitions.map((def) => {
                const isVisible = visibleIds.has(def.id);
                const Icon = def.icon;

                return (
                  <Button
                    key={def.id}
                    onClick={() => handleToggle(def.id)}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start rounded-none h-auto py-2 px-3',
                      isVisible ? 'text-text' : 'text-text-muted'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="flex-1 text-left truncate text-sm">{def.title}</span>
                    {isVisible && (
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                    )}
                  </Button>
                );
              })}
            </div>

            <div className="p-2 border-t border-border flex flex-col gap-1">
              {onRefitLayout && (
                <Button
                  onClick={() => { onRefitLayout(); setOpen(false); }}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-text-muted hover:text-text hover:bg-muted"
                  icon={Columns3}
                >
                  Refit Layout
                </Button>
              )}
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="w-full justify-center text-text-muted hover:text-text hover:bg-muted"
                icon={RotateCcw}
              >
                Reset Layout
              </Button>
              {onCopyLayout && (
                <Button
                  onClick={() => { onCopyLayout(); setOpen(false); }}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-text-muted hover:text-text hover:bg-muted"
                  icon={ClipboardCopy}
                >
                  Copy Layout
                </Button>
              )}
              {onPasteLayout && (
                <Button
                  onClick={() => { onPasteLayout(); setOpen(false); }}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-text-muted hover:text-text hover:bg-muted"
                  icon={ClipboardPaste}
                >
                  Paste Layout
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
