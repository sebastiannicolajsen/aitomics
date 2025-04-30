import { $ } from "../../src/util/index.js";
import { EqualComparisonModel } from "../../src/comparators/comparator.js";

describe('EqualComparisonModel', () => {
  // Test setup
  const input = "Some Text String";
  const caller1 = $("Take all words and make them elements in a JSON array");
  const caller2 = $((i) => i.toUpperCase().split(" "));

  let result1, result2;

  beforeAll(async () => {
    result1 = await caller1.run(input);
    result2 = await caller2.run(input);
  });

  it('should compare exact string matches', () => {
    const comparison = result2.compare(result1).run(new EqualComparisonModel());
    expect(comparison).toBeLessThan(1); // Should have some disagreement
  });

  it('should return 1 for identical responses', async () => {
    const sameResult = await caller1.run(input);
    const comparison = result1.compare(sameResult).run(new EqualComparisonModel());
    expect(comparison).toBe(1);
  });

  it('should handle different output types', async () => {
    const arrayCaller = $((i) => i.split(" "));
    const stringCaller = $("Join all words with a space");
    const arrayResult = await arrayCaller.run(input);
    const stringResult = await stringCaller.run(arrayResult);
    const comparison = stringResult.compare(arrayResult).run(new EqualComparisonModel());
    expect(comparison).toBeLessThan(1);
  });
}); 