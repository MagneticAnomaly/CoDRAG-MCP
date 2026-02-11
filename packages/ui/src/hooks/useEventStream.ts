import { useState, useEffect, useRef, useCallback } from 'react';
import type { LogEntry, TaskProgress } from '../types';

export interface UseEventStreamResult {
  logs: LogEntry[];
  tasks: Record<string, TaskProgress>;
  connected: boolean;
  clearLogs: () => void;
}

export function useEventStream(url: string, maxLogs: number = 1000): UseEventStreamResult {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Record<string, TaskProgress>>({});
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data);
      const { type, data } = payload;

      if (type === 'log') {
        setLogs(prev => {
          const next = [...prev, data as LogEntry];
          if (next.length > maxLogs) {
            return next.slice(next.length - maxLogs);
          }
          return next;
        });
      } else if (type === 'progress') {
        const progress = data as TaskProgress;
        setTasks(prev => {
          // If task is completed or failed, we might want to keep it for a bit or update status
          // For now just update the record
          return { ...prev, [progress.task_id]: progress };
        });
      } else if (type === 'task_finish') {
         // Optionally handle explicit finish event if needed, 
         // though 'progress' with status='completed' covers most cases.
         // If we get an explicit finish with result info, update the task.
         const { task_id, success, message } = data;
         setTasks(prev => {
             const existing = prev[task_id];
             if (!existing) return prev;
             return { 
                 ...prev, 
                 [task_id]: { 
                     ...existing, 
                     status: success ? 'completed' : 'failed',
                     message: message || existing.message,
                     percent: 100,
                     current: existing.total
                 } 
             };
         });
      }
    } catch (e) {
      console.error('Failed to parse SSE event:', e);
    }
  }, [maxLogs]);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    // Close existing if any (e.g. connecting/closed state)
    eventSourceRef.current?.close();

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      console.log(`[EventStream] Connected to ${url}`);
    };

    es.onmessage = handleEvent;

    es.onerror = (_e) => {
      setConnected(false);
      es.close();
      
      // Retry with backoff
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [url, handleEvent]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      clearTimeout(retryTimeoutRef.current);
    };
  }, [connect]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, tasks, connected, clearLogs };
}
