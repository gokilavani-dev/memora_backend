# Memora Backend

Personal AI Knowledge Assistant — backend API. Node.js, Express, TypeScript, AWS DynamoDB, AWS S3, and Google Gemini.

Notes and documents go in, and Memora lets you **ask questions about them in natural language** — powered by a full Retrieval-Augmented Generation (RAG) pipeline built from scratch.

---

## Highlights

- **RAG pipeline** — PDF text extraction → chunking with overlap → Gemini embeddings → DynamoDB vector storage → cosine-similarity retrieval → grounded Gemini answers
- **JWT authentication** with per-user, ownership-checked access to every note
- **Automated tests** (Jest) covering core retrieval logic
- **CI/CD** — GitHub Actions runs the test suite on every push
- **Clean, layered backend** — routes → controllers → services, with a centralized error-handling middleware

## Tech Stack

- **Runtime**: Node.js, Express, TypeScript
- **Auth**: JWT (jsonwebtoken), bcrypt for password hashing
- **Database**: AWS DynamoDB — `Users`, `Notes`, `Files`, and `Chunks` tables
- **Storage**: AWS S3 (presigned uploads/downloads)
- **AI**: Google Gemini — `gemini-embedding-001` for embeddings, `gemini-3.6-flash` for summarization and question answering
- **Testing**: Jest, ts-jest
- **CI/CD**: GitHub Actions
- **Dev tools**: ts-node-dev, dotenv

## Features

- User signup / login with JWT-based authentication
- Notes CRUD, scoped per authenticated user
- PDF upload via presigned S3 URLs, text extraction, AI summarization + action items
- Audio note transcription (Gemini multimodal)
- **Ask AI** — ask a question about any note; the backend retrieves the most relevant chunks via semantic search and answers using only that content, with cited chunk IDs
- Ownership checks on every note-scoped route (a user can never read or query another user's note, even with a valid token)
- Centralized error-handling middleware — no repeated try/catch boilerplate in controllers

## Project Structure

```
src/
├── config/          # DynamoDB, S3, Gemini client setup
├── controllers/      # Request handlers (thin layer)
├── services/          # Business logic
│   ├── chunking.service.ts     # Paragraph-based chunking with overlap
│   ├── embedding.service.ts    # Gemini embeddings (batched)
│   ├── similarity.service.ts   # Cosine similarity, retrieval, RAG answer generation
│   ├── note.service.ts
│   ├── files.service.ts
│   └── auth.service.ts
├── models/            # TypeScript interfaces
├── middleware/        # JWT auth, global error handler
├── routes/            # Route definitions per feature
├── app.ts             # Express app setup
└── server.ts          # Entry point

src/services/*.test.ts  # Jest unit tests
.github/workflows/      # CI pipeline
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
   S3_BUCKET_NAME=<your-bucket>
   GEMINI_API_KEY=<your-key>
   ```
3. Create the following DynamoDB tables in your AWS account:
   | Table | Partition Key | Sort Key | Notes |
   |--------|---------------------|-------------|----------------------------------|
   | Users | `id` (String) | — | GSI `email-index` on `email` |
   | Notes | `userId` (String) | `noteId` | |
   | Files | `userId` (String) | `fileId` | |
   | Chunks | `noteId` (String) | `chunkId` | stores text + embedding per chunk|
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:4000`.

## Running Tests

```bash
npm test
```

Tests cover the RAG retrieval math (cosine similarity) and run automatically on every push via GitHub Actions (see `.github/workflows/`).

## API Documentation

See [API.md](./API.md) for full endpoint documentation, including the Ask AI (RAG) endpoint, with request/response examples.

## How the RAG Pipeline Works

```
PDF uploaded → text extracted → chunked (with overlap) → each chunk embedded (Gemini)
                                                                    ↓
                                                        stored in DynamoDB (Chunks table)

User asks a question → question embedded → compared against all stored
chunk embeddings via cosine similarity → top-K most relevant chunks selected
→ fed to Gemini along with the question → grounded answer returned
```

## Companion Project

The Flutter frontend for this API lives in a separate repository ([memora_app](../memora_app)) and follows a Clean Architecture pattern (DataSource → Repository → UseCase → Bloc) with its own test suite and CI pipeline.

## Roadmap

- [x] Auth backend + Notes CRUD
- [x] File upload (S3), PDF parsing, AI summarization
- [x] RAG — chunking, embeddings, vector storage, semantic search, grounded Q&A
- [x] Automated testing (Jest) + CI (GitHub Actions)
- [ ] Rate-limit-aware retry/backoff for Gemini calls
- [ ] Cursor-based pagination for notes list
- [ ] Swagger/OpenAPI docs (currently using `API.md`)
