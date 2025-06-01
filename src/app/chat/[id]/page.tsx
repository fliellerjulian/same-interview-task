// In src/app/chat/[id]/page.tsx
"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Projects } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import ChatInput from "@/components/ChatInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveCodeEditor from "@/components/LiveCodeEditor";
import React from "react";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");
  const [dbData, setDbData] = useState<
    InferSelectModel<typeof Projects> | undefined
  >();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [code, setCode] = useState<string | undefined>(undefined);
  const [previousCode, setPreviousCode] = useState<string | undefined>(
    undefined
  );
  const [isStreamingCode, setIsStreamingCode] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    additions: string[];
    deletions: string[];
  } | null>(null);
  const autoSubmitRef = useRef(false);

  // Function to save code to database
  const saveCodeToDatabase = async (newCode: string) => {
    try {
      const response = await fetch(`/api/project/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode }),
      });
      if (!response.ok) {
        throw new Error("Failed to save code");
      }
      // Don't update dbData here to avoid re-renders
      // The code state is already updated locally
    } catch (error) {
      console.error("Error saving code:", error);
    }
  };

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await fetch(`/api/project/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setDbData(data);
          // Set code from database if it exists and we don't have code yet
          if (data.code && !code) {
            setCode(data.code);
            setActiveTab("editor");
          }
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
      }
    };

    fetchChat();
  }, [params.id, code]); // Only refetch when id changes or code is null

  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat({
      api: "/api/agent",
      initialMessages: [],
      onFinish: async (message) => {
        // Update messages in database after each message
        try {
          const response = await fetch(`/api/project/${params.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat: { messages: [...messages, message] },
            }),
          });
          if (!response.ok) {
            throw new Error("Failed to update chat");
          }
          const updatedData = await response.json();
          setDbData(updatedData);
        } catch (error) {
          console.error("Error updating chat:", error);
        }
        // --- Save code block to DB if present ---
        // Try to extract code block from message
        let codeBlock = "";
        if (message.parts) {
          for (const part of message.parts) {
            if (part.type === "text" && part.text) {
              const match = part.text.match(/```([\s\S]*?)```/);
              if (match) {
                codeBlock = match[1].replace(/^\n+|\n+$/g, "");
                break;
              }
            }
          }
        }
        if (codeBlock) {
          const newCode = codeBlock;
          if (code) {
            const diff = computeDiff(code, newCode);
            setPendingChanges(diff);
            setPreviousCode(code);
          }
          setCode(newCode); // Ensure editor appears
          setIsStreamingCode(false); // End streaming state
          setActiveTab("editor"); // Switch to editor tab
          await saveCodeToDatabase(newCode);
        }
      },
    });

  useEffect(() => {
    if (dbData?.chat?.messages) {
      setMessages(dbData.chat.messages);
    }
  }, [dbData, setMessages]);

  // Auto-submit prompt from query string if present, only if there are no messages
  useEffect(() => {
    if (
      initialPrompt &&
      (!dbData?.chat?.messages || dbData.chat.messages.length === 0) &&
      !input &&
      !autoSubmitRef.current
    ) {
      handleInputChange({
        target: { value: initialPrompt },
      } as React.ChangeEvent<HTMLInputElement>);
      setShouldAutoSubmit(true);
      autoSubmitRef.current = true;
    }
  }, [initialPrompt, dbData, input, handleInputChange]);

  useEffect(() => {
    if (shouldAutoSubmit && input === initialPrompt) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      setShouldAutoSubmit(false);
    }
  }, [shouldAutoSubmit, input, initialPrompt, handleSubmit]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Save user message to DB on submit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Save user message to DB
    try {
      await fetch(`/api/project/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat: {
            messages: [
              ...messages,
              { id: Date.now().toString(), role: "user", content: input },
            ],
          },
        }),
      });
    } catch (error) {
      console.error("Error saving user message:", error);
    }
    handleSubmit(e);
  };

  // Helper to split markdown into bubbles (text, code, list item)
  function parseMarkdownToBubbles(
    markdown: string
  ): { type: "text" | "code" | "li"; content: string }[] {
    const bubbles: { type: "text" | "code" | "li"; content: string }[] = [];
    const codeBlockRegex = /```([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      if (match.index > lastIndex) {
        const before = markdown.slice(lastIndex, match.index);
        // Split before into lines and list items
        before.split(/\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("- ") || trimmed.match(/^\d+\. /)) {
            bubbles.push({
              type: "li",
              content: trimmed.replace(/^(- |\d+\. )/, ""),
            });
          } else if (trimmed) {
            bubbles.push({ type: "text", content: trimmed });
          }
        });
      }
      bubbles.push({
        type: "code",
        content: match[1].replace(/^\n+|\n+$/g, ""),
      });
      lastIndex = match.index + match[0].length;
    }
    // Handle any remaining text after the last code block
    if (lastIndex < markdown.length) {
      markdown
        .slice(lastIndex)
        .split(/\n/)
        .forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("- ") || trimmed.match(/^\d+\. /)) {
            bubbles.push({
              type: "li",
              content: trimmed.replace(/^(- |\d+\. )/, ""),
            });
          } else if (trimmed) {
            bubbles.push({ type: "text", content: trimmed });
          }
        });
    }
    return bubbles;
  }

  function renderBubble(
    type: "text" | "code" | "li",
    content: string,
    isUser: boolean,
    isStreaming: boolean,
    key: string
  ) {
    if (type === "code") {
      if (isStreaming) {
        return (
          <div key={key} className={`max-w-[80%] my-1 self-start`}>
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        );
      }
      return (
        <div
          key={key}
          className={`max-w-[80%] my-1 self-start bg-zinc-900 text-white rounded-2xl p-5 font-mono text-base overflow-x-auto shadow-md`}
        >
          <pre className="whitespace-pre-wrap break-words">
            <code>{content}</code>
          </pre>
        </div>
      );
    }
    // For normal text
    return (
      <div
        key={key}
        className={`max-w-[80%] my-1 px-4 py-3 rounded-2xl shadow-md whitespace-pre-wrap text-base break-words ${
          isUser
            ? "self-end bg-black text-white rounded-br-md"
            : "self-start bg-white text-black border border-zinc-200 rounded-bl-md"
        }`}
      >
        {content}
      </div>
    );
  }

  // Function to compute diff between two strings
  const computeDiff = (oldCode: string, newCode: string) => {
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

  // Function to handle accepting changes
  const handleAcceptChanges = () => {
    if (code) {
      setPreviousCode(code);
      setPendingChanges(null);
      saveCodeToDatabase(code);
    }
  };

  // Function to handle rejecting changes
  const handleRejectChanges = () => {
    if (previousCode) {
      setCode(previousCode);
      setPendingChanges(null);
    }
  };

  useEffect(() => {
    // Find the latest assistant message with a code block if streaming
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && input !== "") {
        for (const part of lastMsg.parts || []) {
          if (part.type === "text" && part.text) {
            const match = part.text.match(/```([\s\S]*?)```/);
            if (match) {
              setCode(match[1].replace(/^\n+|\n+$/g, ""));
              setIsStreamingCode(true);
              return;
            }
          }
        }
      } else {
        setIsStreamingCode(false);
      }
    }
  }, [messages, input]);

  if (!dbData) return <div>Loading...</div>;

  return (
    <div className="flex h-[100vh] w-full">
      {/* Chat Section */}
      <div
        className={`
          ${
            code
              ? "w-1/2 flex flex-col border-r"
              : "w-full max-w-2xl mx-auto flex flex-col"
          }
          flex flex-1 min-h-0
        `}
      >
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 mb-4 overflow-y-auto pr-2 flex-1 min-h-0 p-4"
          style={{ maxHeight: "calc(90vh - 110px)" }}
        >
          {messages.map((message, idx) => {
            const isStreaming =
              message.role === "assistant" &&
              idx === messages.length - 1 &&
              input !== "";
            return (
              <React.Fragment key={message.id}>
                {message.parts.map(
                  (part: { type: string; text?: string }, i: number) => {
                    if (part.type === "text" && part.text) {
                      const bubbles = parseMarkdownToBubbles(part.text);
                      return bubbles.map((bubble, j) => {
                        return renderBubble(
                          bubble.type,
                          bubble.content,
                          message.role === "user",
                          isStreaming && bubble.type === "code",
                          `${message.id}-${i}-${j}`
                        );
                      });
                    }
                    return null;
                  }
                )}
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="sticky bottom-0 z-10 p-4">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleUserSubmit}
            disabled={false}
          />
        </div>
      </div>

      {/* Code Editor Section */}
      {code && (
        <div className="w-1/2 flex flex-col h-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="editor" className="flex-1 h-full p-0">
              <div className="h-full flex flex-col">
                {pendingChanges && (
                  <div className="flex gap-2 p-2 bg-muted border-b">
                    <button
                      onClick={handleAcceptChanges}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Accept Changes
                    </button>
                    <button
                      onClick={handleRejectChanges}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Reject Changes
                    </button>
                  </div>
                )}
                <div className="flex-1 relative">
                  <LiveCodeEditor
                    mode="editor"
                    code={code}
                    setCode={(newCode) => {
                      if (code) {
                        const diff = computeDiff(code, newCode);
                        setPendingChanges(diff);
                      }
                      setCode(newCode);
                      if (!isStreamingCode) {
                        saveCodeToDatabase(newCode);
                      }
                    }}
                    readOnly={isStreamingCode}
                    highlightChanges={pendingChanges}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="preview" className="flex-1 h-full p-0">
              <LiveCodeEditor
                mode="preview"
                code={code}
                setCode={setCode}
                readOnly={isStreamingCode}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
