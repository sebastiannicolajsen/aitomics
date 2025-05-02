import { CohensComparisonModel } from "../src/comparators/models/index.js";
import { ComparisonModel } from "../src/comparators/comparator.js";
import { Response } from "../src/response/index.js";
import { $ } from "../src/callers/index.js";

// Re-introduce identity function
const identity = $((a) => a);

// Helper function to create responses with consistent input and caller
const createResponse = (output) => new Response(output, identity, "input");

describe('CohensComparisonModel', () => {
  // Model now compares on the presence ("positive") or absence ("") of a single category
  describe('Single Category Agreement', () => {
    it('should return 1.0 for perfect agreement (positive/empty)', () => {
      // Instantiate model WITH the label "positive"
      const model = new CohensComparisonModel("positive");
      const reviewer1 = [
        createResponse("positive"),
        createResponse(""),
        createResponse("positive"),
        createResponse("")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse(""),
        createResponse("positive"),
        createResponse("")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBe(1.0);
    });

    it('should return 0.6', () => {
      // Instantiate model WITH the label "positive"
      const model = new CohensComparisonModel("positive");
      const reviewer1 = [
        createResponse("positive"), // Agree
        createResponse("positive"), // Agree
        createResponse("positive"), // Disagree
        createResponse(""),          // Agree
        createResponse("")           // Agree
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("positive"),
        createResponse(""),
        createResponse(""),
        createResponse("")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      // Po = 4/5 = 0.8
      // Pe = (P1_pos * P2_pos) + (P1_empty * P2_empty)
      // Pe = (3/5 * 2/5) + (2/5 * 3/5) = (0.6 * 0.4) + (0.4 * 0.6) = 0.24 + 0.24 = 0.48
      // Kappa = (0.8 - 0.48) / (1 - 0.48) = 0.32 / 0.52 = 0.61538...
      expect(comparison).toBeCloseTo(0.6, 1);
    });

    it('should return -1.0', () => {
      // Instantiate model WITH the label "positive"
      const model = new CohensComparisonModel("positive");
      const reviewer1 = [
        createResponse("positive"),
        createResponse("")
      ];
      const reviewer2 = [
        createResponse(""),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      // Kappa = (Po - Pe) / (1 - Pe) = (0 - 0.5) / (1 - 0.5) = -1.0
      expect(comparison).toBe(-1.0);
    });

    it('should return -0.5', () => {
      // Instantiate model WITH the label "positive"
      const model = new CohensComparisonModel("positive");
      const reviewer1 = [
        createResponse("positive"), // Agree
        createResponse("positive"), // Disagree
        createResponse("positive"), // Disagree
        createResponse("")           // Disagree
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse(""),
        createResponse(""),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      // Po = 1/4 = 0.25
      // Pe = (P1_pos * P2_pos) + (P1_empty * P2_empty)
      // Pe = (3/4 * 2/4) + (1/4 * 2/4) = (0.75 * 0.5) + (0.25 * 0.5) = 0.375 + 0.125 = 0.5
      // Kappa = (0.25 - 0.5) / (1 - 0.5) = -0.25 / 0.5 = -0.5
      expect(comparison).toBeCloseTo(-0.5, 1);
    });

    it('should return 0.0', () => {
      // Instantiate model WITH the label "positive"
      const model = new CohensComparisonModel("positive");
      const reviewer1 = [
        createResponse("positive"), // Agree
        createResponse("positive"), // Disagree
        createResponse(""),          // Disagree
        createResponse("")           // Agree
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse(""),
        createResponse("positive"),
        createResponse("")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      // Po = 0.5, Pe = 0.5 => Kappa = (0.5 - 0.5) / (1 - 0.5) = 0.0
      expect(comparison).toBe(0.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single category (all positive)', () => {
      // Instantiate model WITH the label "positive"
      const model = new CohensComparisonModel("positive");
      const reviewer1 = [
        createResponse("positive"),
        createResponse("positive")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBe(1.0);
    });

    it('should handle single category (all empty)', () => {
      // Instantiate model WITH the label "positive"
      const model = new CohensComparisonModel("positive");
      const reviewer1 = [
        createResponse(""),
        createResponse("")
      ];
      const reviewer2 = [
        createResponse(""),
        createResponse("")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBe(1.0);
    });

    it('should handle empty responses', () => {
      // Instantiate model WITH the label "positive"
      const model = new CohensComparisonModel("positive");
      const reviewer1 = [];
      const reviewer2 = [];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBe(1.0); // Agreement on empty sets is 1.0
    });
  });
}); 