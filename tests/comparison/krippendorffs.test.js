import { $ } from "../../src/util/index.js";
import { KrippendorffsComparisonModel } from "../../src/comparators/comparator.js";

describe('KrippendorffsComparisonModel', () => {
  // Test setup
  const input = "Some Text String";
  const caller1 = $("Take all words and make them elements in a JSON array");
  const caller2 = $((i) => i.toUpperCase().split(" "));

  let result1, result2;

  beforeAll(async () => {
    result1 = await caller1.run(input);
    result2 = await caller2.run(input);
  });

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

  it('should handle different types of categorical data', async () => {
    const numericCaller = $("Rate the text on a scale of 1-5");
    const categoricalCaller = $("Categorize the text as positive, negative, or neutral");
    const numericResult = await numericCaller.run(input);
    const categoricalResult = await categoricalCaller.run(input);
    const comparison = numericResult.compare(categoricalResult).run(new KrippendorffsComparisonModel());
    expect(comparison).toBeGreaterThan(0);
    expect(comparison).toBeLessThanOrEqual(1);
  });

  it('should handle custom weight functions for single labels', () => {
    const weightFn = (a, b) => a === b ? 1 : 0.5;
    const comparison = result2.compare(result1).run(new KrippendorffsComparisonModel(weightFn));
    expect(comparison).toBeGreaterThan(0);
    expect(comparison).toBeLessThanOrEqual(1);
  });
}); 