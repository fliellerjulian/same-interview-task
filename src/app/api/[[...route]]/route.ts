import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Create a new Hono app
const app = new Hono();

// Add CORS middleware
app.use("/*", cors());

// S3 client setup
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const CLOUDFRONT_BASE_URL = process.env.CLOUDFRONT_BASE_URL!;
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// File upload route
app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("files");
    const urls: string[] = [];

    for (const file of files) {
      if (typeof file === "string") continue;
      const ext = file.name.split(".").pop();
      const key = `uploads/${uuidv4()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: Buffer.from(arrayBuffer),
          ContentType: file.type,
        })
      );

      urls.push(`${CLOUDFRONT_BASE_URL}/${key}`);
    }

    return c.json({ urls });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});

// Export the handler for Vercel
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
