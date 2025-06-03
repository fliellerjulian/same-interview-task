import { Context } from "hono";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { urlToBase64 } from "@/lib/utils";
import { systemPrompt } from "@/app/constants/prompts";

// Define types for the vision model content
type TextContent = {
  type: "text";
  text: string;
};

type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

type MessageContent = TextContent | ImageContent;

export const agentRoute = async (c: Context) => {
  try {
    const { messages, urls } = await c.req.json();

    // If there are URLs, create a message with image content
    const processedMessages = [...messages];
    if (urls && urls.length > 0) {
      const lastMessage = processedMessages[processedMessages.length - 1];
      if (lastMessage && lastMessage.role === "user") {
        // Create an array of content items
        const contentItems: MessageContent[] = [
          { type: "text", text: lastMessage.content },
        ];

        // Add each URL as an image content item
        for (const url of urls) {
          console.log("Converting image URL to base64:", url);
          const base64Url = await urlToBase64(url);
          contentItems.push({
            type: "image_url",
            image_url: { url: base64Url },
          });
        }

        // Update the last message with the combined content
        lastMessage.content = contentItems;
      }
    }
    const result = await streamText({
      model: openai("gpt-4o"),
      messages: [systemPrompt, ...processedMessages],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Agent route error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
};
