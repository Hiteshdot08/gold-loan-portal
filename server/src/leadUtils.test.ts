import { describe, it, expect } from "vitest";
import { maskMobile, toApplicationId, gramsToMg } from "./leadUtils";

describe("leadUtils", () => {
  it("masks the mobile as 9876XXXX10", () => {
    expect(maskMobile("9876543210")).toBe("9876XXXX10");
  });

  it("builds application ids starting at GL-1001", () => {
    expect(toApplicationId(1)).toBe("GL-1001");
    expect(toApplicationId(42)).toBe("GL-1042");
  });

  it("converts grams to whole milligrams without float drift", () => {
    expect(gramsToMg(45)).toBe(45000);
    expect(gramsToMg(10.1)).toBe(10100);
    expect(gramsToMg(0.001)).toBe(1);
  });
});
