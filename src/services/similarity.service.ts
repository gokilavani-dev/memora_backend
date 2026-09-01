import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import ddb from "../config/dynamoClient";
import genAI from "../config/gemini";
import { embedText } from "./embedding.service";

interface Chunk {
  chunkId: string;
  text: string;
  embedding?: number[];
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += (vecA[i] ?? 0) * (vecB[i] ?? 0);
  }

  let magnitudeA = 0;
  for (let i = 0; i < vecA.length; i++) {
    magnitudeA += (vecA[i] ?? 0) * (vecA[i] ?? 0);
  }
  magnitudeA = Math.sqrt(magnitudeA);

  let magnitudeB = 0;
  for (let i = 0; i < vecB.length; i++) {
    magnitudeB += (vecB[i] ?? 0) * (vecB[i] ?? 0);
  }
  magnitudeB = Math.sqrt(magnitudeB);

  return dotProduct / (magnitudeA * magnitudeB);
}

export async function getChunksByNoteId(noteId: string): Promise<Chunk[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: "Chunks",
      KeyConditionExpression: "noteId = :nid",
      ExpressionAttributeValues: {
        ":nid": noteId,
      },
    }),
  );

  return (result.Items as Chunk[]) ?? [];
}

export async function searchNotes(
  noteId: string,
  question: string,
  topK: number = 3,
) {
  // Step 1: user question-ஐ embed பண்ணுங்க
  const questionEmbedding = await embedText(question);

  // Step 2: இந்த note-oda எல்லா chunks-ஐயும் DynamoDB-ல இருந்து fetch பண்ணுங்க
  const chunks = await getChunksByNoteId(noteId);

  // Step 3: ஒவ்வொரு chunk-க்கும் similarity score கணக்கு போடுங்க
  const scoredChunks = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(questionEmbedding, chunk.embedding ?? []),
  }));

  // Step 4: score படி descending sort பண்ணுங்க (அதிக score முதல்ல)
  scoredChunks.sort((a, b) => b.score - a.score);

  // Step 5: top-K (மிக relevant K chunks) மட்டும் எடுங்க
  return scoredChunks.slice(0, topK);
}

export async function generateAnswer(
  question: string,
  relevantChunks: (Chunk & { score: number })[],
) {
  const context = relevantChunks.map((c) => c.text).join("\n\n---\n\n");

  const prompt = `Answer the question using ONLY the context below. If the answer isn't in the context, say so.

Context:
${context}

Question: ${question}`;

  const response = await genAI.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  return response.text;
}

export async function askQuestion(noteId: string, question: string) {
  console.log("Step 1: searching notes...");
  const topChunks = await searchNotes(noteId, question, 3);
  console.log("Step 2: chunks found, generating answer...");
  const answer = await generateAnswer(question, topChunks);
  console.log("Step 3: answer generated!");
  return { answer, sources: topChunks.map((c) => c.chunkId) };
}
