import { handle } from "hono/vercel";
import app from "../config/hono";
import { uploadRoute } from "../routes/upload";
import { agentRoute } from "../routes/agent";
import {
  createProjectRoute,
  deleteProjectRoute,
  getProjectsRoute,
  getProjectRoute,
  updateProjectRoute,
} from "../routes/projects";

// Register routes
app.post("/api/upload", uploadRoute);
app.post("/api/agent", agentRoute);
app.get("/api/projects", getProjectsRoute);
app.get("/api/project/:id", getProjectRoute);
app.post("/api/projects", createProjectRoute);
app.post("/api/project/:id", updateProjectRoute);
app.delete("/api/projects/:id", deleteProjectRoute);

// Export the handler for Vercel
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
