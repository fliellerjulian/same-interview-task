import {
  integer,
  pgTable,
  varchar,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const Projects = pgTable("projects", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  chat: jsonb("chat")
    .$type<{
      messages: Array<{
        id: string;
        role: "user" | "assistant" | "system";
        content: string;
        parts?: Array<{
          type: "text";
          text: string;
        }>;
      }>;
    }>()
    .default({ messages: [] }),
});
