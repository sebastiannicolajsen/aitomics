import { $ } from "../../src/util/index.js";
import { DistanceComparisonModel } from "../../src/comparators/comparator.js";

describe('DistanceComparisonModel', () => {
  // Test setup
  const input = "Some Text String";
  const caller1 = $("Take all words and make them elements in a JSON array");
  const caller2 = $((i) => i.toUpperCase().split(" "));

  let result1, result2;

  beforeAll(async () => {
    result1 = await caller1.run(input);
    result2 = await caller2.run(input);
  });

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

  it('should handle different weight function configurations', () => {
    const strictWeightFn = (a, b) => a === b ? 1 : 0;
    const lenientWeightFn = (a, b) => a === b ? 1 : 0.8;
    
    const strictComparison = result2.compare(result1).run(new DistanceComparisonModel(strictWeightFn));
    const lenientComparison = result2.compare(result1).run(new DistanceComparisonModel(lenientWeightFn));
    
    expect(strictComparison).toBeLessThan(lenientComparison);
  });
}); 