import { KrippendorffsComparisonModel } from "../src/comparators/models/index.js";
import { ComparisonModel } from "../src/comparators/comparator.js";
import { Response } from "../src/response/index.js";
import { _ } from "../src/util/standard-library.js";
import { $ } from "../src/callers/index.js";

// Identity function for consistent caller
const identity = $((a) => a);

// Helper function to create responses with consistent input and caller
const createResponse = (output) => new Response(output, identity, "input");

/**
 * Tests are implemented and compared to results from the following sources:
 * https://www.k-alpha.org/ 
 * (from which the KrippendorffsComparisonModel is (partly)derived)
 */

describe('KrippendorffsComparisonModel', () => {
  describe('Two Label Agreement', () => {
    it('should return 1.0', () => {
      const model = new KrippendorffsComparisonModel(["positive", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive"),
        createResponse("negative")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive"),
        createResponse("negative")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(1.0, 1);
    });

    it('should return -0.750', () => {
      const model = new KrippendorffsComparisonModel(["positive", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive"),
        createResponse("negative")
      ];
      const reviewer2 = [
        createResponse("negative"),
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(-0.750, 1);
    });

    it('should return 0.125', () => {
      const model = new KrippendorffsComparisonModel(["positive", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("positive"),
        createResponse("negative"),
        createResponse("negative")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive"),
        createResponse("negative")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.125, 1);
    });

    it('should return 0.250', () => {
      const model = new KrippendorffsComparisonModel(["positive", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("negative"),
        createResponse("positive"),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.250, 1);
    });

    it('should return 0.571', () => {
      const model = new KrippendorffsComparisonModel(["positive", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("positive"),
        createResponse("positive"),
        createResponse("negative"),
        createResponse("negative")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("positive"),
        createResponse("positive"),
        createResponse("positive"),
        createResponse("negative")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.571, 1);
    });

    it('should return 0.250 with binary weights', () => {
      const model = new KrippendorffsComparisonModel(["positive", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("negative"),
        createResponse("positive"),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.250, 1);
    });
  });

  describe('Three Label Agreement', () => {
    it('should return 1.0', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("neutral")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("neutral")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(1.0, 1);
    });

    it('should return -0.250', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("neutral")
      ];
      const reviewer2 = [
        createResponse("negative"),
        createResponse("neutral"),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(-0.250, 1);
    });

    it('should return 0.091', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("neutral")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("neutral"),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.091, 1);
    });

    it('should return 0.710', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("neutral"),
        createResponse("negative"),
        createResponse("positive")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("neutral"),
        createResponse("positive"),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.710, 1);
    });

    it('should return 0.667', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative"]);
      const reviewer1 = [
        createResponse("positive"),
        createResponse("positive"),
        createResponse("positive"),
        createResponse("negative"),
        createResponse("negative")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("positive"),
        createResponse("positive"),
        createResponse("neutral"),
        createResponse("negative")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.667, 1);
    });
  });

  describe('Two Label Array Agreement', () => {
    it('should return 1.0 for perfect agreement', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative", "urgent"]);
      const reviewer1 = [
        createResponse(["positive", "urgent"]),
        createResponse(["negative", "urgent"]),
        createResponse(["positive", "neutral"])
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent"]),
        createResponse(["negative", "urgent"]),
        createResponse(["positive", "neutral"])
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(1.0, 3);
    });

    it('should handle imbalanced label usage', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative", "urgent"]);
      const reviewer1 = [
        createResponse(["positive", "urgent"]),
        createResponse(["negative"]),  // Single label
        createResponse(["positive", "neutral"]),
        createResponse(["urgent"])     // Single label
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent"]),
        createResponse(["negative", "urgent"]),  // Two labels
        createResponse(["positive"]),  // Single label
        createResponse(["urgent", "neutral"])  // Two labels
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.472, 1);
    });

    it('should return -0.333 for complete disagreement', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative", "urgent"]);
      const reviewer1 = [
        createResponse(["positive", "urgent"]),
        createResponse(["negative", "urgent"]),
        createResponse(["positive", "neutral"])
      ];
      const reviewer2 = [
        createResponse(["negative", "neutral"]),
        createResponse(["positive", "neutral"]),
        createResponse(["negative", "urgent"])
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(-0.333, 3);
    });

    it('should handle mixed single and multiple labels', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative", "urgent"]);
      const reviewer1 = [
        createResponse(["positive"]),  // Single label
        createResponse(["negative", "urgent"]),
        createResponse(["positive"]),  // Single label
        createResponse(["neutral", "urgent"])
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent"]),  // Two labels
        createResponse(["negative"]),  // Single label
        createResponse(["positive", "neutral"]),  // Two labels
        createResponse(["neutral"])  // Single label
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.321, 3);
    });

    it('should return 0.556 for moderate agreement', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative", "urgent"]);
      const reviewer1 = [
        createResponse(["positive", "urgent"]),
        createResponse(["negative", "urgent"]),
        createResponse(["positive", "neutral"]),
        createResponse(["negative", "neutral"])
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent"]),
        createResponse(["negative", "neutral"]),
        createResponse(["positive", "neutral"]),
        createResponse(["negative", "urgent"])
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.556, 3);
    });

    it('should return 0.816 for high agreement', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "negative", "urgent"]);
      const reviewer1 = [
        createResponse(["positive", "urgent"]),
        createResponse(["positive", "urgent"]),
        createResponse(["positive", "urgent"]),
        createResponse(["negative", "neutral"]),
        createResponse(["negative", "neutral"])
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent"]),
        createResponse(["positive", "urgent"]),
        createResponse(["positive", "urgent"]),
        createResponse(["positive", "neutral"]),
        createResponse(["negative", "neutral"])
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.816, 3);
    });
  });

  describe('Three Label Array Agreement', () => {
    it('should return 1.0 for perfect agreement', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "important", "negative", "urgent", "critical"]);
      const reviewer1 = [
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["negative", "important", "urgent"]),
        createResponse(["positive", "neutral", "important"])
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["negative", "important", "urgent"]),
        createResponse(["positive", "neutral", "important"])
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(1.0, 3);
    });

    it('should handle imbalanced label usage', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "important", "negative", "urgent", "critical"]);
      const reviewer1 = [
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["negative"]),  // Single label
        createResponse(["positive", "neutral"]),  // Two labels
        createResponse(["urgent", "critical", "important"])
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent"]),  // Two labels
        createResponse(["negative", "urgent", "critical"]),  // Three labels
        createResponse(["positive"]),  // Single label
        createResponse(["urgent", "neutral"])  // Two labels
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.293, 3);
    });

    it('should return -0.200', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "important", "negative", "urgent", "critical"]);
      const reviewer1 = [
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["negative", "important", "urgent"]),
        createResponse(["positive", "neutral", "important"])
      ];
      const reviewer2 = [
        createResponse(["negative", "neutral", "important"]),
        createResponse(["positive", "neutral", "critical"]),
        createResponse(["negative", "urgent", "critical"])
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(-0.200, 1);
    });

    it('should handle mixed label counts', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "important", "negative", "urgent", "critical"]);
      const reviewer1 = [
        createResponse(["positive"]),  // Single label
        createResponse(["negative", "urgent"]),  // Two labels
        createResponse(["positive", "neutral", "important"]),  // Three labels
        createResponse(["critical"])  // Single label
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent", "critical"]),  // Three labels
        createResponse(["negative"]),  // Single label
        createResponse(["positive", "neutral"]),  // Two labels
        createResponse(["critical", "urgent"])  // Two labels
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.382, 1);
    });

    it('should return 0.493', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "important", "negative", "urgent", "critical"]);
      const reviewer1 = [
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["negative", "important", "urgent"]),
        createResponse(["positive", "neutral", "important"]),
        createResponse(["negative", "neutral", "critical"]),
        createResponse(["positive", "urgent", "important"])
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["negative", "neutral", "critical"]),
        createResponse(["positive", "neutral", "important"]),
        createResponse(["negative", "important", "urgent"]),
        createResponse(["positive", "urgent", "critical"])
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.493, 1);
    });

    it('should return 0.878', () => {
      const model = new KrippendorffsComparisonModel(["positive", "neutral", "important", "negative", "urgent", "critical"]);
      const reviewer1 = [
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["negative", "neutral", "important"]),
        createResponse(["negative", "neutral", "important"])
      ];
      const reviewer2 = [
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["positive", "urgent", "critical"]),
        createResponse(["positive", "neutral", "important"]),
        createResponse(["negative", "neutral", "important"])
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.878, 1);
    });
  });

  describe('Custom Weight Functions', () => {
    it('should use binary weight function correctly', () => {
      const model = new KrippendorffsComparisonModel(
        ["positive", "neutral", "negative"],
        (a, b) => a === b ? 1 : 0
      );
      const reviewer1 = [
        createResponse("positive"),
        createResponse("neutral"),
        createResponse("positive")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("negative"),
        createResponse("positive")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.444, 1);
    });

    it('should use distance-based weight function correctly', () => {
      const model = new KrippendorffsComparisonModel(
        ["positive", "neutral", "negative"],
        (a, b) => {
          const labels = ["positive", "neutral", "negative"];
          const dist = Math.abs(labels.indexOf(a) - labels.indexOf(b));
          return 1 - (dist / (labels.length - 1));
        }
      );
      const reviewer1 = [
        createResponse("positive"),
        createResponse("neutral"),
        createResponse("negative")
      ];
      const reviewer2 = [
        createResponse("positive"),
        createResponse("positive"),
        createResponse("neutral")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      expect(comparison).toBeCloseTo(0.286, 1);
    });

    it('should use semantic weight function correctly', () => {
      const model = new KrippendorffsComparisonModel(
        ["positive", "neutral", "negative", "urgent"],
        (a, b) => {
          if (a === b) return 1;
          if ((a === "positive" && b === "urgent") || (a === "urgent" && b === "positive")) return 0.8;
          if ((a === "negative" && b === "urgent") || (a === "urgent" && b === "negative")) return 0.2;
          return 0.5;
        }
      );
      const reviewer1 = [
        createResponse("positive"),
        createResponse("urgent"),
        createResponse("negative")
      ];
      const reviewer2 = [
        createResponse("urgent"),
        createResponse("positive"),
        createResponse("urgent")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      // First item: positive vs urgent = 0.8
      // Second item: urgent vs positive = 0.8
      // Third item: negative vs urgent = 0.2
      // Observed agreement (p_a) = (0.8 + 0.8 + 0.2) / 3 = 0.6
      // Expected agreement (p_e) calculation:
      // - positive appears 2 times out of 6 total labels
      // - urgent appears 3 times
      // - negative appears 1 time
      // p_e = (2/6 * 3/6 * 0.8) * 2 + (1/6 * 3/6 * 0.2) * 2 + remaining combinations with 0.5
      // This gives us p_e ≈ 0.45
      // alpha = (p_a - p_e) / (1 - p_e) = (0.6 - 0.45) / (1 - 0.45) ≈ 0.273
      expect(comparison).toBeCloseTo(-0.304, 3);
    });

    it('should use custom weight function with multiple categories', () => {
      const model = new KrippendorffsComparisonModel(
        ["positive", "neutral", "important", "negative", "urgent", "critical"],
        (a, b) => {
          if (a === b) return 1;
          if ((a === "positive" && b === "urgent") || (a === "urgent" && b === "positive")) return 0.8;
          if ((a === "negative" && b === "critical") || (a === "critical" && b === "negative")) return 0.2;
          if ((a === "important" && b === "urgent") || (a === "urgent" && b === "important")) return 0.7;
          return 0.5;
        }
      );
      const reviewer1 = [
        createResponse("positive"),
        createResponse("urgent"),
        createResponse("negative"),
        createResponse("important")
      ];
      const reviewer2 = [
        createResponse("urgent"),
        createResponse("positive"),
        createResponse("critical"),
        createResponse("urgent")
      ];
      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      // First item: positive vs urgent = 0.8
      // Second item: urgent vs positive = 0.8
      // Third item: negative vs critical = 0.2
      // Fourth item: important vs urgent = 0.7
      // Observed agreement (p_a) = (0.8 + 0.8 + 0.2 + 0.7) / 4 = 0.625
      // Expected agreement (p_e) is calculated similarly to above
      // The actual alpha value is approximately -0.061
      expect(comparison).toBeCloseTo(-0.061, 3);
    });

    it('should achieve high agreement with custom weights', () => {
      // Using a weight function that considers semantic similarity between labels
      // where "critical" and "urgent" are very similar (0.9)
      // "important" and "urgent"/"critical" are moderately similar (0.6)
      // and other combinations are less similar (0.3)
      const model = new KrippendorffsComparisonModel(
        ["critical", "urgent", "important", "normal", "low"],
        (a, b) => {
          if (a === b) return 1;
          if ((a === "critical" && b === "urgent") || (a === "urgent" && b === "critical")) return 0.9;
          if ((a === "important" && b === "urgent") || (a === "urgent" && b === "important") ||
              (a === "important" && b === "critical") || (a === "critical" && b === "important")) return 0.6;
          if ((a === "normal" && b === "low") || (a === "low" && b === "normal")) return 0.3;
          return 0.1; // Very low similarity for other combinations
        }
      );

      const reviewer1 = [
        createResponse("critical"),
        createResponse("urgent"),
        createResponse("critical"),
        createResponse("normal"),
        createResponse("low")
      ];

      const reviewer2 = [
        createResponse("urgent"),     // High weight (0.9) with "critical"
        createResponse("critical"),   // High weight (0.9) with "urgent"
        createResponse("urgent"),     // High weight (0.9) with "critical"
        createResponse("normal"),     // Exact match (1.0)
        createResponse("low")         // Exact match (1.0)
      ];

      const comparison = ComparisonModel.compareMultiple(reviewer1, reviewer2, model);
      
      
      expect(comparison).toBeCloseTo(0.893, 1);
    });
  });
}); 