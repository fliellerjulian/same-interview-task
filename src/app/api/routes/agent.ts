import { Context } from "hono";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// System prompt for the AI
const systemPrompt = {
  role: "system",
  content: `You are an expert React developer. When given a feature or app description, respond with:
1. A brief explanation of what the code does.
2. The full code for the relevant file(s) in a markdown code block, with filenames as comments if there are multiple files.`,
};

export const agentRoute = async (c: Context) => {
  try {
    const { messages } = await c.req.json();

    const result = await streamText({
      model: openai("gpt-4o"),
      messages: [systemPrompt, ...messages],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return c.json({ error: error }, 500);
  }
};
