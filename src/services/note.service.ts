import { v4 as uuidv4 } from "uuid";
import ddb from "../config/dynamoClient";
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { embedChunks, saveChunksToDb } from "./embedding.service";
import { chunkText } from "./chunking.service";

export async function createNote(
  userId: string,
  title: string,
  content: string,
  fileId?: string,
  fileName?: string,
) {
  const newNote = {
    userId,
    noteId: uuidv4(),
    title,
    content,
    fileId,
    fileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await ddb.send(new PutCommand({ TableName: "Notes", Item: newNote }));

  // 👇 புது logic — chunking pipeline
  let textToChunk = content; // default: plain note content

  if (fileId) {
    const fileResult = await ddb.send(
      new GetCommand({
        TableName: "Files",
        Key: { userId, fileId },
      }),
    );
    if (fileResult.Item?.extractedText) {
      textToChunk = fileResult.Item.extractedText; // file இருந்தா, முழு text use பண்ணு
    }
  }

  const chunks = chunkText(textToChunk);
  const embeddedChunks = await embedChunks(chunks);
  await saveChunksToDb(newNote.noteId, embeddedChunks);

  return newNote;
}

export async function getNotes(userId: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: "Notes",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    }),
  );
  return result.Items || [];
}

export async function getNote(userId: string, noteId: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: "Notes",
      Key: { userId, noteId },
    }),
  );
  return result.Item;
}

export async function updateNote(
  userId: string,
  noteId: string,
  title: string,
  content: string,
) {
  const result = await ddb.send(
    new UpdateCommand({
      TableName: "Notes",
      Key: { userId, noteId },
      UpdateExpression:
        "SET title = :title, content = :content, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":title": title,
        ":content": content,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    }),
  );
  return result.Attributes;
}

export async function deleteNote(userId: string, noteId: string) {
  await ddb.send(
    new DeleteCommand({
      TableName: "Notes",
      Key: { userId, noteId },
    }),
  );
}
