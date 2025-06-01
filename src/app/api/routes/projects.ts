import { Context } from "hono";
import db from "@/db";
import { Projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getProjectsRoute = async (c: Context) => {
  try {
    const projects = await db.query.Projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });

    return c.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
};

export const getProjectRoute = async (c: Context) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Project ID is required" }, 400);
    }

    const project = await db.query.Projects.findFirst({
      where: eq(Projects.id, id),
    });

    return c.json(project);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
};

export const createProjectRoute = async (c: Context) => {
  try {
    const { name, chat } = await c.req.json();

    if (!name) {
      return c.json({ error: "Project name is required" }, 400);
    }

    const [project] = await db
      .insert(Projects)
      .values({
        name,
        chat,
      })
      .returning();

    return c.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
};

export const deleteProjectRoute = async (c: Context) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Project ID is required" }, 400);
    }

    const deleted = await db
      .delete(Projects)
      .where(eq(Projects.id, id))
      .returning();
    if (deleted.length === 0) {
      return c.json({ error: "Project not found" }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return c.json({ error: "Failed to delete project" }, 500);
  }
};

export const updateProjectRoute = async (c: Context) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Project ID is required" }, 400);
    }

    // Get all fields to update from the request body
    const updates = await c.req.json();

    // Prevent updating the primary key
    if ("id" in updates) {
      delete updates.id;
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No fields provided to update" }, 400);
    }

    const [updatedProject] = await db
      .update(Projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(Projects.id, id))
      .returning();

    if (!updatedProject) {
      return c.json({ error: "Project not found" }, 404);
    }

    return c.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return c.json({ error: "Failed to update project" }, 500);
  }
};
