import genAI from "../config/gemini";
import ddb from "../config/dynamoClient"; // 👈 புது import, மேல சேருங்க
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb"; // 👈 புது import, மேல சேருங்க

interface Chunk {
  chunkId: string;
  text: string;
  embedding?: number[];
}

export async function embedText(text: string): Promise<number[]> {
  const response = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  return response.embeddings?.[0]?.values ?? [];
}

export async function embedChunks(chunks: Chunk[]): Promise<Chunk[]> {
  for (const chunk of chunks) {
    const response = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: chunk.text,
    });

    chunk.embedding = response.embeddings?.[0]?.values ?? [];
  }

  return chunks;
}

// 👇 இதுதான் புது function, கடைசியில சேருங்க
export async function saveChunksToDb(noteId: string, chunks: Chunk[]) {
  const writeRequests = chunks.map((chunk) => ({
    PutRequest: {
      Item: {
        noteId: noteId,
        chunkId: chunk.chunkId,
        text: chunk.text,
        embedding: chunk.embedding,
      },
    },
  }));

  await ddb.send(
    new BatchWriteCommand({
      RequestItems: {
        Chunks: writeRequests,
      },
    }),
  );
}
