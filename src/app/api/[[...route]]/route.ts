import { handle } from "hono/vercel";
import app from "../config/hono";
import { uploadRoute } from "../routes/upload";
import { agentRoute } from "../routes/agent";

// Register routes
app.post("/api/upload", uploadRoute);
app.post("/api/agent", agentRoute);

// Export the handler for Vercel
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
