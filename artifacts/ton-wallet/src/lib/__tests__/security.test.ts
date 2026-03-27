import { describe, it, expect } from "vitest";
import {
  levenshtein,
  checkAddressRisks,
  checkAmountRisks,
} from "../security";

describe("levenshtein distance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("hello", "hello")).toBe(0);
  });

  it("returns correct distance for one substitution", () => {
    expect(levenshtein("abc", "axc")).toBe(1);
  });

  it("returns correct distance for insertion", () => {
    expect(levenshtein("abc", "abcd")).toBe(1);
  });

  it("returns correct distance for deletion", () => {
    expect(levenshtein("abcd", "abc")).toBe(1);
  });

  it("returns full length when strings share nothing", () => {
    expect(levenshtein("abc", "xyz")).toBe(3);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("", "")).toBe(0);
  });
});

const ADDR_A = "UQAbc123def456ghi789jkl012mno345pqr678stu9012vwx";
const ADDR_A_MODIFIED = "UQAbc123def456ghi789jkl012mno345pqr678stu9012vwy"; // 1 char diff
const ADDR_B = "UQZzz999yyy888xxx777www666vvv555uuu444ttt333sss22";
const MY_ADDR = "UQMyOwnAddress123456789012345678901234567890123abc";

describe("checkAddressRisks", () => {
  it("warns when sending to own address", () => {
    const warnings = checkAddressRisks(MY_ADDR, MY_ADDR, []);
    expect(warnings.some((w) => w.level === "danger" && w.message.includes("свой"))).toBe(true);
  });

  it("warns about similar address (potential poisoning)", () => {
    const warnings = checkAddressRisks(ADDR_A_MODIFIED, MY_ADDR, [ADDR_A]);
    const hasSimilarWarning = warnings.some(
      (w) => w.level === "danger" && w.message.includes("похож")
    );
    expect(hasSimilarWarning).toBe(true);
  });

  it("no similar-address warning when addresses are very different", () => {
    const warnings = checkAddressRisks(ADDR_B, MY_ADDR, [ADDR_A]);
    const hasSimilarWarning = warnings.some(
      (w) => w.level === "danger" && w.message.includes("похож")
    );
    expect(hasSimilarWarning).toBe(false);
  });

  it("gives info warning for new address", () => {
    const warnings = checkAddressRisks(ADDR_B, MY_ADDR, []);
    expect(warnings.some((w) => w.level === "info")).toBe(true);
  });

  it("no new-address info warning for known address", () => {
    const warnings = checkAddressRisks(ADDR_A, MY_ADDR, [ADDR_A]);
    const infoWarnings = warnings.filter((w) => w.level === "info");
    expect(infoWarnings.length).toBe(0);
  });
});

describe("checkAmountRisks", () => {
  it("returns danger for zero or negative amount", () => {
    const warnings = checkAmountRisks("0", "10");
    expect(warnings.some((w) => w.level === "danger")).toBe(true);
  });

  it("returns danger when amount exceeds balance", () => {
    const warnings = checkAmountRisks("100", "50");
    expect(warnings.some((w) => w.level === "danger" && w.message.includes("превышает"))).toBe(true);
  });

  it("returns warning when sending near-full balance", () => {
    const warnings = checkAmountRisks("9.9", "10");
    expect(warnings.some((w) => w.level === "warning" && w.message.includes("весь"))).toBe(true);
  });

  it("returns warning for large amount", () => {
    const warnings = checkAmountRisks("500", "1000");
    expect(warnings.some((w) => w.level === "warning" && w.message.includes("крупную"))).toBe(true);
  });

  it("no warnings for normal safe amount", () => {
    const warnings = checkAmountRisks("1", "100");
    expect(warnings.length).toBe(0);
  });

  it("returns danger for invalid amount", () => {
    const warnings = checkAmountRisks("abc", "100");
    expect(warnings.some((w) => w.level === "danger")).toBe(true);
  });
});
