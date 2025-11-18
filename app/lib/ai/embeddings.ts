import { safeQuery } from "../db";

const dot = (a: number[], b: number[]) =>
  a.reduce((sum, v, i) => sum + v * b[i], 0);

const norm = (a: number[]) => Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));

const cosineSimilarity = (a: number[], b: number[]) =>
  dot(a, b) / (norm(a) * norm(b));

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  return data.embeddings[0]; // first vector
}

export async function findRelevantContent(query: string) {
  const queryEmbedding = await getEmbedding(query);

  // Fetch all embeddings from DB
  const embRows = await safeQuery<{
    resourceId: number;
    vectorIndex: number;
    value: number;
  }>(`SELECT resourceId, vectorIndex, value FROM Embedding`);

  const vectors = new Map<number, number[]>();

  for (const row of embRows.rows) {
    if (!vectors.has(row.resourceId)) vectors.set(row.resourceId, []);
    vectors.get(row.resourceId)![row.vectorIndex] = row.value;
  }

  const scored = [...vectors.entries()].map(([id, vector]) => ({
    id,
    score: cosineSimilarity(queryEmbedding, vector),
  }));

  const top = scored.sort((a, b) => b.score - a.score)[0];

  if (!top || top.score < 0.1) return "";

  const result = await safeQuery<{ id: number; content: string }>(
    `SELECT content FROM Resource WHERE id = ${top.id}`
  );

  if (!result.rows.length) return "";

  return result.rows[0].content; // <-- RETURN ONLY THE STRING
}
