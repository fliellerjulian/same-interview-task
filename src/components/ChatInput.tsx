import React, { useRef, useEffect, useState } from "react";
import { Paperclip, Square } from "lucide-react";
import { UploadedFileChip } from "@/components/UploadedFileChip";
import { uploadFiles } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  onFilesChange?: (files: { name: string; url: string }[]) => void;
  isStreaming?: boolean;
  onStop?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled,
  onFilesChange,
  isStreaming = false,
  onStop,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string }[]
  >([]);

  // Auto-expand textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [value]);

  // Notify parent of file changes
  useEffect(() => {
    if (onFilesChange) onFilesChange(uploadedFiles);
  }, [uploadedFiles, onFilesChange]);

  function handleRemoveFile(url: string) {
    setUploadedFiles((prev) => prev.filter((file) => file.url !== url));
  }

  function handlePaperclipClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadFiles(files);
      const newFiles = Array.from(files).map((file, i) => ({
        name: file.name,
        url: urls[i],
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  }

  return (
    <form onSubmit={onSubmit} className="w-full flex justify-center">
      <div className="flex flex-col w-full max-w-2xl bg-muted rounded-2xl px-6 py-4 shadow-lg gap-2 relative">
        {/* Uploaded files chips */}
        <div className="absolute left-6 top-2 flex gap-2 flex-wrap z-10">
          {uploadedFiles.map((file) => (
            <UploadedFileChip
              key={file.url}
              file={file}
              onRemove={handleRemoveFile}
            />
          ))}
          {uploading && (
            <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-black shadow-sm select-none">
              Uploading...
            </span>
          )}
        </div>
        <div className="flex items-start gap-3 w-full relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            rows={1}
            className="flex-1 resize-none bg-transparent border-none outline-none text-lg focus:ring-0 focus:ring-offset-0 shadow-none px-0 min-w-0 w-full h-12 overflow-hidden"
            placeholder="Type your message..."
            disabled={disabled}
            style={{ minWidth: 0, lineHeight: "2.25rem" }}
          />
        </div>
        <div className="flex justify-end items-end gap-2 w-full mt-2">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-200 disabled:opacity-50"
            onClick={handlePaperclipClick}
            disabled={uploading}
            tabIndex={-1}
          >
            <Paperclip className="size-5" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </button>
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded-xl w-9 h-9 bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            >
              <Square className="size-5" />
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-xl w-9 h-9 bg-black text-white flex items-center justify-center shadow-md disabled:opacity-50"
              disabled={disabled || !value.trim()}
            >
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
