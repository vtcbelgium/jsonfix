import { describe, expect, it } from "vitest";
import { describeResult, getJsonStats, parseAndRepairJson, repairJsonString } from "./repair";

describe("repairJsonString", () => {
  it("fixes trailing commas in objects and arrays", () => {
    const input = '{"a": 1, "b": [2, 3,],}';
    const fixed = repairJsonString(input);
    expect(fixed).toBe('{"a": 1, "b": [2, 3]}');
    expect(() => JSON.parse(fixed)).not.toThrow();
  });

  it("converts single quotes to double quotes", () => {
    const input = "{'name': 'OTHRYS', 'val': 'test'}";
    const fixed = repairJsonString(input);
    expect(() => JSON.parse(fixed)).not.toThrow();
    expect(JSON.parse(fixed)).toEqual({ name: "OTHRYS", val: "test" });
  });

  it("fixes unquoted keys", () => {
    const input = '{foo: "bar", baz: 123}';
    const fixed = repairJsonString(input);
    expect(() => JSON.parse(fixed)).not.toThrow();
    expect(JSON.parse(fixed)).toEqual({ foo: "bar", baz: 123 });
  });

  it("normalizes Python literals (True, False, None)", () => {
    const input = '{"active": True, "pending": False, "meta": None}';
    const fixed = repairJsonString(input);
    expect(() => JSON.parse(fixed)).not.toThrow();
    expect(JSON.parse(fixed)).toEqual({ active: true, pending: false, meta: null });
  });

  it("strips trailing semicolons", () => {
    const input = '{"item": 1};';
    const fixed = repairJsonString(input);
    expect(() => JSON.parse(fixed)).not.toThrow();
  });
});

describe("parseAndRepairJson", () => {
  it("formats already-valid JSON cleanly", () => {
    const res = parseAndRepairJson('{"a":1,"b":2}');
    expect(res.valid).toBe(true);
    expect(res.repairedText).toContain('  "a": 1');
  });

  it("repairs combined syntax defects", () => {
    const malformed = "{title: 'Alpha', items: [1, 2,], active: True,};";
    const res = parseAndRepairJson(malformed);
    expect(res.valid).toBe(true);
    const parsed = JSON.parse(res.repairedText);
    expect(parsed.title).toBe("Alpha");
    expect(parsed.items).toEqual([1, 2]);
    expect(parsed.active).toBe(true);
  });

  it("returns error on completely unrecoverable input", () => {
    const res = parseAndRepairJson("not json at all");
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("handles empty input", () => {
    const res = parseAndRepairJson("   ");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("empty");
  });
});

describe("describeResult", () => {
  it("announces a successful repair", () => {
    expect(describeResult(parseAndRepairJson("{a: 1,}"))).toBe(
      "JSON is valid or repaired. The output is ready.",
    );
  });

  it("announces the parser error when repair fails", () => {
    const result = parseAndRepairJson("{a: ");
    expect(describeResult(result)).toBe(`Could not repair JSON: ${result.error}`);
  });
});

describe("getJsonStats", () => {
  it("counts keys in a flat object", () => {
    const stats = getJsonStats({ a: 1, b: "two", c: null });
    expect(stats.keyCount).toBe(3);
    expect(stats.maxDepth).toBe(1);
    expect(stats.arrayItemCount).toBe(0);
  });

  it("counts keys and depth across a nested tree", () => {
    const stats = getJsonStats({ a: { b: { c: 1 } }, d: { e: 2 } });
    expect(stats.keyCount).toBe(5);
    expect(stats.maxDepth).toBe(3);
  });

  it("counts array items without counting them as keys", () => {
    const stats = getJsonStats([1, "two", null, true]);
    expect(stats.arrayItemCount).toBe(4);
    expect(stats.keyCount).toBe(0);
    expect(stats.maxDepth).toBe(1);
  });

  it("walks objects inside arrays and arrays inside objects", () => {
    const stats = getJsonStats({ rows: [{ id: 1 }, { id: 2, tags: ["x", "y"] }] });
    expect(stats.keyCount).toBe(4);
    expect(stats.arrayItemCount).toBe(4);
    expect(stats.maxDepth).toBe(4);
  });

  it("treats empty containers as one level with nothing inside", () => {
    expect(getJsonStats({})).toMatchObject({ keyCount: 0, arrayItemCount: 0, maxDepth: 1 });
    expect(getJsonStats([])).toMatchObject({ keyCount: 0, arrayItemCount: 0, maxDepth: 1 });
  });

  it("reports zero depth for top-level scalars", () => {
    expect(getJsonStats(42)).toMatchObject({ keyCount: 0, arrayItemCount: 0, maxDepth: 0 });
    expect(getJsonStats(null)).toMatchObject({ keyCount: 0, arrayItemCount: 0, maxDepth: 0 });
  });

  it("measures byte size of the pretty-printed output by default", () => {
    const parsed = { a: 1 };
    expect(getJsonStats(parsed).byteSize).toBe(JSON.stringify(parsed, null, 2).length);
  });

  it("measures byte size in UTF-8, not string length", () => {
    expect(getJsonStats("é").byteSize).toBe(4);
    expect(getJsonStats("😀").byteSize).toBe(6);
  });

  it("measures the given text when the output was reformatted", () => {
    const parsed = { a: 1, b: 2 };
    expect(getJsonStats(parsed, JSON.stringify(parsed)).byteSize).toBe(13);
  });

  it("handles nesting deeper than the call stack allows", () => {
    let deep: unknown = 0;
    for (let i = 0; i < 200_000; i++) deep = [deep];
    const stats = getJsonStats(deep, "[]");
    expect(stats.maxDepth).toBe(200_000);
    expect(stats.arrayItemCount).toBe(200_000);
  });
});
