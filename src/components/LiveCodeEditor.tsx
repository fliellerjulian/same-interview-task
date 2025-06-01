"use client";

import { useEffect, useRef, useState } from "react";
import * as Babel from "@babel/standalone";
import { Highlight, themes } from "prism-react-renderer";
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

const defaultCode = `
const App = () => (
  <div className="h-screen flex items-center justify-center bg-gray-100">
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
      <div>
        <div className="text-xl font-medium text-black">Hello Tailwind!</div>
        <p className="text-gray-500">This is a live preview with Tailwind CSS</p>
      </div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
`;

type LiveCodeEditorProps = {
  mode?: "editor" | "preview";
  code?: string;
  setCode?: (code: string) => void;
};

export default function LiveCodeEditor({
  mode,
  code: codeProp,
  setCode: setCodeProp,
}: LiveCodeEditorProps) {
  const [internalCode, setInternalCode] = useState(codeProp ?? defaultCode);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const code = codeProp !== undefined ? codeProp : internalCode;
  const setCode = setCodeProp !== undefined ? setCodeProp : setInternalCode;

  useEffect(() => {
    if (mode === "preview" || mode === undefined) {
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

  if (mode === "editor") {
    return (
      <div className="h-full w-full">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value ?? "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
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

  // Default: show both (for demo page)
  return (
    <div className="flex flex-col h-[600px] w-full rounded-lg overflow-hidden">
      <div className="flex h-full">
        <div className="w-1/2 h-full flex flex-col">
          <div className="flex-1 overflow-auto bg-gray-50">
            <Editor
              value={code}
              onValueChange={setCode}
              highlight={(code) => (
                <Highlight theme={themes.nightOwl} code={code} language="jsx">
                  {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                  }) => (
                    <pre className={className} style={style}>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              )}
              padding={16}
              className="font-mono text-sm outline-none h-full w-full text-white"
              style={{ minHeight: "100%", background: "#011627" }}
              textareaClassName="outline-none"
              preClassName="!bg-transparent"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="w-1/2 h-full flex flex-col">
          <div className="flex-1 relative">
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
        </div>
      </div>
    </div>
  );
}
