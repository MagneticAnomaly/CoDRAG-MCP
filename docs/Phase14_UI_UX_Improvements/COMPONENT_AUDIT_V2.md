# Component Audit V2: Semantic Realignment

## Core Philosophy
We are distinguishing between two distinct modes of "Context":
1.  **Knowledge Base (The "Index")**: Cross-referencing plans, documentation, design docs, and code. This is "Long-Term Recall".
2.  **Code Graph (The "Trace")**: The structural understanding of the code. This is "Current Scope" & "Reasoning" (imports, calls, inheritance).

## Component Analysis & Recommendations

### 1. Index Status (`id: status`)
*   **Current Title:** Index Status
*   **Purpose:** Shows if the vector index is loaded and fresh.
*   **Critique:** "Index" is generic.
*   **Recommendation:**
    *   **Rename to:** **"Knowledge Base Status"**
    *   **Tooltip:** "Status of your vector search index (Docs + Code)."

### 2. Build (`id: build`)
*   **Current Title:** Build
*   **Purpose:** Triggers the heavy RAG indexing process.
*   **Critique:** "Build" sounds like compiling code. It's actually indexing knowledge.
*   **Recommendation:**
    *   **Rename to:** **"Rebuild Knowledge Base"**
    *   **Clarification:** Make it clear this updates the *Search* capabilities, not the Trace.

### 3. Index Scope (`id: roots`)
*   **Current Title:** Index Scope
*   **Purpose:** Selects which folders are included in RAG.
*   **Critique:** This is the primary control for "Cross-referencing plans with code".
*   **Recommendation:**
    *   **Rename to:** **"Knowledge Sources"**
    *   **Description:** "Select documentation, plans, and code folders to cross-reference."
    *   **Action:** This should be prominent. Users need to know they can add `docs/` here.

### 4. Search (`id: search`) & Search Results (`id: results`)
*   **Current Title:** Search / Search Results
*   **Purpose:** Semantic RAG search.
*   **Recommendation:**
    *   **Rename to:** **"Knowledge Query"** & **"Retrieved Context"**
    *   **Semantics:** Emphasize this is searching *meanings* across the Knowledge Base.

### 5. Context Options (`id: context-options`) & Context Output (`id: context-output`)
*   **Current Title:** Context Options / Output
*   **Purpose:** Assembling the final prompt.
*   **Recommendation:**
    *   **Rename to:** **"Context Assembler"** & **"Prompt Buffer"**
    *   **Semantics:** "Assemble" implies gathering pieces from both Knowledge and Trace.

### 6. Symbol Browser (`id: trace`)
*   **Current Title:** Symbol Browser
*   **Purpose:** Navigating the code graph (Trace).
*   **Critique:** "Symbol" is technical. "Trace" is the engine name.
*   **Recommendation:**
    *   **Rename to:** **"Code Graph Explorer"**
    *   **Description:** "Navigate the structural relationships (calls, imports) of your code."
    *   **Distinction:** This is for *understanding structure*, not searching text.

### 7. Trace Coverage (`id: trace-coverage`)
*   **Current Title:** Trace Coverage
*   **Purpose:** Shows which files are parsed into the graph.
*   **Critique:** "Coverage" sounds like unit tests.
*   **Recommendation:**
    *   **Rename to:** **"AI Scope Status"** or **"Graph Health"**
    *   **Description:** "Shows what code the AI can structurally 'see' and reason about."

### 8. File Watcher (`id: watch`)
*   **Current Title:** File Watcher
*   **Purpose:** Auto-rebuild status.
*   **Recommendation:**
    *   **Rename to:** **"Live Sync"**
    *   **Hide:** Merge this indicator into the **Knowledge Base Status** card. It doesn't need a whole panel.

### 9. LLM Services (`id: llm-status`)
*   **Current Title:** LLM Services
*   **Purpose:** Connection to Ollama/OpenAI.
*   **Recommendation:**
    *   **Rename to:** **"AI Gateway"**
    *   **Hide:** Move to Settings. Once configured, you rarely look at it.

### 10. Settings (`id: settings`)
*   **Current Title:** Settings
*   **Purpose:** Global configuration (Globs, Max File Size).
*   **Recommendation:**
    *   **Keep:** Essential, but keep collapsed by default or move to a modal.
    *   **Refinement:** Group by "Indexing Rules" vs "Application Preferences".

### 11. File Tree (`id: file-tree`) & Pinned Files (`id: pinned-files`)
*   **Current Title:** File Tree / Pinned Files
*   **Purpose:** Standard file navigation and "favorites".
*   **Critique:** Redundant if "Knowledge Sources" (Index Scope) exists.
*   **Recommendation:**
    *   **Merge:** Combine into a unified **"Project Explorer"** panel that handles Sources, Files, and Pins in one place.
    *   **Status:** Hide independent panels by default.

## Proposed Grid Layout (The "Bicameral" Layout)

We split the dashboard into two clear zones: **Knowledge (Left)** and **Structure (Right)**, meeting in the middle for **Context Assembly**.

```json
{
  "panels": [
    // LEFT COLUMN: Knowledge Base (The "Cross-Referencer")
    // Focus: Text, Documentation, Plans, Semantic Search
    { "id": "status", "x": 0, "y": 0, "w": 4, "h": 4 },        // Knowledge Base Status
    { "id": "roots", "x": 0, "y": 4, "w": 4, "h": 8 },         // Knowledge Sources (Docs+Code)
    { "id": "search", "x": 0, "y": 12, "w": 4, "h": 6 },       // Knowledge Query
    
    // CENTER COLUMN: Context Assembly (The "Output")
    // Focus: Combining Knowledge + Structure for the AI
    { "id": "context-options", "x": 4, "y": 0, "w": 4, "h": 6 }, // Context Assembler
    { "id": "results", "x": 4, "y": 6, "w": 4, "h": 8 },         // Retrieved Context (Results)
    { "id": "context-output", "x": 4, "y": 14, "w": 4, "h": 10 },// Prompt Buffer
    
    // RIGHT COLUMN: Code Graph (The "Structure")
    // Focus: Symbols, Imports, Calls, Scope
    { "id": "trace-coverage", "x": 8, "y": 0, "w": 4, "h": 6 },  // AI Scope Status
    { "id": "trace", "x": 8, "y": 6, "w": 4, "h": 12 },          // Code Graph Explorer
    { "id": "settings", "x": 8, "y": 18, "w": 4, "h": 6 }        // Config
  ]
}
```

### Flow Rationale
1.  **Left (Knowledge):** "What do I know?" (Docs, Plans, Old Code). This is the **Cross-Reference** engine.
2.  **Right (Structure):** "How does it work?" (Live Graph, Symbols). This is the **Scope/Structure** engine.
3.  **Center (Assembly):** "What do I give the AI?" The synthesis of Knowledge and Structure.
