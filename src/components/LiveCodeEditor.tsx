"use client";

import { useEffect, useRef, useState } from "react";
import * as Babel from "@babel/standalone";
import Editor from "@monaco-editor/react";

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
      ${compiledCode}
    </script>
  </body>
</html>
`;

type LiveCodeEditorProps = {
  mode?: "editor" | "preview";
  code?: string;
  setCode?: (code: string) => void;
  readOnly?: boolean;
};

export default function LiveCodeEditor({
  mode,
  code: codeProp,
  setCode: setCodeProp,
  readOnly = false,
}: LiveCodeEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const code = codeProp;
  const setCode = setCodeProp;

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
