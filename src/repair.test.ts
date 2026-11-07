import { describe, expect, it } from "vitest";
import { parseAndRepairJson, repairJsonString } from "./repair";

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
