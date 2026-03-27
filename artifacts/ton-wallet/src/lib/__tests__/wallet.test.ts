import { describe, it, expect } from "vitest";
import { isValidTonAddress } from "../wallet";

describe("isValidTonAddress", () => {
  it("accepts valid bounceable address", () => {
    expect(isValidTonAddress("EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG")).toBe(true);
  });

  it("accepts another valid bounceable address", () => {
    expect(isValidTonAddress("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidTonAddress("")).toBe(false);
  });

  it("rejects random garbage string", () => {
    expect(isValidTonAddress("not-a-ton-address")).toBe(false);
  });

  it("rejects Ethereum address", () => {
    expect(isValidTonAddress("0x742d35Cc6634C0532925a3b8D4C8D7E8f3A1b2c3")).toBe(false);
  });

  it("rejects truncated address", () => {
    expect(isValidTonAddress("EQBvW8Z5huBkMJYdnfAEM5JqTNk")).toBe(false);
  });
});
