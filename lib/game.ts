import * as path from "path";
import * as fs from "fs";
import { cosinesim, normalizeVietnameseText } from "./utils";


// We'll use a simple model here for demonstration purposes
// In a real application, you'd load a pre-trained model
const VECTOR_DIM = 100;
const wordVectors = new Map<string, number[]>();

/**
 * Initialize word vectors
 * This is a simplified version for demonstration purposes
 * In a real app, you would load a pre-trained Vietnamese word embedding model.
 */
export async function initWordVectors(wordList: string[]): Promise<void> {
  // Check if we've already loaded the vectors
  if (wordVectors.size > 0) return;

  try {
    // Attempt to load vectors from a JSON file if it exists
    const vectorsPath = path.join(process.cwd(), "data", "word_vectors.json");

    if (fs.existsSync(vectorsPath)) {
      const vectorsData = JSON.parse(fs.readFileSync(vectorsPath, "utf8"));
      Object.entries(vectorsData).forEach(([word, vector]) => {
        wordVectors.set(word, vector as number[]);
      });
      console.log(`Loaded ${wordVectors.size} word vectors from file`);
      return;
    }
  } catch (error) {
    console.error("Error loading word vectors from file:", error);
  }

  // If no vectors file exists, create random vectors for demonstration purposes
  console.log("Generating random word vectors for demonstration purposes...");

  // In a real application, you would load a pre-trained model here
  // For now, we'll create random vectors (this won't produce meaningful results)
  wordList.forEach((word) => {
    const normalizedWord = normalizeVietnameseText(word);
    // Create a random vector for each word
    const vector = Array(VECTOR_DIM)
      .fill(0)
      .map(() => Math.random() * 2 - 1);
    wordVectors.set(normalizedWord, vector);
  });

  console.log(`Generated ${wordVectors.size} random word vectors`);
}

/**
 * Get a random word from the word list that has a vector
 */
export function getSecretWord(wordList: string[]): string {
  // Filter words that have vectors
  const wordsWithVectors = wordList.filter((word) => {
    const normalizedWord = normalizeVietnameseText(word);
    return wordVectors.has(normalizedWord);
  });

  if (wordsWithVectors.length === 0) {
    throw new Error("No words with vectors available");
  }

  // Select a random word
  const randomIndex = Math.floor(Math.random() * wordsWithVectors.length);
  return normalizeVietnameseText(wordsWithVectors[randomIndex]);
}

/**
 * Calculate similarity between two words
 */
export function getWordSimilarity(word1: string, word2: string): number {
  const normalizedWord1 = normalizeVietnameseText(word1);
  const normalizedWord2 = normalizeVietnameseText(word2);

  const vector1 = wordVectors.get(normalizedWord1);
  const vector2 = wordVectors.get(normalizedWord2);

  if (!vector1 || !vector2) {
    return 0;
  }

  return cosinesim(vector1, vector2);
}

/**
 * Calculate ranks for all words relative to the secret word
 */
export async function getAllWordRanks(
  secretWord: string,
  wordList: string[]
): Promise<Map<string, number>> {
  // Ensure vectors are initialized
  await initWordVectors(wordList);

  const secretWordVector = wordVectors.get(secretWord);
  if (!secretWordVector) {
    throw new Error("Secret word vector not found");
  }

  // Calculate similarities for all words
  const similarities: { word: string; similarity: number }[] = [];

  wordList.forEach((word) => {
    const normalizedWord = normalizeVietnameseText(word);
    const wordVector = wordVectors.get(normalizedWord);

    if (wordVector) {
      const similarity = cosinesim(secretWordVector, wordVector);
      similarities.push({ word: normalizedWord, similarity });
    }
  });

  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Create a map of word to rank
  const wordRanks = new Map<string, number>();
  similarities.forEach((item, index) => {
    wordRanks.set(item.word, index + 1);
  });

  return wordRanks;
}
