import { chunkText } from "./services/chunking.service";

const sampleText = `This is the first paragraph about Newton's law.

This is the second paragraph about something else entirely.

This is the third paragraph, also unrelated.`;

const result = chunkText(sampleText, 10); // chunkSize=10 (chinna number, testing easy-ஆக இருக்க)
console.log(result);
