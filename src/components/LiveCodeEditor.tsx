"use client";

import { useEffect, useRef, useState } from "react";
import * as Babel from "@babel/standalone";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";

interface IModelDeltaDecoration {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  options: {
    isWholeLine: boolean;
    className: string;
    glyphMarginClassName: string;
  };
}

const generateHTML = (compiledCode: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {}
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script>
      // Make React hooks available globally
      const { useState, useEffect, useRef, useCallback, useMemo } = React;
      const { createRoot } = ReactDOM;

      // Wrap the code in an IIFE to avoid global scope pollution
      (function() {
        ${compiledCode}
      })();
    </script>
  </body>
</html>
`;

type LiveCodeEditorProps = {
  mode?: "editor" | "preview";
  code?: string;
  setCode?: (code: string) => void;
  readOnly?: boolean;
  highlightChanges?: {
    additions: string[];
    deletions: string[];
  } | null;
};

const stripCodeBlockLang = (code: string) => {
  // Remove a leading jsx, js, or similar line
  return code.replace(/^[a-zA-Z0-9]*\s*/, "");
};

export default function LiveCodeEditor({
  mode,
  code: codeProp,
  setCode: setCodeProp,
  readOnly = false,
  highlightChanges,
}: LiveCodeEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const code = codeProp ? stripCodeBlockLang(codeProp) : codeProp;
  const setCode = setCodeProp;

  // Function to get line decorations for diff highlighting
  const getLineDecorations = () => {
    if (!highlightChanges || !code) return [];
    const lines = code.split("\n");
    const decorations: IModelDeltaDecoration[] = [];
    highlightChanges.additions.forEach((line) => {
      const lineNumber = lines.findIndex((l) => l === line) + 1;
      if (lineNumber > 0) {
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: 1000,
          },
          options: {
            isWholeLine: true,
            className: "my-whole-line-addition",
            glyphMarginClassName: "bg-green-600",
          },
        });
      }
    });
    highlightChanges.deletions.forEach((line) => {
      const lineNumber = lines.findIndex((l) => l === line) + 1;
      if (lineNumber > 0) {
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: 1000,
          },
          options: {
            isWholeLine: true,
            className: "my-whole-line-deletion",
            glyphMarginClassName: "bg-red-500",
          },
        });
      }
    });
    return decorations;
  };

  // Update decorations when code or highlightChanges change
  useEffect(() => {
    if (editorRef.current) {
      if (highlightChanges) {
        const decorations = getLineDecorations();
        decorationIdsRef.current = editorRef.current.deltaDecorations(
          [],
          decorations
        );
      } else {
        // Clear all decorations
        decorationIdsRef.current = editorRef.current.deltaDecorations(
          decorationIdsRef.current,
          []
        );
      }
    }
  }, [code, highlightChanges]);

  useEffect(() => {
    if ((mode === "preview" || mode === undefined) && code) {
      try {
        const compiled = Babel.transform(code, {
          presets: ["react"],
        }).code;
        const html = generateHTML(compiled);
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const iframe = iframeRef.current;
        if (iframe) {
          iframe.src = url;
        }
        setError(null);
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  }, [code, mode]);

  if (!code) return null;

  if (mode === "editor") {
    return (
      <div className="h-full w-full">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode && setCode(value ?? "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly,
            lineNumbers: "on",
            glyphMargin: true,
            lineDecorationsWidth: 5,
            lineNumbersMinChars: 3,
          }}
          onMount={(editor) => {
            editorRef.current = editor;
            if (highlightChanges) {
              const decorations = getLineDecorations();
              decorationIdsRef.current = editor.deltaDecorations(
                [],
                decorations
              );
            }
          }}
        />
      </div>
    );
  }

  if (mode === "preview") {
    return (
      <div className="h-full w-full relative">
        {error ? (
          <div className="absolute inset-0 bg-red-50 p-4 overflow-auto">
            <pre className="text-red-600 text-sm">{error}</pre>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
          />
        )}
      </div>
    );
  }

  return null;
}
