import React, { useState, useEffect } from "react";
import { SearchResults } from "./components/SearchResults";
import { ContextPreview } from "./components/ContextPreview";
import { TracePanel } from "./components/TracePanel";

// VS Code API wrapper
const vscode = (window as any).acquireVsCodeApi();

// Type for the message sent from extension
interface Message {
  command: string;
  data: any;
}

const App: React.FC = () => {
  const [view, setView] = useState<"search" | "context" | "trace" | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Listen for messages from the extension
    const handleMessage = (event: MessageEvent<Message>) => {
      const { command, data } = event.data;
      
      switch (command) {
        case "showSearchResults":
          setView("search");
          setData(data);
          break;
        case "showContextPreview":
          setView("context");
          setData(data);
          break;
        case "showTracePanel":
          setView("trace");
          setData(data);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    
    // Signal ready
    vscode.postMessage({ command: "webviewReady" });

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!view) {
    return <div className="p-4 flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)] font-sans">
      {view === "search" && <SearchResults data={data} vscode={vscode} />}
      {view === "context" && <ContextPreview data={data} vscode={vscode} />}
      {view === "trace" && <TracePanel data={data} vscode={vscode} />}
    </div>
  );
};

export default App;
