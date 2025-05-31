import { handle } from "hono/vercel";
import app from "../config/hono";
import { uploadRoute } from "../routes/upload";
import { agentRoute } from "../routes/agent";
import { getChatRoute, updateChatRoute } from "../routes/chat";
import { createProjectRoute, getProjectsRoute } from "../routes/projects";

// Register routes
app.post("/api/upload", uploadRoute);
app.post("/api/agent", agentRoute);
app.get("/api/chat/:id", getChatRoute);
app.post("/api/chat/:id", updateChatRoute);
app.get("/api/projects", getProjectsRoute);
app.post("/api/projects", createProjectRoute);

// Export the handler for Vercel
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
