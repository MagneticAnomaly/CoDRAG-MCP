# Unified Integration Strategy: The "Context MVC"

## Concept
We are moving away from building custom plugins for every tool. Instead, we treat **CoDRAG as the Model** and **External Tools as the View/Controller**.

This leverages the **Model Context Protocol (MCP)** as the standard interface.

### The MVC Architecture

1.  **Model (CoDRAG Daemon)**
    *   **Responsibility**: Source of Truth.
    *   **Data**: Trace Graph, File Index, Search Results, Context Chunks.
    *   **Interface**: MCP Server (JSON-RPC).
    *   **Deployment**: Local Daemon (`codrag serve`).

2.  **View / Controller (The Client)**
    *   **Examples**: Cursor, Windsurf, Claude Desktop, **Gemini CLI Desktop**, **Qwen Code**.
    *   **Responsibility**: User Interface, Interaction, LLM Inference.
    *   **Action**: Connects to CoDRAG via MCP. Queries context. Displays results.

## Strategy: "Verified Views"

Instead of "building plugins," our integration strategy is to **verify and document Views**.

We categorize potential integrations into two tiers:

### Tier 1: Verified Views (Marketing Focus)
These are tools we actively test, document, and promote on the verified integrations page.
*   **Criteria**:
    *   Native MCP Client support (zero-code integration).
    *   High user quality / product fit.
    *   Local-first alignment.
*   **Current Targets**:
    *   **Claude Desktop** (Reference implementation)
    *   **CoDRAG VS Code Extension** (First-party IDE integration)
    *   **Gemini CLI Desktop** (The "Open Source Claude Desktop")
    *   **Qwen Code** (The "Terminal Agent" - via Qwen-Agent MCP support)

### Tier 2: Community Views (Out of Scope for Core Team)
Tools that *could* work but require high effort or custom adapters. We do not build these. We wait for them to add native MCP support.
*   **Examples**: VS Code (without plugin), JetBrains, AionUi.
*   **Action**: Do nothing. Wait for them to become Tier 1 by implementing MCP.

## Implementation Plan

1.  **CoDRAG is ready**: The daemon already speaks MCP.
2.  **Gemini CLI Desktop**:
    *   *Action*: Verify `codrag` works as a configured MCP server.
    *   *Deliverable*: "How to use CoDRAG with Gemini CLI Desktop" guide.
3.  **Qwen Code**:
    *   *Action*: Verify Qwen Agent's MCP client capabilities.
    *   *Deliverable*: "How to power Qwen Code with CoDRAG context" guide.

## Marketing Message
"CoDRAG is the Universal Context Model. Bring your own View."
