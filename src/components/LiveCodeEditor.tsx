"use client";

import { useEffect, useRef, useState } from "react";
import * as Babel from "@babel/standalone";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { generateHTML } from "@/lib/utils";
import { FiFile } from "react-icons/fi";

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

type LiveCodeEditorProps = {
  mode?: "editor" | "preview";
  files?: Record<string, string>;
  setFiles?: (files: Record<string, string>) => void;
  readOnly?: boolean;
  highlightChanges?: {
    additions: string[];
    deletions: string[];
  } | null;
  showCopyButton?: boolean;
  onAcceptChanges?: () => void;
  onRejectChanges?: () => void;
};

function createModuleSystem(files: Record<string, string>) {
  // Only compile each file and build a modules object with the compiled code as strings
  const modules: Record<string, { code: string }> = {};

  const compileFile = (path: string, code: string) => {
    try {
      const result = Babel.transform(code, {
        presets: ["react"],
        plugins: [["transform-modules-commonjs"]],
      });
      console.log("Compiled code for", path, result.code);
      return result.code;
    } catch (error) {
      console.error(`Error compiling ${path}:`, error);
      return "";
    }
  };

  for (const [path, code] of Object.entries(files)) {
    modules[path] = { code: compileFile(path, code) };
  }
  return modules;
}

export default function LiveCodeEditor({
  mode,
  files = {},
  setFiles,
  readOnly = false,
  highlightChanges,
  showCopyButton = true,
  onAcceptChanges,
  onRejectChanges,
}: LiveCodeEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Auto-select App.js only on initial load
  useEffect(() => {
    if (!hasInitializedRef.current && Object.keys(files).length > 0) {
      const appFile = Object.keys(files).find((path) =>
        path.endsWith("App.js")
      );
      if (appFile) {
        setSelectedFile(appFile);
      } else {
        // Fallback to first file if App.js is not found
        setSelectedFile(Object.keys(files)[0]);
      }
      hasInitializedRef.current = true;
    }
  }, [files]);

  const handleCopy = async () => {
    if (selectedFile && files[selectedFile]) {
      try {
        await navigator.clipboard.writeText(files[selectedFile]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  // Function to get line decorations for diff highlighting
  const getLineDecorations = () => {
    if (!highlightChanges || !selectedFile || !files[selectedFile]) return [];
    const lines = files[selectedFile].split("\n");
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
    if (editorRef.current && selectedFile) {
      if (highlightChanges) {
        const decorations = getLineDecorations();
        decorationIdsRef.current = editorRef.current.deltaDecorations(
          [],
          decorations
        );
      } else {
        decorationIdsRef.current = editorRef.current.deltaDecorations(
          decorationIdsRef.current,
          []
        );
      }
    }
  }, [selectedFile, files, highlightChanges]);

  useEffect(() => {
    if (
      (mode === "preview" || mode === undefined) &&
      Object.keys(files).length > 0
    ) {
      try {
        const modules = createModuleSystem(files);
        const html = generateHTML(modules);

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
  }, [files, mode]);

  if (mode === "editor") {
    return (
      <div className="h-full w-full relative flex">
        <div className="w-56 bg-gray-50 border-r border-gray-200 shadow-md p-3 overflow-y-auto flex flex-col gap-1">
          {Object.keys(files).map((path) => (
            <button
              key={path}
              onClick={() => setSelectedFile(path)}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all duration-25 font-mono text-sm
                ${
                  selectedFile === path
                    ? "bg-muted border border-border text-foreground font-semibold shadow-sm"
                    : "hover:bg-muted/70 text-muted-foreground"
                }
              `}
            >
              <FiFile className="text-lg opacity-70" />
              <span className="truncate">{path}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          {selectedFile && (
            <>
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                {highlightChanges && (
                  <>
                    <button
                      onClick={onAcceptChanges}
                      className="p-2 rounded-md bg-green-600 hover:bg-green-700 transition-colors"
                      title="Accept changes"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={onRejectChanges}
                      className="p-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors"
                      title="Reject changes"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </>
                )}
                {showCopyButton && (
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                    title="Copy code"
                  >
                    {copySuccess ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={files[selectedFile]}
                theme="vs-dark"
                onChange={(value) => {
                  if (setFiles && value !== undefined) {
                    setFiles({
                      ...files,
                      [selectedFile]: value,
                    });
                  }
                }}
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
            </>
          )}
        </div>
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
            sandbox="allow-scripts allow-forms"
          />
        )}
      </div>
    );
  }

  return null;
}
