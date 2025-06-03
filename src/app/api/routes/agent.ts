import { Context } from "hono";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { systemPrompt } from "@/app/constants/prompts";

export const agentRoute = async (c: Context) => {
  try {
    const { messages } = await c.req.json();

    const result = await streamText({
      model: openai("gpt-4o"),
      messages: [systemPrompt, ...messages],
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
