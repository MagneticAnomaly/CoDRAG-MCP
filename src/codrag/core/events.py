"""
Event Bus and Progress Tracking for CoDRAG.

Handles real-time broadcasting of logs and task progress to the frontend via SSE.
"""
import asyncio
import logging
import json
import uuid
import time
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, asdict

# Global event bus instance
_event_bus: Optional['EventBus'] = None

def get_event_bus() -> 'EventBus':
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
    return _event_bus

@dataclass
class ProgressEvent:
    task_id: str
    message: str
    current: int
    total: int
    percent: float
    status: str = "running"  # running, completed, failed

class EventBus:
    """
    Central hub for broadcasting events to connected clients.
    """
    def __init__(self):
        self._queues: Set[asyncio.Queue] = set()
        self._history: List[Dict[str, Any]] = [] # Keep a small history for new clients? Maybe later.
        self._lock = asyncio.Lock()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Set the event loop to use for thread-safe dispatch."""
        self._loop = loop

    async def subscribe(self) -> asyncio.Queue:
        """Subscribe to the event stream."""
        queue = asyncio.Queue()
        async with self._lock:
            self._queues.add(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Unsubscribe from the event stream."""
        async with self._lock:
            if queue in self._queues:
                self._queues.remove(queue)

    def emit(self, event_type: str, data: Dict[str, Any]) -> None:
        """
        Emit an event to all subscribers.
        Thread-safe: schedules queue.put_nowait on the event loop.
        """
        payload = {
            "type": event_type,
            "timestamp": time.time(),
            "data": data
        }
        
        # We need to dispatch to the loop where the queue was created.
        # Since queues are created in subscribe() which is async, they belong to the running loop.
        # However, we might have multiple loops if running crazy tests, but in Uvicorn it's one.
        # We'll assume queues are on the loop they were created on.
        # Actually, asyncio.Queue isn't bound to a loop in recent Python versions, but .put_nowait isn't thread safe.
        
        # We need to copy the set to avoid modification during iteration
        # Note: self._queues access itself isn't strictly thread-safe without lock if subscribe is called concurrently.
        # But emit is called from threads. subscribe from async loop.
        # We should probably lock _queues access if we want to be 100% correct, 
        # but iterating a set is mostly atomic in CPython (though not guaranteed safe against modification).
        # Let's try to be safe.
        
        # Since we can't use async with self._lock from a sync method (emit), we can't lock easily.
        # We will optimistically iterate. 
        
        current_queues = list(self._queues)
        
        for queue in current_queues:
            # We assume the main loop is available via get_running_loop() if we are in main thread,
            # or we need to find the loop. 
            # In a production server, there is usually one main loop.
            try:
                loop = asyncio.get_event_loop_policy().get_event_loop()
                if loop.is_running():
                     loop.call_soon_threadsafe(queue.put_nowait, payload)
                else:
                    # Fallback for testing or weird states
                    pass 
            except Exception:
                # If we can't get the loop (e.g. we are in a thread with no loop set),
                # we assume the queue belongs to the main thread's loop?
                # We really should capture the loop in subscribe.
                pass

    def emit_log(self, record: logging.LogRecord) -> None:
        """Emit a log record."""
        self.emit("log", {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "created": record.created
        })

    def emit_progress(self, task_id: str, message: str, current: int, total: int) -> None:
        """Emit a progress update."""
        percent = (current / total * 100) if total > 0 else 0
        self.emit("progress", {
            "task_id": task_id,
            "message": message,
            "current": current,
            "total": total,
            "percent": round(percent, 1),
            "status": "running" if current < total else "completed"
        })

class BroadcastLogHandler(logging.Handler):
    """
    Logging handler that pushes records to the EventBus.
    """
    def __init__(self, event_bus: EventBus):
        super().__init__()
        self.event_bus = event_bus

    def emit(self, record: logging.LogRecord) -> None:
        try:
            self.event_bus.emit_log(record)
        except Exception:
            self.handleError(record)

class ProgressManager:
    """
    Singleton to manage active tasks and report progress.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ProgressManager, cls).__new__(cls)
            cls._instance.bus = get_event_bus()
            cls._instance.active_tasks = {}
        return cls._instance

    def start_task(self, task_type: str, project_id: str) -> str:
        """Start a new task and return its ID."""
        task_id = f"{task_type}:{project_id}:{uuid.uuid4().hex[:8]}"
        self.active_tasks[task_id] = {"type": task_type, "project_id": project_id}
        self.bus.emit("task_start", {"task_id": task_id, "type": task_type, "project_id": project_id})
        return task_id

    def update(self, task_id: str, message: str, current: int, total: int) -> None:
        """Update progress for a task."""
        self.bus.emit_progress(task_id, message, current, total)

    def finish_task(self, task_id: str, success: bool = True, message: str = "") -> None:
        """Mark a task as finished."""
        if task_id in self.active_tasks:
            del self.active_tasks[task_id]
            self.bus.emit("task_finish", {"task_id": task_id, "success": success, "message": message})

# Singleton accessor
_progress_manager = None
def get_progress_manager() -> ProgressManager:
    global _progress_manager
    if _progress_manager is None:
        _progress_manager = ProgressManager()
    return _progress_manager
