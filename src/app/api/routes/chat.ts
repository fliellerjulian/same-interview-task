import { Context } from "hono";
import db from "@/db";
import { Projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getChatRoute = async (c: Context) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Project ID is required" }, 400);
    }

    const project = await db.query.Projects.findFirst({
      where: eq(Projects.id, id),
    });

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    return c.json({ messages: project.chat });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return c.json({ error: "Failed to fetch chat messages" }, 500);
  }
};

export const updateChatRoute = async (c: Context) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Project ID is required" }, 400);
    }

    const { messages } = await c.req.json();

    const project = await db.query.Projects.findFirst({
      where: eq(Projects.id, id),
    });

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    await db
      .update(Projects)
      .set({
        chat: { messages },
        updatedAt: new Date(),
      })
      .where(eq(Projects.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating chat:", error);
    return c.json({ error: "Failed to update chat messages" }, 500);
  }
};
