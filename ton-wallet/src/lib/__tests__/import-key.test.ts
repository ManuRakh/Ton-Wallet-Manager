import { describe, it, expect } from "vitest";

describe("Private key import validation", () => {
  const validKey = "a".repeat(64);
  const validKeyMixed = "1234567890abcdefABCDEF1234567890abcdefABCDEF0123456789abcd1234";

  it("accepts valid 64 hex character key", () => {
    const isValid = /^[0-9a-fA-F]{64}$/.test(validKey);
    expect(isValid).toBe(true);
  });

  it("rejects key with 63 characters", () => {
    const shortKey = "a".repeat(63);
    const isValid = /^[0-9a-fA-F]{64}$/.test(shortKey);
    expect(isValid).toBe(false);
  });

  it("rejects key with 65 characters", () => {
    const longKey = "a".repeat(65);
    const isValid = /^[0-9a-fA-F]{64}$/.test(longKey);
    expect(isValid).toBe(false);
  });

  it("rejects key with non-hex characters", () => {
    const invalidKey = "g".repeat(64);
    const isValid = /^[0-9a-fA-F]{64}$/.test(invalidKey);
    expect(isValid).toBe(false);
  });

  it("rejects key with spaces", () => {
    const keyWithSpaces = "a".repeat(32) + " " + "a".repeat(31);
    const isValid = /^[0-9a-fA-F]{64}$/.test(keyWithSpaces);
    expect(isValid).toBe(false);
  });

  it("rejects empty string", () => {
    const isValid = /^[0-9a-fA-F]{64}$/.test("");
    expect(isValid).toBe(false);
  });

  it("rejects key with 0x prefix", () => {
    const keyWithPrefix = "0x" + "a".repeat(62);
    const isValid = /^[0-9a-fA-F]{64}$/.test(keyWithPrefix);
    expect(isValid).toBe(false);
  });

  it("rejects special characters", () => {
    const specialChars = "a".repeat(60) + "!@#$";
    const isValid = /^[0-9a-fA-F]{64}$/.test(specialChars);
    expect(isValid).toBe(false);
  });
});

describe("Private key to Buffer conversion", () => {
  it("converts valid hex to Buffer", () => {
    const key = "1234567890abcdef".repeat(4);
    const buffer = Buffer.from(key, "hex");
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBe(32);
  });

  it("converts to correct byte values", () => {
    const key = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
    const buffer = Buffer.from(key, "hex");
    
    expect(buffer[0]).toBe(0x00);
    expect(buffer[1]).toBe(0x11);
    expect(buffer[2]).toBe(0x22);
    expect(buffer[15]).toBe(0xff);
  });

  it("handles uppercase hex", () => {
    const key = "ABCDEF1234567890".repeat(4);
    const buffer = Buffer.from(key, "hex");
    
    expect(buffer.length).toBe(32);
    expect(buffer[0]).toBe(0xAB);
  });

  it("handles mixed case", () => {
    const key = "AbCdEf1234567890".repeat(4);
    const buffer = Buffer.from(key, "hex");
    
    expect(buffer.length).toBe(32);
  });
});
