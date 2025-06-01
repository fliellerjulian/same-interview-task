"use client";

import { useEffect, useRef, useState } from "react";
import * as Babel from "@babel/standalone";
import { Highlight, themes } from "prism-react-renderer";

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

export default function LiveCodeEditor() {
  const [code, setCode] = useState(defaultCode);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
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
  }, [code]);

  return (
    <div className="flex flex-col h-[600px] w-full border rounded-lg overflow-hidden">
      <div className="flex h-full">
        <div className="w-1/2 h-full flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h3 className="text-sm font-medium text-gray-700">Code Editor</h3>
          </div>
          <div className="flex-1 overflow-auto bg-gray-50 border-r">
            <Highlight theme={themes.nightOwl} code={code} language="jsx">
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={`${className} p-4 text-sm`} style={style}>
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      <span className="inline-block w-8 text-gray-500 select-none">
                        {i + 1}
                      </span>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-1/2 h-[calc(600px-40px)] mt-10 p-4 font-mono text-sm bg-transparent border-r resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-transparent caret-black"
              spellCheck="false"
            />
          </div>
        </div>
        <div className="w-1/2 h-full flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h3 className="text-sm font-medium text-gray-700">Preview</h3>
          </div>
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
