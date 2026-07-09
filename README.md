# Memora Backend

Personal AI Knowledge Assistant — backend API. Built with Node.js, Express, TypeScript, and AWS DynamoDB.

This is a learn-by-building project. Current stage: **Month 1 — Auth backend + Notes CRUD** (complete).

## Tech Stack

- **Runtime**: Node.js, Express, TypeScript
- **Auth**: JWT (jsonwebtoken), bcrypt for password hashing
- **Database**: AWS DynamoDB (Users table, Notes table with GSI on email)
- **Dev tools**: ts-node-dev, dotenv

## Features (so far)

- User signup / login with JWT-based authentication
- Auth middleware to protect routes
- Notes CRUD (create, read all, read one, update, delete) — scoped per authenticated user

## Project Structure

```
src/
├── config/        # DynamoDB client setup
├── controllers/    # Request handlers (thin layer)
├── services/       # Business logic (DynamoDB calls, hashing, JWT)
├── models/         # TypeScript interfaces (User, Note)
├── middleware/     # JWT auth middleware
├── routes/         # Route definitions per feature
├── app.ts          # Express app setup
└── server.ts       # Entry point
```

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root with:
   ```
   PORT=4000
   JWT_SECRET=<your-secret>
   AWS_ACCESS_KEY_ID=<your-key>
   AWS_SECRET_ACCESS_KEY=<your-secret>
   AWS_REGION=ap-south-1
   ```
3. Create two DynamoDB tables in your AWS account:
   - `Users` — partition key `id` (String), GSI `email-index` on `email`
   - `Notes` — partition key `userId` (String), sort key `noteId` (String)
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:4000`.

## API Documentation

See [API.md](./API.md) for full endpoint documentation (request/response examples).

## Roadmap

- **Month 1** ✅ — Auth backend + Notes CRUD
- **Month 2** — File upload (S3), PDF parsing, AI summarization
- **Month 3** — Embeddings, vector DB, semantic search (RAG)
- **Month 4** — AI chat assistant, streaming, memory
- **Month 5** — Docker, CI/CD, AWS deployment
