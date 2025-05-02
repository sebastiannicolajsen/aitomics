import { DistanceComparisonModel } from "../src/comparators/models/index.js";
import { Response } from "../src/response/index.js";
import { $ } from "../src/callers/index.js";

// Re-introduce identity function
const identity = $((a) => a);

// Helper function to create responses with consistent input and caller
const createResponse = (output) => new Response(output, identity, "input");

describe('DistanceComparisonModel', () => {
  describe('Basic Distance Comparisons', () => {
    it('should return 1.0 for identical arrays', () => {
      const model = new DistanceComparisonModel(1, ["word1", "word2", "word3"]);
      const reviewer1 = createResponse(["word1", "word2", "word3"]);
      const reviewer2 = createResponse(["word1", "word2", "word3"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0);
    });

    it('should return 0.0 for completely different arrays', () => {
      const model = new DistanceComparisonModel(1, ["word1", "word2", "word3", "other1", "other2", "other3"]);
      const reviewer1 = createResponse(["word1", "word2", "word3"]);
      const reviewer2 = createResponse(["other1", "other2", "other3"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeCloseTo(0.167, 3); // One adjacent pair (word3-other1) gives 0.5/3
    });

    it('should handle arrays of different lengths', () => {
      const model = new DistanceComparisonModel(1, ["word1", "word2", "word3"]);
      const reviewer1 = createResponse(["word1", "word2", "word3"]);
      const reviewer2 = createResponse(["word1", "word2"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeCloseTo(0.67, 2); // 2/3 matches
    });
  });

  describe('Custom Weight Functions', () => {
    it('should use binary weight function (0 or 1)', () => {
      const model = new DistanceComparisonModel(1, ["word1", "word2", "word3", "other"], (a, b) => a === b ? 1 : 0);
      const reviewer1 = createResponse(["word1", "word2", "word3"]);
      const reviewer2 = createResponse(["word1", "other", "word3"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeCloseTo(0.67, 2); // 2/3 exact matches
    });

    it('should use lenient weight function', () => {
      const model = new DistanceComparisonModel(1, ["word1", "word2", "word3", "word2x", "other"], (a, b) => {
        if (a === b) return 1;
        if (a.includes(b) || b.includes(a)) return 0.8;
        return 0.2;
      });
      const reviewer1 = createResponse(["word1", "word2", "word3"]);
      const reviewer2 = createResponse(["word1", "word2x", "other"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeCloseTo(0.67, 2); // Should be higher than binary due to partial match
    });

    it('should use semantic weight function', () => {
      const model = new DistanceComparisonModel(1, ["happy", "joyful", "cheerful", "sad", "unhappy", "miserable", "neutral"], (a, b) => {
        const synonyms = {
          "happy": ["joyful", "cheerful"],
          "sad": ["unhappy", "miserable"]
        };
        if (a === b) return 1;
        if (synonyms[a]?.includes(b) || synonyms[b]?.includes(a)) return 0.8;
        return 0.2;
      });
      const reviewer1 = createResponse(["happy", "sad", "neutral"]);
      const reviewer2 = createResponse(["joyful", "unhappy", "neutral"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeGreaterThan(0.67); // Should be higher due to synonyms
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle nested arrays', () => {
      const model = new DistanceComparisonModel(1, ["word1", "word2", "word3", "word4", "word5", "word6", "other"]);
      const reviewer1 = createResponse([
        ["word1", "word2"],
        ["word3", "word4"],
        ["word5", "word6"]
      ]);
      const reviewer2 = createResponse([
        ["word1", "word2"],
        ["word3", "other"],
        ["other", "word6"]
      ]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeGreaterThan(0);
      expect(comparison).toBeLessThan(1);
    });

    it('should handle mixed content types', () => {
      const model = new DistanceComparisonModel(1, ["text1", "word1", "word2", "other", "value"]);
      const reviewer1 = createResponse([
        "text1",
        ["word1", "word2"],
        { key: "value" }
      ]);
      const reviewer2 = createResponse([
        "text1",
        ["word1", "other"],
        { key: "other" }
      ]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeGreaterThan(0);
      expect(comparison).toBeLessThan(1);
    });

    it('should handle empty arrays', () => {
      const model = new DistanceComparisonModel(1, []);
      const reviewer1 = createResponse([]);
      const reviewer2 = createResponse([]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0); // Empty arrays should be considered identical
    });
  });
}); 