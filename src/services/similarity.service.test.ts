import { cosineSimilarity } from "./similarity.service";

describe("cosineSimilarity", () => {
  test("returns 1 for identical vectors", () => {
    const result = cosineSimilarity([1, 2, 3], [1, 2, 3]);
    expect(result).toBeCloseTo(1);
  });

  test("returns -1 for opposite vectors", () => {
    const result = cosineSimilarity([1, 2, 3], [-1, -2, -3]);
    expect(result).toBeCloseTo(-1);
  });
});
