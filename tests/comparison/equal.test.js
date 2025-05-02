import { EqualComparisonModel } from "../src/comparators/models/index.js";
import { Response } from "../src/response/index.js";
import { $ } from "../src/callers/index.js";

// Re-introduce identity function
const identity = $((a) => a);

// Helper function to create responses with consistent input and caller
const createResponse = (output) => new Response(output, identity, "input");

describe('EqualComparisonModel', () => {
  describe('Basic Equality Comparisons', () => {
    it('should return 1.0 for identical arrays', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse(["word1", "word2", "word3"]);
      const reviewer2 = createResponse(["word1", "word2", "word3"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0);
    });

    it('should return 0.0 for completely different arrays', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse(["word1", "word2", "word3"]);
      const reviewer2 = createResponse(["other1", "other2", "other3"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(0.0);
    });

    it('should handle arrays of different lengths', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse(["word1", "word2", "word3"]);
      const reviewer2 = createResponse(["word1", "word2"]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeCloseTo(0.67, 2); // 2/3 matches
    });
  });

  describe('Mixed Content Types', () => {
    it('should handle arrays with mixed content types', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse([1, "two", true, null, undefined]);
      const reviewer2 = createResponse([1, "two", true, null, undefined]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0);
    });

    it('should return partial match for arrays with some matching mixed content types', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse([1, "two", true, null, undefined]);
      const reviewer2 = createResponse([1, "two", false, 0, undefined]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBeCloseTo(0.6, 2); // 3 out of 5 elements match (1, "two", undefined)
    });
  });

  describe('Nested Arrays', () => {
    it('should handle nested arrays correctly', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse([
        ["word1", "word2"],
        ["word3", "word4"],
        ["word5", "word6"]
      ]);
      const reviewer2 = createResponse([
        ["word1", "word2"],
        ["word3", "word4"],
        ["word5", "word6"]
      ]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0);
    });

    it('should return partial match for different nested arrays', () => {
      const model = new EqualComparisonModel();
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
      expect(comparison).toBeCloseTo(0.33, 2); // 1 out of 3 nested arrays match
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse([]);
      const reviewer2 = createResponse([]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0); // Empty arrays should be considered identical
    });

    it('should handle arrays with null values', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse([null, null, null]);
      const reviewer2 = createResponse([null, null, null]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0);
    });

    it('should handle arrays with undefined values', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse([undefined, undefined, undefined]);
      const reviewer2 = createResponse([undefined, undefined, undefined]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0);
    });

    it('should handle arrays with NaN values', () => {
      const model = new EqualComparisonModel();
      const reviewer1 = createResponse([NaN, NaN, NaN]);
      const reviewer2 = createResponse([NaN, NaN, NaN]);
      const comparison = reviewer2.compare(reviewer1).run(model);
      expect(comparison).toBe(1.0);
    });
  });
}); 