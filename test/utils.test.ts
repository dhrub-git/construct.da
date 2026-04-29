import { describe, it, expect } from "vitest";
import {
  convertJsonToMDTable,
  convertJsonToListArray,
} from "@/lib/utils";

describe("convertJsonToMDTable", () => {
  it("returns empty string for empty input", () => {
    expect(convertJsonToMDTable([])).toBe("");
  });

  it("creates a markdown table from rows", () => {
    const result = convertJsonToMDTable([
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ]);

    expect(result).toBe(
      [
        "| name | age |",
        "| --- | --- |",
        "| Alice | 25 |",
        "| Bob | 30 |",
      ].join("\n")
    );
  });

  it("includes union of all keys by default", () => {
    const result = convertJsonToMDTable([
      { name: "Alice" },
      { age: 30 },
    ]);

    expect(result).toContain("| name | age |");
    expect(result).toContain("| Alice |  |");
    expect(result).toContain("|  | 30 |");
  });

  it("uses custom column order", () => {
    const result = convertJsonToMDTable(
      [{ name: "Alice", age: 25 }],
      { columns: ["age", "name"] }
    );

    expect(result).toBe(
      [
        "| age | name |",
        "| --- | --- |",
        "| 25 | Alice |",
      ].join("\n")
    );
  });

  it("escapes pipes and newlines", () => {
    const result = convertJsonToMDTable([
      { note: "A|B\nC" },
    ]);

    expect(result).toContain("| A\\|B C |");
  });

  it("truncates long values", () => {
    const result = convertJsonToMDTable(
      [{ text: "abcdefghij" }],
      { maxCellLength: 6 }
    );

    expect(result).toContain("| abc... |");
  });

  it("uses nullValue for null/undefined", () => {
    const result = convertJsonToMDTable(
      [{ a: null, b: undefined }],
      { nullValue: "N/A" }
    );

    expect(result).toContain("| N/A | N/A |");
  });
});

describe("convertJsonToListArray", () => {
  it("returns flat primitive values", () => {
    const result = convertJsonToListArray({
      name: "Alice",
      age: 25,
      active: true,
    });

    expect(result).toEqual([
      { text: "name: Alice" },
      { text: "age: 25" },
      { text: "active: true" },
    ]);
  });

  it("handles nested objects recursively", () => {
    const result = convertJsonToListArray({
      user: {
        profile: {
          name: "Alice",
        },
      },
    });

    expect(result).toEqual([
      { text: "user.profile.name: Alice" },
    ]);
  });

  it("handles arrays recursively", () => {
    const result = convertJsonToListArray({
      tags: ["fire", "safety"],
    });

    expect(result).toEqual([
      { text: "tags[0]: fire" },
      { text: "tags[1]: safety" },
    ]);
  });

  it("handles nested arrays of objects", () => {
    const result = convertJsonToListArray({
      floors: [
        { level: "Ground", exits: 2 },
      ],
    });

    expect(result).toEqual([
      { text: "floors[0].level: Ground" },
      { text: "floors[0].exits: 2" },
    ]);
  });

  it("handles empty arrays and objects", () => {
    const result = convertJsonToListArray({
      arr: [],
      obj: {},
    });

    expect(result).toEqual([
      { text: "arr: []" },
      { text: "obj: {}" },
    ]);
  });

  it("handles null and undefined", () => {
    const result = convertJsonToListArray(
      {
        a: null,
        b: undefined,
      },
      { nullValue: "N/A" }
    );

    expect(result).toEqual([
      { text: "a: N/A" },
      { text: "b: N/A" },
    ]);
  });

  it("truncates long strings", () => {
    const result = convertJsonToListArray(
      {
        text: "abcdefghij",
      },
      { maxValueLength: 6 }
    );

    expect(result).toEqual([
      { text: "text: abc..." },
    ]);
  });

  it("normalizes whitespace/newlines", () => {
    const result = convertJsonToListArray({
      note: "hello \n   world",
    });

    expect(result).toEqual([
      { text: "note: hello world" },
    ]);
  });

  it("formats Date values", () => {
    const date = new Date("2026-04-27T10:30:00.000Z");

    const result = convertJsonToListArray({
      issuedAt: date,
    });

    expect(result).toEqual([
      { text: `issuedAt: ${date.toISOString()}` },
    ]);
  });
});