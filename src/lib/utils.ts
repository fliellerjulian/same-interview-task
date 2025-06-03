import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function uploadFiles(files: FileList | File[]): Promise<string[]> {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  console.log(res);
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.urls as string[];
}

export const computeDiff = (oldCode: string, newCode: string) => {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const additions: string[] = [];
  const deletions: string[] = [];

  let i = 0,
    j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      additions.push(newLines[j]);
      j++;
    } else if (j >= newLines.length) {
      deletions.push(oldLines[i]);
      i++;
    } else if (oldLines[i] === newLines[j]) {
      i++;
      j++;
    } else {
      // Check if it's an addition or deletion
      if (j + 1 < newLines.length && oldLines[i] === newLines[j + 1]) {
        additions.push(newLines[j]);
        j++;
      } else if (i + 1 < oldLines.length && oldLines[i + 1] === newLines[j]) {
        deletions.push(oldLines[i]);
        i++;
      } else {
        additions.push(newLines[j]);
        deletions.push(oldLines[i]);
        i++;
        j++;
      }
    }
  }

  return { additions, deletions };
};

export const generateHTML = (compiledCode: string) => `
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

// Remove a leading jsx, js, or similar line
export const stripCodeBlockLang = (code: string) => {
  return code.replace(/^[a-zA-Z0-9]*\s*/, "");
};
