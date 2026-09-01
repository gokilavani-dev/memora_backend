import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import ddb from "../config/dynamoClient";
import pdfParse from "pdf-parse";
import genAI from "../config/gemini";

export async function generateUploadUrl(
  userId: string,
  fileName: string,
  fileType: string,
) {
  const fileId = randomUUID();
  const key = `${userId}/${fileId}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const item = {
    userId: userId,
    fileId: fileId,
    s3Key: key,
    fileName: fileName,
    fileType: fileType,
    status: "pending_upload",
    createdAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: "Files", Item: item }));
  return { uploadUrl, key, fileId };
}

export async function processUploadedFile(userId: string, fileId: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: "Files",
      Key: {
        userId: userId,
        fileId: fileId,
      },
    }),
  );
  const file = result.Item;
  if (!file) {
    throw new Error("File not found");
  }
  const s3Response = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.s3Key,
    }),
  );
  const chunks: Buffer[] = [];
  for await (const chunk of s3Response.Body as any) {
    chunks.push(chunk);
  }
  const fileBuffer = Buffer.concat(chunks);
  const pdfData = await pdfParse(fileBuffer);

  const extractedText = pdfData.text;

  await ddb.send(
    new UpdateCommand({
      TableName: "Files",
      Key: {
        userId: userId,
        fileId: fileId,
      },
      UpdateExpression: "SET #status = :status, extractedText = :text",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "processed",
        ":text": extractedText,
      },
    }),
  );
  return {
    ...file,
    status: "processed",
    extractedText,
  };
}

export async function summarizeFile(userId: string, fileId: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: "Files",
      Key: {
        userId: userId,
        fileId: fileId,
      },
    }),
  );
  const file = result.Item;
  if (!file) {
    throw new Error("File not found");
  }
  if (!file.extractedText) {
    throw new Error("File not yet processed");
  }
  const prompt = `Analyze the following note and respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "summary": "3-4 sentence summary here",
  "actionItems": ["action item 1", "action item 2"]
}
If there are no action items, return an empty array.

Text:
${file.extractedText.slice(0, 15000)}`;
  const response = await genAI.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });
  const rawText = response.text;
  if (!rawText) {
    throw new Error("Empty response from Gemini");
  }
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  const summary = parsed.summary;
  const actionItems = parsed.actionItems;
  await ddb.send(
    new UpdateCommand({
      TableName: "Files",
      Key: { userId, fileId },
      UpdateExpression:
        "SET #status = :status, summary = :summary, actionItems = :actionItems",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "summarized",
        ":summary": summary,
        ":actionItems": actionItems,
      },
    }),
  );
  return { ...file, status: "summarized", summary, actionItems };
}

export async function transcribeAudio(userId: string, fileId: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: "Files",
      Key: { userId, fileId },
    }),
  );
  const file = result.Item;
  if (!file) {
    throw new Error("File not found");
  }

  const s3Response = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.s3Key,
    }),
  );
  const chunks: Buffer[] = [];
  for await (const chunk of s3Response.Body as any) {
    chunks.push(chunk);
  }
  const audioBuffer = Buffer.concat(chunks);
  const base64Audio = audioBuffer.toString("base64");

  const response = await genAI.models.generateContent({
    model: "gemini-flash-latest",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze this audio note and respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "transcript": "full transcription here",
  "summary": "2-3 sentence summary",
  "actionItems": ["item 1", "item 2"]
}
If there is no speech, return empty strings/array for those fields.`,
          },
          { inlineData: { mimeType: file.fileType, data: base64Audio } },
        ],
      },
    ],
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Empty response from Gemini");
  }
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  const transcript = parsed.transcript;
  const summary = parsed.summary;
  const actionItems = parsed.actionItems;
  await ddb.send(
    new UpdateCommand({
      TableName: "Files",
      Key: { userId, fileId },
      UpdateExpression:
        "SET #status = :status, transcript = :transcript, summary = :summary, actionItems = :actionItems",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "transcribed",
        ":transcript": transcript,
        ":summary": summary,
        ":actionItems": actionItems,
      },
    }),
  );

  return { ...file, status: "transcribed", transcript, summary, actionItems };
}

export async function getDownloadUrl(userId: string, fileId: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: "Files",
      Key: {
        userId: userId,
        fileId: fileId,
      },
    }),
  );
  const file = result.Item;
  if (!file) {
    throw new Error("File not found");
  }
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.s3Key,
  });
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return { downloadUrl, fileName: file.fileName };
}
