# MCP Onboarding Guide

This guide explains how to integrate CoDRAG with AI coding assistants using the Model Context Protocol (MCP).

## What is MCP?

The Model Context Protocol (MCP) is a standard that allows AI assistants to access external tools and data sources. CoDRAG provides an MCP server that gives your AI assistant semantic code search and context assembly capabilities.

## Supported Clients

CoDRAG's MCP server works with:

- **Claude Desktop** (Anthropic)
- **Windsurf** (Codeium)
- **Cursor** (with MCP support)
- **Any MCP-compatible client**

## Quick Setup

### 1. Start CoDRAG Daemon

First, ensure CoDRAG is running:

```bash
codrag serve
```

### 2. Configure Your AI Assistant

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "codrag": {
      "command": "codrag",
      "args": ["mcp"],
      "env": {
        "CODRAG_API_URL": "http://127.0.0.1:8400"
      }
    }
  }
}
```

#### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "codrag": {
      "command": "codrag",
      "args": ["mcp"],
      "env": {
        "CODRAG_API_URL": "http://127.0.0.1:8400"
      }
    }
  }
}
```

### 3. Restart Your AI Assistant

After updating the configuration, restart your AI assistant to load the MCP server.

## Available Tools

CoDRAG exposes these tools to your AI assistant:

### `codrag_status`

Check the status of the current project's index.

```
Returns: Index status including chunk count, model, last build time
```

### `codrag_search`

Search for relevant code chunks.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | Natural language search query |
| `k` | integer | 5 | Number of results to return (max 50) |
| `min_score` | float | 0.0 | Minimum similarity score threshold |

```
Returns: List of matching code chunks with file paths, line numbers, and previews
```

### `codrag`

Get assembled context for LLM injection.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | What context you need |
| `k` | integer | 5 | Number of chunks to include (max 50) |
| `max_chars` | integer | 6000 | Maximum context length (max 20000) |

```
Returns: Formatted context string with source attribution
```

### `codrag_build`

Trigger an index rebuild.

```
Returns: Build status (started, already running, etc.)
```

## Example Prompts

Once MCP is configured, your AI assistant can use CoDRAG automatically. Try prompts like:

### Code Search
> "Search for how authentication is implemented in this project"

### Context Assembly
> "Get context about the database models so you can help me add a new table"

### Understanding Architecture
> "What files are involved in the API routing?"

## Project Selection

### Automatic Detection

CoDRAG attempts to detect the current project based on your working directory. If you're inside a registered project's directory, it will be selected automatically.

### Manual Selection

If automatic detection fails or you want a different project:

```bash
# List projects
codrag list

# Set default project
export CODRAG_PROJECT_ID="proj_abc123"
```

Or configure in your MCP server env:

```json
{
  "env": {
    "CODRAG_API_URL": "http://127.0.0.1:8400",
    "CODRAG_PROJECT_ID": "proj_abc123"
  }
}
```

## Direct MCP Mode

For single-repository use without the daemon, CoDRAG supports direct MCP mode:

```json
{
  "mcpServers": {
    "codrag": {
      "command": "codrag",
      "args": ["mcp", "--direct", "--repo", "/path/to/repo"],
      "env": {}
    }
  }
}
```

This embeds the index directly in the MCP server process—simpler but doesn't support multiple projects or the dashboard.

## Troubleshooting

### "DAEMON_UNAVAILABLE"

The CoDRAG daemon is not running or not reachable.

**Solution:**
```bash
# Check if daemon is running
curl http://127.0.0.1:8400/health

# Start if needed
codrag serve
```

### "PROJECT_NOT_FOUND"

No project is selected or the project ID is invalid.

**Solution:**
```bash
# List available projects
codrag list

# Add a project if needed
codrag add /path/to/repo
```

### "PROJECT_SELECTION_AMBIGUOUS"

Multiple projects match the current directory.

**Solution:**
- Set `CODRAG_PROJECT_ID` explicitly
- Or navigate to a more specific directory

### "INDEX_NOT_BUILT"

The project's index hasn't been built yet.

**Solution:**
```bash
codrag build
```

Or ask your AI assistant: "Build the CoDRAG index for this project"

### Tools Not Appearing

If CoDRAG tools don't appear in your AI assistant:

1. Check the MCP configuration path is correct
2. Verify the `codrag` command is in your PATH
3. Check assistant logs for MCP errors
4. Restart the assistant after config changes

## Best Practices

### 1. Keep Index Fresh

Enable auto-rebuild to keep your index up-to-date:

```bash
codrag watch start
```

### 2. Add a Primer File

Create `AGENTS.md` in your repo root with project context:

```markdown
# Project Context

## Tech Stack
- Python 3.10, FastAPI
- PostgreSQL, SQLAlchemy

## Architecture
- src/api/ - REST endpoints
- src/core/ - Business logic
- src/models/ - Database models
```

### 3. Tune Search Parameters

For large codebases, adjust search parameters:

```bash
# Increase result count for comprehensive searches
codrag config set default_k 10

# Lower threshold for broader matches
codrag config set default_min_score 0.1
```

### 4. Exclude Irrelevant Files

Keep the index focused:

```bash
codrag config set exclude_globs '["**/node_modules/**", "**/dist/**", "**/*.min.js"]'
```

## Security Considerations

### Local-First

CoDRAG runs entirely locally. Your code never leaves your machine:

- Index is stored in `~/.codrag/` or `.codrag/` in your repo
- MCP communication happens over localhost
- No external API calls (except to local Ollama)

### Network Mode

If running CoDRAG in network mode (not default):

- Use HTTPS
- Set strong API keys
- Restrict bind address

## Related Documentation

- [Getting Started](./GETTING_STARTED.md) — Basic installation and usage
- [API Reference](./API.md) — HTTP API documentation
- [Error Codes](./ERROR_CODES.md) — Error handling reference
- [Budgets Policy](./BUDGETS_POLICY.md) — Understanding limits
