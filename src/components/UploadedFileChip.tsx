import React from "react";
import { X } from "lucide-react";

export function UploadedFileChip({
  file,
  onRemove,
}: {
  file: { name: string; url: string };
  onRemove: (url: string) => void;
}) {
  return (
    <span className="relative group inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-black shadow-sm select-none min-w-[120px]">
      <img
        src={file.url}
        alt={file.name}
        className="w-4 h-4 rounded-sm object-cover mr-2 group-hover:opacity-0 transition-opacity"
      />
      <button
        type="button"
        aria-label="Remove file"
        onClick={() => onRemove(file.url)}
        className="absolute left-3 top-1.5 w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-black bg-white opacity-0 group-hover:opacity-100 transition-opacity"
        tabIndex={-1}
      >
        <X className="w-3 h-3" />
      </button>
      <span className="truncate max-w-[140px]">{file.name}</span>
    </span>
  );
}
