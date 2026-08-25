interface Chunk {
  chunkId: string;
  text: string;
}

export function chunkText(text: string, chunkSize: number = 500): Chunk[] {
  const paragraphs = text.split("\n\n");
  const OVERLAP_WORDS = 50;

  const chunks: Chunk[] = [];
  let currentChunk = "";
  let currentWordCount = 0;
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if (para.trim() === "") continue;

    const paraWordCount = para.split(" ").length;

    if (currentWordCount + paraWordCount > chunkSize) {
      chunks.push({
        chunkId: `chunk-${chunkIndex}`,
        text: currentChunk,
      });
      chunkIndex++;
      const overlapWords = currentChunk
        .split(" ")
        .slice(-OVERLAP_WORDS)
        .join(" ");
      currentChunk = overlapWords + " ";
      currentWordCount = overlapWords.split(" ").length;
    }

    currentChunk += para + "\n\n";
    currentWordCount += paraWordCount;
  }

  if (currentChunk) {
    chunks.push({
      chunkId: `chunk-${chunkIndex}`,
      text: currentChunk,
    });
  }

  return chunks;
}
