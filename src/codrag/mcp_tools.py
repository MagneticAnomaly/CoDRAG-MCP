"""
Shared tool definitions for CoDRAG MCP servers.
"""

TOOLS = [
    {
        "name": "codrag_status",
        "description": "Get CoDRAG index status and daemon health. Returns index stats, build state, and configuration.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "codrag_build",
        "description": "Trigger an index build. Returns immediately; build runs async in background. Use codrag_status to check progress.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "full": {
                    "type": "boolean",
                    "description": "Force full rebuild (ignore cache). Default: false (incremental).",
                    "default": False,
                },
            },
            "required": [],
        },
    },
    {
        "name": "codrag_search",
        "description": "Search the CoDRAG index with a semantic query. Returns ranked code/doc chunks.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Natural language search query.",
                },
                "k": {
                    "type": "integer",
                    "description": "Number of results to return. Default: 8.",
                    "default": 8,
                },
                "min_score": {
                    "type": "number",
                    "description": "Minimum similarity score (0-1). Default: 0.15.",
                    "default": 0.15,
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "codrag_context",
        "description": "Get assembled context for LLM prompt injection. Returns formatted chunks optimized for token efficiency. Optionally compress context via CLaRa sidecar.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Natural language query describing what context you need.",
                },
                "k": {
                    "type": "integer",
                    "description": "Number of chunks to include. Default: 5.",
                    "default": 5,
                },
                "max_chars": {
                    "type": "integer",
                    "description": "Maximum characters in assembled context. Default: 6000.",
                    "default": 6000,
                },
                "trace_expand": {
                    "type": "boolean",
                    "description": "Follow trace edges (imports, calls) to include structurally related code. Requires trace index to be built. Default: false.",
                    "default": False,
                },
                "compression": {
                    "type": "string",
                    "description": "Compression mode: 'none' (default) or 'clara' (CLaRa sidecar).",
                    "enum": ["none", "clara"],
                    "default": "none",
                },
                "compression_level": {
                    "type": "string",
                    "description": "Compression aggressiveness: 'light', 'standard' (default), or 'aggressive'.",
                    "enum": ["light", "standard", "aggressive"],
                    "default": "standard",
                },
                "compression_timeout_s": {
                    "type": "number",
                    "description": "Hard timeout for CLaRa compression in seconds. Default: 30.",
                    "default": 30.0,
                },
            },
            "required": ["query"],
        },
    },
]
