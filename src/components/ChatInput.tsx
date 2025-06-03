import React, { useRef } from "react";
import { Square } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  onFilesChange?: (files: FileList | undefined) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled,
  isStreaming = false,
  onStop,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <form onSubmit={onSubmit} className="w-full flex justify-center">
      <div className="flex flex-col w-full max-w-2xl bg-muted rounded-2xl px-6 py-4 shadow-lg gap-2 relative">
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
