import React, { useState } from "react";
import LiveCodeEditor from "@/components/LiveCodeEditor";

interface ExpandableCodeBlockProps {
  code: string;
}

const ExpandableCodeBlock: React.FC<ExpandableCodeBlockProps> = ({ code }) => {
  const [expanded, setExpanded] = useState(false);
  const lines = code.split("\n");
  const previewCode =
    lines.slice(0, 4).join("\n") + (lines.length > 4 ? "\n..." : "");

  // Set height based on expanded state and line count
  const minHeight = 80; // px, for preview
  const maxHeight = Math.min(600, lines.length * 24 + 32); // px, for expanded

  return (
    <div className="my-2 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-900 w-[90vw] max-w-3xl mx-auto">
      <div style={{ height: expanded ? maxHeight : minHeight }}>
        <LiveCodeEditor
          mode="editor"
          code={expanded ? code : previewCode}
          readOnly={true}
        />
      </div>
      {lines.length > 2 && (
        <button
          className="w-full text-xs text-center py-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded
            ? "Show less"
            : `Show ${lines.length - 4} more line${
                lines.length - 4 === 1 ? "" : "s"
              }`}
        </button>
      )}
    </div>
  );
};

export default ExpandableCodeBlock;
