// lib/createResource.ts
import { z } from "zod";
import { safeQuery } from "../db";

export const insertResourceSchema = z.object({
  content: z.string().min(1),
});

export type NewResourceParams = z.infer<typeof insertResourceSchema>;

// Call your FastAPI embedding server
async function generateEmbeddings(text: string): Promise<number[][]> {
  console.log("Generating embeddings for text:", text);
  const res = await fetch(`${process.env.EMBEDDING_API_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error("Embedding generation failed");

  const data = await res.json();

  console.log("Embedding data:", data);
  return data.embeddings;
}

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);

    console.log("Creating resource with content:", content);

    // 1. Insert resource into MSSQL
    const result = await safeQuery<{ id: number }>(
      `INSERT INTO Resource (content)
       OUTPUT inserted.id
       VALUES ($1);`,
      [content]
    );

    const resourceId = result.rows[0].id;

    // 2. Generate embeddings
    const embeddingVectors = await generateEmbeddings(content);

    console.log("Generated embeddings:", embeddingVectors);

    // 3. Insert embeddings into MSSQL
    for (let i = 0; i < embeddingVectors.length; i++) {
      const vector = embeddingVectors[i];

      await safeQuery(
        `INSERT INTO Embedding (resourceId, vectorIndex, value)
         VALUES ${vector
           .map((_, j) => `(${resourceId}, ${j}, $${j + 1})`)
           .join(",")};`,
        vector
      );
    }

    console.log("Resource and embeddings inserted with ID:", resourceId);

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error ? error.message : "Error, please try again.";
  }
};
