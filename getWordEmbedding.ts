import { GoogleGenAI } from "@google/genai";

export async function embedContent(content) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.embedContent({
    model: "gemini-embedding-exp-03-07",
    contents: content,
    config: {
      taskType: "SEMANTIC_SIMILARITY",
    },
  });

  console.log(response.embeddings);
}
