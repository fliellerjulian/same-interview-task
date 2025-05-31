import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function uploadFiles(files: FileList | File[]): Promise<string[]> {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));
  const res = await fetch("/api/upload-s3", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.urls as string[];
}
