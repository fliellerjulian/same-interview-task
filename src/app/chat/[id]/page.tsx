// In src/app/chat/[id]/page.tsx
"use client";
import { v4 as uuidv4 } from "uuid";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts?: Array<{
    type: "text";
    text: string;
  }>;
};

export default function ChatPage() {
  const params = useParams();
  const [chatData, setChatData] = useState<{
    prompt: string;
    images: string[];
    isNewProject: boolean;
  } | null>(null);
  const [dbMessages, setDbMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const storedData = sessionStorage.getItem(`chat_${params.id}`);
    if (storedData) {
      setChatData(JSON.parse(storedData));
      //clean up the stored data
      sessionStorage.removeItem(`chat_${params.id}`);
    }
  }, [params.id]);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await fetch(`/api/chat/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setDbMessages(data.messages);
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
      }
    };

    if (!chatData?.isNewProject) {
      fetchChat();
    }
  }, [params.id, chatData]);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/agent",
    initialMessages:
      dbMessages.length > 0
        ? dbMessages
        : chatData
        ? [
            {
              id: uuidv4(),
              role: "user",
              content: chatData.prompt,
            },
          ]
        : [],
    onFinish: async (message) => {
      // Update messages in database after each message
      try {
        await fetch(`/api/chat/${params.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, message] }),
        });
      } catch (error) {
        console.error("Error updating chat:", error);
      }
    },
  });
  useEffect(() => {
    if (chatData?.isNewProject) {
      const createProject = async () => {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: chatData.prompt.slice(0, 50) + "...",
            chat: {
              messages: [
                {
                  id: uuidv4(),
                  role: "user",
                  content: chatData.prompt,
                },
              ],
            },
          }),
        });
        console.log(response);
      };
      createProject();
    }
  }, [chatData?.isNewProject]);

  if (!chatData && dbMessages.length === 0) return <div>Loading...</div>;

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
