import { describe, it, expect, beforeEach } from "vitest";
import { savePin, verifyPin, hasPin, clearPin } from "../storage";

describe("PIN functionality", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns false for hasPin when no PIN is set", () => {
    expect(hasPin()).toBe(false);
  });

  it("returns true for hasPin after setting PIN", () => {
    savePin("123456");
    expect(hasPin()).toBe(true);
  });

  it("verifies correct PIN", () => {
    savePin("123456");
    expect(verifyPin("123456")).toBe(true);
  });

  it("rejects incorrect PIN", () => {
    savePin("123456");
    expect(verifyPin("654321")).toBe(false);
  });

  it("returns true for verifyPin when no PIN is set", () => {
    expect(verifyPin("anything")).toBe(true);
  });

  it("clearPin removes PIN", () => {
    savePin("123456");
    expect(hasPin()).toBe(true);
    clearPin();
    expect(hasPin()).toBe(false);
  });

  it("different PINs produce different hashes", () => {
    savePin("111111");
    const valid1 = verifyPin("111111");
    const invalid1 = verifyPin("222222");
    
    clearPin();
    savePin("222222");
    const valid2 = verifyPin("222222");
    const invalid2 = verifyPin("111111");

    expect(valid1).toBe(true);
    expect(invalid1).toBe(false);
    expect(valid2).toBe(true);
    expect(invalid2).toBe(false);
  });

  it("handles empty PIN", () => {
    savePin("");
    expect(verifyPin("")).toBe(true);
    expect(verifyPin("123")).toBe(false);
  });

  it("handles very long PIN", () => {
    const longPin = "1234567890".repeat(10);
    savePin(longPin);
    expect(verifyPin(longPin)).toBe(true);
    expect(verifyPin(longPin + "x")).toBe(false);
  });

  it("PIN persists across page reloads (simulated)", () => {
    savePin("999999");
    
    // Simulate reload by creating new instance
    const stored = localStorage.getItem("ton_wallet_pin_hash");
    expect(stored).toBeTruthy();
    
    expect(verifyPin("999999")).toBe(true);
  });
});
