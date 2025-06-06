import { useState } from "react";
import Editor from "@monaco-editor/react";

interface ExpandableCodeBlockProps {
  code: string;
  path?: string;
  onApply: () => void;
}

export default function ExpandableCodeBlock({
  code,
  path,
  onApply,
}: ExpandableCodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{path || "code"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          <button
            onClick={onApply}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-semibold"
            title="Apply changes"
          >
            Apply
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="bg-gray-900 rounded-b-lg overflow-x-auto">
          <Editor
            height="200px"
            width="100%"
            defaultLanguage="javascript"
            value={code}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: true,
              lineNumbers: "on",
              glyphMargin: true,
              lineDecorationsWidth: 5,
              lineNumbersMinChars: 3,
            }}
          />
        </div>
      )}
    </div>
  );
}
