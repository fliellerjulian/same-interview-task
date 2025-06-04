// In src/app/chat/[id]/page.tsx
"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Projects } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import ChatInput from "@/components/ChatInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveCodeEditor from "@/components/LiveCodeEditor";
import React from "react";
import { computeDiff } from "@/lib/utils";
import ExpandableCodeBlock from "@/components/ExpandableCodeBlock";
import { useProjectApi } from "@/hooks/useProjectApi";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SidebarTriggerWrapper } from "@/components/ui/SidebarTriggerWrapper";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");
  const initialImages =
    searchParams.get("images")?.split(",").filter(Boolean) || [];

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
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const autoSubmitRef = useRef(false);
  const [isStreamingCode, setIsStreamingCode] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    additions: string[];
    deletions: string[];
  } | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { updateChat, saveCode } = useProjectApi(params.id as string);

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
        } else {
          throw new Error("Failed to fetch chat data");
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
        setError("Failed to load chat data. Please try again.");
      }
    };

    fetchChat();
  }, [params.id, code]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    stop,
  } = useChat({
    api: "/api/agent",
    initialMessages: [],
    onFinish: async (message) => {
      setIsStreaming(false);
      // Update messages in database after each message
      const updatedData = await updateChat([...messages, message]);
      setDbData(updatedData);

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
        await saveCode(newCode);
      }
    },
  });

  // Update streaming state based on isLoading
  useEffect(() => {
    setIsStreaming(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (dbData?.chat?.messages) {
      setMessages(dbData.chat.messages);
    }
  }, [dbData, setMessages]);

  // Auto-submit if initialPrompt is provided
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
      handleUserSubmit({ preventDefault: () => {} } as React.FormEvent);
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

    const newMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    };

    try {
      const updatedData = await updateChat([...messages, newMessage]);
      setDbData(updatedData);

      // Submit with files if any
      if (initialImages.length > 0 && shouldAutoSubmit == true) {
        handleSubmit(e, {
          experimental_attachments: initialImages.map((image) => ({
            url: image,
            contentType: `image/${image.split(".").pop()?.toLowerCase()}`,
          })),
        });
      } else {
        handleSubmit(e, {});
      }

      setError(null);
    } catch (error) {
      console.error("Error saving user message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleStop = () => {
    stop();
    setIsStreaming(false);
  };

  // Helper to split markdown into bubbles (text, code)
  function parseMarkdownToBubbles(
    markdown: string
  ): { type: "text" | "code"; content: string }[] {
    const bubbles: { type: "text" | "code"; content: string }[] = [];
    const codeBlockRegex = /```([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      if (match.index > lastIndex) {
        const before = markdown.slice(lastIndex, match.index);
        if (before.trim()) {
          bubbles.push({ type: "text", content: before.trim() });
        }
      }
      bubbles.push({
        type: "code",
        content: match[1].replace(/^\n+|\n+$/g, ""),
      });
      lastIndex = match.index + match[0].length;
    }
    // Handle any remaining text after the last code block
    if (lastIndex < markdown.length) {
      const after = markdown.slice(lastIndex);
      if (after.trim()) {
        bubbles.push({ type: "text", content: after.trim() });
      }
    }
    return bubbles;
  }

  function renderBubble(
    type: "text" | "code",
    content: string,
    isUser: boolean,
    isStreaming: boolean,
    key: string
  ) {
    if (type === "code") {
      // Always render code block for code bubbles in chat history
      return (
        <div key={key} className="max-w-[100%] my-1 self-start">
          <ExpandableCodeBlock
            code={content}
            onApply={() => {
              setCode(content);
              setActiveTab("editor");
              saveCode(content);
            }}
          />
        </div>
      );
    }
    // For normal text, render markdown
    return (
      <div
        key={key}
        className={`max-w-[100%] my-1 px-4 py-3 rounded-2xl shadow-md whitespace-pre-wrap text-base break-words ${
          isUser
            ? "self-end bg-black text-white rounded-br-md"
            : "self-start bg-white text-black border border-zinc-200 rounded-bl-md"
        }`}
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Function to handle accepting changes
  const handleAcceptChanges = () => {
    if (code) {
      setPreviousCode(code);
      setPendingChanges(null);
      saveCode(code);
    }
  };

  // Function to handle rejecting changes
  const handleRejectChanges = () => {
    if (previousCode) {
      setCode(previousCode);
      setPendingChanges(null);
    }
  };

  if (!dbData) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-[100vh] w-full">
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      {code ? (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1"
        >
          {/* Topbar */}
          <div
            className={`flex items-center h-14 px-6 border-b bg-white/80 backdrop-blur sticky top-0 z-30 w-full ${
              code && isEditorVisible ? "" : "justify-between"
            }`}
          >
            {/* Left: Chat title (always) */}
            <div
              className={
                code && isEditorVisible
                  ? "w-1/2 flex items-center gap-2"
                  : "flex items-center gap-2"
              }
            >
              <SidebarTriggerWrapper />
              <span className="font-semibold text-lg">Chat</span>
            </div>
            {/* Right: Tabs + toggle (if editor open), or just toggle (if hidden) */}
            {isEditorVisible ? (
              <div className="w-1/2 flex items-center justify-between">
                <div className="flex-1 flex items-center">
                  <TabsList>
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditorVisible(false)}
                  aria-label="Hide Code Editor"
                  className="ml-2"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditorVisible(true)}
                aria-label="Show Code Editor"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex flex-1 w-full ">
            {/* Chat Section */}
            <div
              className={`
                ${
                  isEditorVisible
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
                  isStreaming={isStreaming}
                  onStop={handleStop}
                />
              </div>
            </div>

            {/* Code Editor Section */}
            {isEditorVisible && (
              <div className="w-1/2 flex flex-col h-full pt-8">
                <TabsContent value="editor" className="flex-1 h-full p-0">
                  <div className="h-full flex flex-col">
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
                            saveCode(newCode);
                          }
                        }}
                        readOnly={isStreamingCode}
                        highlightChanges={pendingChanges}
                        showCopyButton={true}
                        onAcceptChanges={handleAcceptChanges}
                        onRejectChanges={handleRejectChanges}
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
              </div>
            )}
          </div>
        </Tabs>
      ) : (
        // If no code, fallback to just chat and topbar
        <>
          <div className="flex items-center justify-between h-14 px-6 border-b bg-white/80 backdrop-blur sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTriggerWrapper />
              <span className="font-semibold text-lg">Chat</span>
            </div>
          </div>
          <div className="flex flex-1 w-full">
            <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0">
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
                  isStreaming={isStreaming}
                  onStop={handleStop}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
