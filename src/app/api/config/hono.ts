import { Hono } from "hono";
import { cors } from "hono/cors";
import { S3Client } from "@aws-sdk/client-s3";
import OpenAI from "openai";

// Create a new Hono app
const app = new Hono();

// Add CORS middleware
app.use("/*", cors());

// S3 client setup
export const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
export const CLOUDFRONT_BASE_URL = process.env.CLOUDFRONT_BASE_URL!;
export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// OpenAI client setup
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default app;
