import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { DashboardLayout, GridLayoutItem, PanelDefinition } from '../../types/layout';
import { toGridLayout, fromGridLayout, computeGridCols, BASE_COLS } from '../../types/layout';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export interface DashboardGridProps {
  layout: DashboardLayout;
  panelDefinitions?: PanelDefinition[];
  onLayoutChange: (layout: DashboardLayout) => void;
  onColsChange?: (prevCols: number, newCols: number) => void;
  children: ReactNode;
  className?: string;
  rowHeight?: number;
  margin?: [number, number];
  maxColWidth?: number;
}

export function DashboardGrid({
  layout,
  panelDefinitions,
  onLayoutChange,
  onColsChange,
  children,
  className,
  rowHeight = 20,
  margin = [24, 24],
  maxColWidth = 120,
}: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const prevColsRef = useRef<number>(BASE_COLS);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute dynamic column count from measured width
  const cols = useMemo(
    () => computeGridCols(width, margin[0], maxColWidth),
    [width, margin, maxColWidth],
  );

  // Detect column count changes and notify parent
  useEffect(() => {
    const prev = prevColsRef.current;
    if (prev !== cols) {
      prevColsRef.current = cols;
      onColsChange?.(prev, cols);
    }
  }, [cols, onColsChange]);

  // Convert our layout format to react-grid-layout format
  const gridLayout = toGridLayout(layout, panelDefinitions);

  const handleLayoutCommit = useCallback(
    (newLayout: Layout[]) => {
      const items: GridLayoutItem[] = newLayout.map((item) => {
        const isResizableItem = (item as any).isResizable;
        const existing = layout.panels.find((p) => p.id === item.i);

        return {
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: isResizableItem === false && existing && !existing.collapsed ? existing.height : item.h,
          minH: item.minH,
          isResizable: isResizableItem,
        };
      });
      const updated = fromGridLayout(layout, items);
      onLayoutChange(updated);
    },
    [layout, onLayoutChange]
  );

  return (
    <div
      ref={containerRef}
      className={cn('codrag-dashboard-grid w-full overflow-x-hidden', className)}
    >
      <GridLayout
        className="layout"
        layout={gridLayout}
        cols={cols}
        rowHeight={rowHeight}
        width={width}
        margin={margin}
        containerPadding={margin}
        onLayoutChange={handleLayoutCommit}
        onDragStop={handleLayoutCommit}
        onResizeStop={handleLayoutCommit}
        draggableHandle=".drag-handle"
        isResizable={true}
        resizeHandles={['s', 'e', 'se']}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
      >
        {children}
      </GridLayout>
    </div>
  );
}
