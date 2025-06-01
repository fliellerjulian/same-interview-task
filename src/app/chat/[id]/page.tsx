// In src/app/chat/[id]/page.tsx
"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Projects } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import ChatInput from "@/components/ChatInput";

export default function ChatPage() {
  const params = useParams();
  const [dbData, setDbData] = useState<
    InferSelectModel<typeof Projects> | undefined
  >();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  if (!dbData) return <div>Loading...</div>;

  return (
    <div className="flex flex-col w-full max-w-2xl h-[90vh] mx-auto stretch relative">
      <div
        ref={messagesContainerRef}
        className="flex flex-col gap-4 mb-4 overflow-y-auto pr-2 flex-1"
        style={{ maxHeight: "calc(90vh - 110px)" }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-md whitespace-pre-wrap text-base break-words ${
              message.role === "user"
                ? "self-end bg-black text-white rounded-br-md"
                : "self-start bg-white text-black border border-zinc-200 rounded-bl-md"
            }`}
          >
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return <div key={`${message.id}-${i}`}>{part.text}</div>;
              }
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="sticky bottom-0 bg-muted z-10 pt-2">
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={false}
        />
      </div>
    </div>
  );
}
