import { $, _ } from "../../src/util/index.js";
import { 
  EqualComparisonModel, 
  DistanceComparisonModel,
  KrippendorffsComparisonModel,
  CohensComparisonModel 
} from "../../src/comparators/comparator.js";

describe('Comparison Models', () => {
  // Test setup
  const input = "Some Text String";
  const caller1 = $("Take all words and make them elements in a JSON array");
  const caller2 = $((i) => i.toUpperCase().split(" "));

  let result1, result2;

  beforeAll(async () => {
    result1 = await caller1.run(input);
    result2 = await caller2.run(input);
  });

  describe('EqualComparisonModel', () => {
    it('should compare exact string matches', () => {
      const comparison = result2.compare(result1).run(new EqualComparisonModel());
      expect(comparison).toBeLessThan(1); // Should have some disagreement
    });

    it('should return 1 for identical responses', async () => {
      const sameResult = await caller1.run(input);
      const comparison = result1.compare(sameResult).run(new EqualComparisonModel());
      expect(comparison).toBe(1);
    });
  });

  describe('DistanceComparisonModel', () => {
    it('should provide a distance-based comparison', () => {
      const comparison = result2.compare(result1).run(new DistanceComparisonModel());
      expect(comparison).toBeGreaterThan(0);
      expect(comparison).toBeLessThanOrEqual(1);
    });

    it('should handle custom weight functions', () => {
      const weightFn = (a, b) => a === b ? 1 : 0.5;
      const comparison = result2.compare(result1).run(new DistanceComparisonModel(weightFn));
      expect(comparison).toBeGreaterThan(0);
      expect(comparison).toBeLessThanOrEqual(1);
    });
  });

  describe('KrippendorffsComparisonModel', () => {
    it('should calculate Krippendorff\'s alpha for single labels', () => {
      const comparison = result2.compare(result1).run(new KrippendorffsComparisonModel());
      expect(comparison).toBeGreaterThan(0);
      expect(comparison).toBeLessThanOrEqual(1);
    });

    it('should handle multi-label data using Jaccard index', async () => {
      const multiLabelCaller = $("Extract key topics as an array");
      const result3 = await multiLabelCaller.run(input);
      const comparison = result3.compare(result1).run(new KrippendorffsComparisonModel());
      expect(comparison).toBeGreaterThan(0);
      expect(comparison).toBeLessThanOrEqual(1);
    });
  });

  describe('CohensComparisonModel', () => {
    it('should calculate Cohen\'s kappa for multiple labels', async () => {
      const multiLabelCaller = $("Extract key topics as an array");
      const result3 = await multiLabelCaller.run(input);
      const comparison = result3.compare(result1).run(new CohensComparisonModel());
      expect(comparison).toBeGreaterThan(0);
      expect(comparison).toBeLessThanOrEqual(1);
    });

    it('should handle multiple reviewer labels', async () => {
      const reviewer1 = $("First reviewer's categorization");
      const reviewer2 = $("Second reviewer's categorization");
      const result3 = await reviewer1.run(input);
      const result4 = await reviewer2.run(input);
      const comparison = result3.compare(result4).run(new CohensComparisonModel());
      expect(comparison).toBeGreaterThan(0);
      expect(comparison).toBeLessThanOrEqual(1);
    });
  });
}); 