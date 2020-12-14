import { merge } from "../../src/utils/merge";

describe("utils/merge merge()", () => {
  it("should add new keys and array elements", () => {
    const log = {};
    const data = { p: 1, q: 2, o: { x: 1 }, a: ["a"] };
    const newData = { p: 9, r: 9, o: { x: 9, y: 8 }, a: ["k"] };
    const expectedData = { p: 1, q: 2, r: 9, o: { x: 1, y: 8 }, a: ["a", "k"] };
    const expectedLog = { r: 9, "o.y": 8, a: ["k"] };
    const result = merge(log, data, newData);

    expect(result[0]).toEqual(expectedData);
    expect(result[1]).toEqual(expectedLog);
  });

  it("should add new sub keys and array elements", () => {
    const log = {};
    const data = { sub: { p: 1, q: 2, o: { x: 1 }, a: ["a"] } };
    const newData = { p: 9, r: 9, o: { x: 9, y: 8 }, a: ["k"] };
    const expectedData = { sub: { p: 1, q: 2, r: 9, o: { x: 1, y: 8 }, a: ["a", "k"] } };
    const expectedLog = { "sub.r": 9, "sub.o.y": 8, "sub.a": ["k"] };
    const result = merge(log, data, newData, false, "sub");

    expect(result[0]).toEqual(expectedData);
    expect(result[1]).toEqual(expectedLog);
  });

  it("should overwrite conflicting and new subkeys and array elements", () => {
    const log = {};
    const data = { p: 1, q: 2, o: { x: 1 }, a: ["a"] };
    const newData = { p: 9, r: 9, o: { x: 9, y: 8 }, a: ["k"] };
    const expectedData = { p: 9, q: 2, r: 9, o: { x: 9, y: 8 }, a: ["a", "k"] };
    const expectedLog = { p: 9, r: 9, "o.x": 9, "o.y": 8, a: ["k"] };
    const result = merge(log, data, newData, true);
    expect(result[0]).toEqual(expectedData);
    expect(result[1]).toEqual(expectedLog);
  });

  it("should not overwrite when keys are equal", () => {
    const log = {};
    const data = { a: { x: 1 }, b: { k: 1 } };
    const newData = { a: { x: 1 }, b: { l: 2 } };
    const expectedData = { a: { x: 1 }, b: { k: 1, l: 2 } };
    const expectedLog = { "b.l": 2 };
    const result = merge(log, data, newData, false);

    expect(result[0]).toEqual(expectedData);
    expect(result[1]).toEqual(expectedLog);
  });
});
