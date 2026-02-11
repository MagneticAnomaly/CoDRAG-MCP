import React from "react";
import { VsCodeApi } from "../global";
import { FileText, AlignLeft } from "lucide-react";

interface SearchResult {
  chunk_id: string;
  source_path: string;
  span: { start_line: number; end_line: number };
  preview: string;
  score: number;
  content?: string;
}

interface SearchResultsProps {
  data: {
    query: string;
    results: SearchResult[];
  };
  vscode: VsCodeApi;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ data, vscode }) => {
  const { query, results } = data || { query: "", results: [] };

  const handleOpenFile = (file: string, line: number) => {
    vscode.postMessage({
      command: "openFile",
      file,
      line,
    });
  };

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center opacity-70">
        <div className="mb-2">
          <FileText className="w-12 h-12 stroke-1" />
        </div>
        <p>No results found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlignLeft className="w-5 h-5" />
          Search Results
        </h2>
        <p className="text-sm opacity-80 mt-1">
          Query: <span className="text-[var(--vscode-textLink-foreground)] font-mono">"{query}"</span>
          <span className="ml-2 opacity-70">({results.length} results)</span>
        </p>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={result.chunk_id}
            className="group border border-[var(--vscode-editorWidget-border)] bg-[var(--vscode-editorWidget-background)] rounded-md overflow-hidden hover:border-[var(--vscode-focusBorder)] transition-colors cursor-pointer"
            onClick={() => handleOpenFile(result.source_path, result.span.start_line)}
          >
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--vscode-editor-background)] border-b border-[var(--vscode-editorWidget-border)]">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs font-mono opacity-50 shrink-0">{index + 1}.</span>
                <span className="text-xs font-mono text-[var(--vscode-textLink-foreground)] truncate" title={result.source_path}>
                  {result.source_path.split('/').pop()}:{result.span.start_line}
                </span>
                <span className="text-xs opacity-50 truncate hidden sm:block">
                  {result.source_path.split('/').slice(0, -1).join('/')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  result.score > 0.8 
                    ? 'bg-green-500/20 text-green-500' 
                    : result.score > 0.5 
                      ? 'bg-yellow-500/20 text-yellow-500' 
                      : 'bg-gray-500/20 text-gray-500'
                }`}>
                  {(result.score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div className="p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-32 opacity-90 group-hover:opacity-100 transition-opacity">
              {result.preview || result.content?.slice(0, 300) || "No preview available"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
