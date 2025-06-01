"use client";

import LiveCodeEditor from "@/components/LiveCodeEditor";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            React Live Code Editor
          </h1>
          <p className="text-lg text-gray-600">
            A live code editor with Tailwind CSS support and syntax highlighting
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Try it out!
          </h2>
          <p className="text-gray-600 mb-4">
            Edit the code in the left panel to see live updates in the preview.
            The editor supports React components and Tailwind CSS classes.
          </p>
          <LiveCodeEditor />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Features
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Live React code compilation</li>
              <li>• Tailwind CSS support</li>
              <li>• Syntax highlighting</li>
              <li>• Error handling</li>
              <li>• Sandboxed preview</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tips</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Use Tailwind classes for styling</li>
              <li>• Write React components as usual</li>
              <li>• Check the preview for live updates</li>
              <li>• Look for error messages if something breaks</li>
              <li>• The preview is sandboxed for security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
