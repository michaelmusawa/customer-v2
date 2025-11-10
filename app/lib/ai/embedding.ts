import poolPromise from "../db";
import axios from "axios";

const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

/**
 * Helper: Split text into sentence-like chunks
 */
const generateChunks = (input: string): string[] =>
  input
    .trim()
    .split(".")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

/**
 * Call FastAPI /embed endpoint
 */
async function getEmbeddingFromAPI(text: string): Promise<number[]> {
  const res = await axios.post(`${FASTAPI_URL}/embed`, { text });
  return res.data.embedding as number[];
}

/**
 * Produce chunk embeddings
 */
export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
  console.log("Generating embeddings for value:", value);
  const chunks = generateChunks(value);

  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await getEmbeddingFromAPI(chunk);

      console.log("Generated embedding for chunk:", { chunk, embedding });
      return embedding;
    })
  );

  return chunks.map((content, i) => ({
    content,
    embedding: embeddings[i],
  }));
};

/**
 * Single-string embedding
 */
export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const embedding = await getEmbeddingFromAPI(input);
  return embedding;
};

/**
 * Cosine similarity util
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.hypot(...vecA);
  const magB = Math.hypot(...vecB);
  return magA && magB ? dot / (magA * magB) : 0;
};

/**
 * Query your DB and find top-k relevant content
 */
export async function findRelevantContent(
  userQuery: string
): Promise<{ content: string; similarity: number }[] | string> {
  try {
    const userVec = await generateEmbedding(userQuery);
    const pool = await poolPromise;

    const { recordset } = await pool.request().query(`
      SELECT e.vector, r.content
      FROM Embedding e
      JOIN Resource r ON e."resourceId" = r.id
    `);

    const results = recordset
      .map((row: any) => {
        const stored = JSON.parse(row.vector) as number[];
        return {
          content: row.content,
          similarity: cosineSimilarity(userVec, stored),
        };
      })
      .filter((r) => r.similarity > 0.35)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 4);

    return results.length ? results : "Sorry, I don't know.";
  } catch (err) {
    console.error("Error finding relevant content:", err);
    return "Error retrieving relevant content.";
  }
}
