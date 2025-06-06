import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function uploadFiles(
  files: FileList | File[]
): Promise<{ urls: string[] }> {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return {
    urls: data.urls as string[],
  };
}

export const computeDiff = (
  oldFiles: Record<string, string>,
  newFiles: Record<string, string>
) => {
  const diff: Record<string, { additions: number[]; deletions: number[] }> = {};
  const allFiles = new Set([
    ...Object.keys(oldFiles),
    ...Object.keys(newFiles),
  ]);
  for (const file of allFiles) {
    const oldLines = (oldFiles[file] || "").split("\n");
    const newLines = (newFiles[file] || "").split("\n");
    const additions: number[] = [];
    const deletions: number[] = [];
    let i = 0,
      j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i >= oldLines.length) {
        additions.push(j + 1);
        j++;
      } else if (j >= newLines.length) {
        deletions.push(i + 1);
        i++;
      } else if (oldLines[i] === newLines[j]) {
        i++;
        j++;
      } else {
        if (j + 1 < newLines.length && oldLines[i] === newLines[j + 1]) {
          additions.push(j + 1);
          j++;
        } else if (i + 1 < oldLines.length && oldLines[i + 1] === newLines[j]) {
          deletions.push(i + 1);
          i++;
        } else {
          additions.push(j + 1);
          deletions.push(i + 1);
          i++;
          j++;
        }
      }
    }
    if (additions.length > 0 || deletions.length > 0) {
      diff[file] = { additions, deletions };
    }
  }
  return diff;
};

export const generateHTML = (modules: Record<string, { code: string }>) => {
  // Validate modules
  if (!modules || Object.keys(modules).length === 0) {
    throw new Error("No modules provided to generate HTML");
  }

  // Find entry point
  const entryPoint = Object.keys(modules).find((p) => p.endsWith("App.js"));
  if (!entryPoint) {
    throw new Error("No entry point found (App.js");
  }

  return `
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
        try {
          // Build modules system in the iframe
          const modules = {};
          const moduleFns = {};
          const moduleCodes = ${JSON.stringify(modules)};
          
          // Initialize module functions
          for (const path in moduleCodes) {
            try {
              moduleFns[path] = new Function('require', 'exports', 'module', moduleCodes[path].code);
            } catch (error) {
              console.error('Error initializing module:', path, error);
              throw new Error('Failed to initialize module: ' + path);
            }
          }

          // Module system
          function require(path, from) {
            if (path === "react") return window.React;
            if (path === "react-dom") return window.ReactDOM;
            
            let resolvedPath = new URL(path, 'file://' + (from || '/App.js')).pathname;
            if (!resolvedPath.endsWith('.js')) resolvedPath += '.js';
            
            if (!modules[resolvedPath]) {
              // Prepare empty exports and module
              const exports = {};
              const module = { exports };
              modules[resolvedPath] = module;
              
              // Execute the module code
              if (moduleFns[resolvedPath]) {
                try {
                  moduleFns[resolvedPath]((p) => require(p, resolvedPath), exports, module);
                } catch (error) {
                  console.error('Error executing module:', resolvedPath, error);
                  throw new Error('Failed to execute module: ' + resolvedPath);
                }
              } else {
                throw new Error('Module not found: ' + resolvedPath);
              }
            }
            return modules[resolvedPath].exports;
          }

          // Load and render the app
          const entryExports = require('${entryPoint}');
          const App = entryExports.default || entryExports;
          
          if (!App || typeof App !== 'function') {
            throw new Error('Invalid entry point: App component not found or not a function');
          }

          ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
        } catch (error) {
          // Display error in the root div
          const root = document.getElementById('root');
          if (root) {
            root.innerHTML = \`
              <div style="color: red; padding: 20px; font-family: monospace;">
                <h2>Error Loading Application</h2>
                <pre>\${error.message}</pre>
                <p>Check the console for more details.</p>
              </div>
            \`;
          }
          console.error('Application Error:', error);
        }
      })();
    </script>
  </body>
</html>
`;
};

// Remove a leading jsx, js, or similar line
export const stripCodeBlockLang = (code: string) => {
  return code.replace(/^[a-zA-Z0-9]*\s*/, "");
};

// Function to convert image URL to base64
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Error converting URL to base64:", error);
    throw error;
  }
}
