import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";

// Create a new Hono app
const app = new Hono();

// Add CORS middleware
app.use("/*", cors());

// Define routes
app.get("/", () => {
  return new Response(
    JSON.stringify({
      message: "Hello from Hono!",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
});

// Example route with parameters
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return new Response(
    JSON.stringify({
      id,
      name: "John Doe",
      email: "john@example.com",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
});

// Export the handler for Vercel
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
