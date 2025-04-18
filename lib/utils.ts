import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Calculate the cosine similarity between two vectors
 * @param vecA First vector
 * @param vecB Second vector
 * @returns Cosine similarity value between -1 and 1
 */
export function cosinesim(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Simple function to normalize Vietnamese text
 * @param text Text to normalize
 * @returns Normalized text
 */
export function normalizeVietnameseText(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Merge class names
 * @param inputs Class values
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
