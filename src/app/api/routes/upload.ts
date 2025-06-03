import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Context } from "hono";
import { s3, BUCKET_NAME, CLOUDFRONT_BASE_URL } from "../config/hono";

export const uploadRoute = async (c: Context) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("files");
    const urls: string[] = [];

    for (const file of files) {
      if (typeof file === "string") continue;

      try {
        const ext = file.name.split(".").pop();
        const key = `uploads/${uuidv4()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
          })
        );
        urls.push(`${CLOUDFRONT_BASE_URL}/${key}`);
      } catch (fileError) {
        console.error("Error processing file:", file.name, fileError);
        throw fileError;
      }
    }

    return c.json({ urls });
  } catch (error) {
    console.error("Upload route error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
};
