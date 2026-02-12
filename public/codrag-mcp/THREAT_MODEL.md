# Threat Model

This document outlines the security architecture and threat model for the CoDRAG MCP integration.

## Architecture Components

1.  **IDE / Agent (The Client)**: Untrusted input source (user prompts).
2.  **MCP Server**: The interface layer running `codrag-mcp`.
3.  **CoDRAG Daemon (The Engine)**: The local background process managing the database.
4.  **Local Filesystem**: The user's code repositories.
5.  **External LLMs (Optional)**: Cloud APIs if configured (OpenAI, Anthropic).

## Trust Boundaries

-   **IDE ↔ MCP Server**: Uses standard IO (stdio). The IDE is trusted to invoke the MCP server correctly.
-   **MCP Server ↔ CoDRAG Daemon**: Uses HTTP (localhost:8400). The Daemon trusts requests from localhost.
-   **CoDRAG Daemon ↔ Filesystem**: The Daemon has read access to configured project directories.

## Key Risks & Mitigations

### 1. Prompt Injection via Repository Content
**Risk**: A malicious repository contains files (e.g., comments) designed to manipulate the LLM when retrieved as context.
**Mitigation**: CoDRAG treats all repository content as untrusted data. Context chunks are clearly delimited when presented to the LLM. The Model (LLM) is responsible for safety alignment.

### 2. Unauthorized Local Access
**Risk**: Another process on the user's machine queries the CoDRAG Daemon (port 8400) to steal code context.
**Mitigation**: The CoDRAG Daemon binds to `127.0.0.1` by default, restricting access to the local machine. In Team/Enterprise tiers, network binding is authenticated via API keys or mTLS.

### 3. Supply Chain Attacks
**Risk**: A compromised `codrag-mcp` package or CoDRAG binary.
**Mitigation**:
-   Official binaries are code-signed (Apple Notarization / Windows EV).
-   The `codrag-mcp` package is minimal and has zero runtime dependencies (relies on the local Daemon).

### 4. Data Exfiltration via LLM
**Risk**: Sensitive code sent to a cloud LLM.
**Mitigation**:
-   **Local-First Default**: CoDRAG uses local embeddings (Ollama) by default.
-   **Explicit Opt-In**: Users must explicitly configure cloud API keys for external LLMs.
-   **BYOK**: CoDRAG does not proxy cloud LLM traffic through its own servers; it connects directly from the user's machine to the provider.

## Recommendations

-   Always keep the CoDRAG Desktop App updated.
-   Use `127.0.0.1` for the Daemon host unless you are in a secured Team VPN environment.
-   Audit your "Include" patterns to ensure sensitive files (like `.env` or distinct secrets) are not indexed, although CoDRAG excludes common secret patterns by default.
