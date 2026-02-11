/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--vscode-editor-background)",
        foreground: "var(--vscode-editor-foreground)",
        surface: "var(--vscode-editorWidget-background)",
        border: "var(--vscode-editorWidget-border)",
        input: "var(--vscode-input-background)",
        primary: {
          DEFAULT: "var(--vscode-button-background)",
          foreground: "var(--vscode-button-foreground)",
          hover: "var(--vscode-button-hoverBackground)",
        },
        secondary: {
          DEFAULT: "var(--vscode-button-secondaryBackground)",
          foreground: "var(--vscode-button-secondaryForeground)",
          hover: "var(--vscode-button-secondaryHoverBackground)",
        },
        destructive: {
          DEFAULT: "var(--vscode-statusBarItem-errorBackground)",
          foreground: "var(--vscode-statusBarItem-errorForeground)",
        },
        muted: {
          DEFAULT: "var(--vscode-editorWidget-background)",
          foreground: "var(--vscode-descriptionForeground)",
        },
        accent: {
          DEFAULT: "var(--vscode-activityBarBadge-background)",
          foreground: "var(--vscode-activityBarBadge-foreground)",
        },
      },
    },
  },
  plugins: [],
}
