import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Context } from "hono";
import { s3, BUCKET_NAME, CLOUDFRONT_BASE_URL, openai } from "../config/hono";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const uploadRoute = async (c: Context) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("files");
    const urls: string[] = [];
    const openaiFiles: string[] = [];

    console.log("Received files:", files.length);

    for (const file of files) {
      if (typeof file === "string") continue;

      try {
        console.log("Processing file:", file.name, "Type:", file.type);
        const ext = file.name.split(".").pop();
        const key = `uploads/${uuidv4()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3
        console.log("Uploading to S3...");
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
          })
        );
        console.log("S3 upload successful");

        // Save file locally
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `${uuidv4()}.${ext}`);
        fs.writeFileSync(tempFilePath, buffer);
        console.log("File saved locally at:", tempFilePath);

        // Upload to OpenAI
        console.log("Uploading to OpenAI...");
        try {
          const openaiFile = await openai.files.create({
            file: fs.createReadStream(tempFilePath),
            purpose: "vision",
          });
          console.log("OpenAI upload successful:", openaiFile.id);
          openaiFiles.push(openaiFile.id);

          // Clean up temp file
          fs.unlinkSync(tempFilePath);
          console.log("Temporary file cleaned up");
        } catch (openaiError) {
          console.error("OpenAI upload failed:", openaiError);
          // Clean up temp file even if upload fails
          fs.unlinkSync(tempFilePath);
          throw openaiError;
        }

        urls.push(`${CLOUDFRONT_BASE_URL}/${key}`);
      } catch (fileError) {
        console.error("Error processing file:", file.name, fileError);
        throw fileError;
      }
    }

    console.log("All uploads completed successfully");
    return c.json({ urls, openaiFiles });
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
