import * as React from 'react';
import { useState, useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';
import { FolderOpen } from 'lucide-react';

/**
 * How the file/folder picker button behaves.
 *
 * - `'auto'`    — detect runtime: Tauri native dialog → browser File System
 *                 Access API → hidden if neither is available.
 * - `'browser'` — always use the browser File System Access API (shows
 *                 the "Allow this site…" permission prompt).
 * - `'none'`    — hide the picker button entirely. Best for remote / network
 *                 mode where the browser FS is irrelevant.
 * - `'custom'`  — show the button but delegate to `onBrowse` callback.
 *                 Use this for VS Code WebView (postMessage to extension
 *                 host) or server-side directory listing.
 */
export type PathPickerMode = 'auto' | 'browser' | 'none' | 'custom';

export interface PathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  /** Whether to pick directories (true) or files (false). Default: true */
  directory?: boolean;
  /** Controls the file picker button behavior. Default: 'auto' */
  pickerMode?: PathPickerMode;
  /** Custom browse handler — required when pickerMode is 'custom'. */
  onBrowse?: () => void;
  className?: string;
}

/**
 * PathInput — a molecule combining a text input with a native folder/file
 * picker button and a subtle drag-and-drop zone.
 *
 * On supported browsers the folder button opens the File System Access API
 * directory picker. In all environments the user can also drag a folder from
 * Finder / Explorer onto the input to populate the path.
 */
/** Detect whether we're running inside a Tauri webview. */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/** Detect whether the browser supports the File System Access API. */
function hasFSAccessAPI(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function PathInput({
  value,
  onChange,
  placeholder = '/path/to/directory',
  label,
  hint,
  disabled = false,
  directory = true,
  pickerMode = 'auto',
  onBrowse,
  className,
}: PathInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Resolve effective picker strategy ─────────────────────────
  const showPickerButton =
    pickerMode === 'browser' ||
    pickerMode === 'custom' ||
    (pickerMode === 'auto' && (isTauri() || hasFSAccessAPI()));

  // ── Pick handler (environment-aware) ──────────────────────────
  const handlePickFolder = useCallback(async () => {
    // Custom handler takes priority
    if (pickerMode === 'custom') {
      onBrowse?.();
      return;
    }

    // Tauri native dialog
    if (isTauri()) {
      try {
        // Dynamic import so the module is only loaded inside Tauri
        // We use a variable to bypass Vite's static analysis
        const tauriDialog = '@tauri-apps/api/dialog';
        const { open } = await import(/* @vite-ignore */ tauriDialog);
        const selected = await open({ directory, multiple: false });
        if (typeof selected === 'string') onChange(selected);
      } catch {
        // User cancelled or Tauri API unavailable
      }
      return;
    }

    // Browser File System Access API
    // NOTE: This only returns the folder/file NAME, not the full path.
    // In 'auto' mode this branch is unreachable (button hidden).
    // Only reached when pickerMode is explicitly 'browser'.
    try {
      if ('showDirectoryPicker' in window && directory) {
        const handle = await (window as any).showDirectoryPicker({ mode: 'read' });
        onChange(handle.name); // Browser only gives the name, not full path
      } else if ('showOpenFilePicker' in window && !directory) {
        const [handle] = await (window as any).showOpenFilePicker({ mode: 'read' });
        onChange(handle.name);
      }
    } catch {
      // User cancelled — ignore
    }
  }, [directory, onChange, pickerMode, onBrowse]);

  // ── Drag & drop ──────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    // Try to get the path from the dropped items
    const items = e.dataTransfer.items;
    if (items?.length) {
      const item = items[0];
      // webkitGetAsEntry gives us the full relative path in some browsers
      const entry = (item as any).webkitGetAsEntry?.();
      if (entry) {
        onChange(entry.fullPath?.replace(/^\//, '') || entry.name);
        return;
      }
    }

    // Fallback: use file list
    const files = e.dataTransfer.files;
    if (files?.length) {
      // For directories dragged from Finder, the path comes through as the name
      const file = files[0];
      // webkitRelativePath or name
      onChange((file as any).path || file.name);
    }
  }, [disabled, onChange]);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative flex items-center rounded-md border transition-all',
          isDragOver
            ? 'border-primary bg-primary-muted/10 ring-2 ring-primary/30'
            : 'border-border bg-surface-raised',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent px-3 py-2 text-sm text-text placeholder:text-text-subtle',
            'focus:outline-none',
            'min-w-0',
          )}
        />
        {showPickerButton && (
          <button
            type="button"
            onClick={handlePickFolder}
            disabled={disabled}
            title={directory ? 'Browse for folder' : 'Browse for file'}
            className={cn(
              'flex-shrink-0 flex items-center justify-center px-2.5 py-2',
              'text-text-muted hover:text-primary transition-colors',
              'border-l border-border',
              disabled && 'pointer-events-none',
            )}
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        )}
      </div>
      {hint && (
        <p className="text-xs text-text-subtle">{hint}</p>
      )}
      {isDragOver && (
        <p className="text-xs text-primary font-medium animate-pulse">
          Drop to set path
        </p>
      )}
    </div>
  );
}
