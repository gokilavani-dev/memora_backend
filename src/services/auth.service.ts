import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ddb from "../config/dynamoClient";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function signup(name: string, email: string, password: string) {
  const existing = await ddb.send(
    new QueryCommand({
      TableName: "Users",
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    }),
  );

  if (existing.Items && existing.Items.length > 0) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await ddb.send(
    new PutCommand({
      TableName: "Users",
      Item: newUser,
    }),
  );

  return { id: newUser.id, name: newUser.name, email: newUser.email };
}

export async function login(email: string, password: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: "Users",
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    }),
  );

  if (!result.Items || result.Items.length === 0) {
    throw new Error("Invalid credentials");
  }
  const foundUser = result.Items[0];

  if (!foundUser) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, foundUser.passwordHash);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const accessToken = jwt.sign(
    { userId: foundUser.id },
    process.env.JWT_SECRET!,
    {
      expiresIn: "15m",
    },
  );

  return {
    accessToken,
    user: { id: foundUser.id, name: foundUser.name, email: foundUser.email },
  };
}

//jwt.sign(payload, secret, options)
