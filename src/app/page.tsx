"use client";
import { Button } from "@/components/ui/button";
import { Paperclip, ArrowUp } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import { uploadFiles } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { UploadedFileChip } from "@/components/UploadedFileChip";

const PLACEHOLDERS = [
  "showcase my portfolio",
  "make a farewell board",
  "remix my brand website",
  "design a restaurant website with a menu",
];

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showTab, setShowTab] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string }[]
  >([]);
  const router = useRouter();

  // Typing animation for placeholder
  useEffect(() => {
    if (!showTab) return;
    setTypedPlaceholder("");
    setTypingDone(false);
    let i = 0;
    const current = PLACEHOLDERS[placeholderIdx];
    function typeChar() {
      setTypedPlaceholder(current.slice(0, i + 1));
      if (i < current.length - 1) {
        i++;
        setTimeout(typeChar, 30);
      } else {
        setTypingDone(true);
      }
    }
    typeChar();
  }, [placeholderIdx, showTab]);

  // Rotate placeholder every 4s
  useEffect(() => {
    if (!showTab) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((idx) => (idx + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [showTab]);

  // Auto-expand textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [inputValue]);

  // Restart placeholder animation when textarea is cleared
  useEffect(() => {
    if (inputValue === "") {
      setShowTab(true);
      setTypingDone(false);
      setTypedPlaceholder("");
    }
  }, [inputValue]);

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    setInputValue(e.currentTarget.value);
    if (e.currentTarget.value.length > 0) setShowTab(false);
    const textarea = e.currentTarget;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showTab && e.key === "Tab") {
      e.preventDefault();
      setInputValue(PLACEHOLDERS[placeholderIdx]);
      setShowTab(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  // Remove file handler
  function handleRemoveFile(url: string) {
    setUploadedFiles((prev) => prev.filter((file) => file.url !== url));
  }

  // Handle file input click
  function handlePaperclipClick() {
    fileInputRef.current?.click();
  }

  // Handle file selection and upload
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

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputValue) return;

    // Generate a unique ID for the chat
    const chatId = Math.random().toString(36).substring(2, 15);

    router.push(
      `/chat/${chatId}?prompt=${encodeURIComponent(
        inputValue
      )}&images=${encodeURIComponent(
        JSON.stringify(uploadedFiles.map((f) => f.url))
      )}`
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8">
      <h1 className="text-6xl font-extrabold tracking-tight mb-2 text-center">
        Make anything
      </h1>
      <p className="text-xl text-muted-foreground mb-10 text-center">
        Build fullstack web apps by prompting
      </p>
      <form className="w-full flex justify-center" onSubmit={handleSubmit}>
        <div className="flex flex-col w-full max-w-2xl bg-muted rounded-2xl px-10 py-8 shadow-lg gap-3 relative">
          {/* Uploaded files chips */}
          <div className="absolute left-6 top-4 flex gap-2 flex-wrap z-10">
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
            {/* Overlayed placeholder + tab badge */}
            {showTab && !inputValue && (
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center">
                <span
                  className="text-lg text-muted-foreground select-none"
                  style={{ lineHeight: "2.25rem" }}
                >
                  {typedPlaceholder}
                  {typingDone && (
                    <span
                      className="ml-0 inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-0.5 text-sm font-medium text-black shadow-sm select-none align-middle"
                      style={{ marginLeft: "0.25rem" }}
                    >
                      tab
                    </span>
                  )}
                </span>
              </div>
            )}
            <textarea
              ref={textareaRef}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              value={inputValue}
              rows={1}
              className={`flex-1 resize-none bg-transparent border-none outline-none text-lg focus:ring-0 focus:ring-offset-0 shadow-none px-0 min-w-0 w-full h-14 overflow-hidden ${
                showTab && !inputValue ? "text-transparent caret-black" : ""
              }`}
              placeholder={undefined}
              autoFocus
              style={{ minWidth: 0, lineHeight: "2.25rem" }}
            />
          </div>
          <div className="flex justify-end items-end gap-2 w-full mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="w-9 h-9 cursor-pointer"
                  onClick={handlePaperclipClick}
                  disabled={uploading}
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
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                Upload images and files, or paste them directly into the text
                box
              </TooltipContent>
            </Tooltip>
            <Button
              type="submit"
              size="icon"
              className="rounded-xl w-9 h-9 cursor-pointer"
              disabled={uploading || !inputValue}
              onClick={handleSubmit}
            >
              <ArrowUp className="size-5" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
