// In src/app/chat/[id]/page.tsx
"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Projects } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import ChatInput from "@/components/ChatInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveCodeEditor from "@/components/LiveCodeEditor";
import React from "react";

export default function ChatPage() {
  const params = useParams();
  const [dbData, setDbData] = useState<
    InferSelectModel<typeof Projects> | undefined
  >();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [code, setCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await fetch(`/api/project/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setDbData(data);
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
      }
    };

    fetchChat();
  }, [params.id]);

  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat({
      api: "/api/agent",
      initialMessages: [],
      onFinish: async (message) => {
        // Update messages in database after each message
        try {
          await fetch(`/api/project/${params.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat: { messages: [...messages, message] },
            }),
          });
        } catch (error) {
          console.error("Error updating chat:", error);
        }
      },
    });

  useEffect(() => {
    if (dbData?.chat?.messages) {
      setMessages(dbData.chat.messages);
    }
  }, [dbData, setMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  if (!dbData) return <div>Loading...</div>;

  return (
    <div className="flex h-[90vh] w-full">
      {/* Chat Section */}
      <div className="w-1/2 flex flex-col border-r">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 mb-4 overflow-y-auto pr-2 flex-1 p-4"
          style={{ maxHeight: "calc(90vh - 110px)" }}
        >
          {messages.map((message, idx) => {
            // Detect if this is the last message and is streaming (AI role)
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
                      return bubbles.map((bubble, j) =>
                        renderBubble(
                          bubble.type,
                          bubble.content,
                          message.role === "user",
                          isStreaming && bubble.type === "code",
                          `${message.id}-${i}-${j}`
                        )
                      );
                    }
                    return null;
                  }
                )}
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="sticky bottom-0 bg-muted z-10 p-4">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={false}
          />
        </div>
      </div>

      {/* Code Editor Section */}
      <div className="w-1/2 flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="editor" className="flex-1 h-full p-0">
            <LiveCodeEditor mode="editor" code={code} setCode={setCode} />
          </TabsContent>
          <TabsContent value="preview" className="flex-1 h-full p-0">
            <LiveCodeEditor mode="preview" code={code} setCode={setCode} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
