import { Context } from "hono";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// System prompt for the AI
const systemPrompt = {
  role: "system",
  content: `You are an expert React developer. When given a description of a component, respond with:
1. A brief explanation of what the code does.
2. The full code using react and tailwind css.
3. The code should be in a single file.

Example:
Prompt:
"Create a simple component that displays a greeting message."

Code:
const App = () => (
  <div className="h-screen flex items-center justify-center bg-gray-100">
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
      <div>
        <div className="text-xl font-medium text-black">Hello Tailwind!</div>
        <p className="text-gray-500">This is a live preview with Tailwind CSS</p>
      </div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);`,
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
