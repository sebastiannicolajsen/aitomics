import { $ } from "../../src/util/index.js";
import { CohensComparisonModel } from "../../src/comparators/comparator.js";

describe('CohensComparisonModel', () => {
  // Test setup
  const input = "Some Text String";
  const caller1 = $("Take all words and make them elements in a JSON array");
  const caller2 = $((i) => i.toUpperCase().split(" "));

  let result1, result2;

  beforeAll(async () => {
    result1 = await caller1.run(input);
    result2 = await caller2.run(input);
  });

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

  it('should handle different categorization schemes', async () => {
    const binaryCaller = $("Categorize as positive or negative");
    const scaleCaller = $("Rate on a scale of 1-5");
    const binaryResult = await binaryCaller.run(input);
    const scaleResult = await scaleCaller.run(input);
    const comparison = binaryResult.compare(scaleResult).run(new CohensComparisonModel());
    expect(comparison).toBeGreaterThan(0);
    expect(comparison).toBeLessThanOrEqual(1);
  });

  it('should handle high agreement cases', async () => {
    const sameCaller = $("Categorize the text");
    const result3 = await sameCaller.run(input);
    const result4 = await sameCaller.run(input);
    const comparison = result3.compare(result4).run(new CohensComparisonModel());
    expect(comparison).toBeGreaterThan(0.8); // High agreement expected
  });
}); 