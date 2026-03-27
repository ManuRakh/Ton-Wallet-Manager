import { describe, it, expect, beforeEach } from "vitest";
import { saveWallet, loadWallet, clearWallet, hasWallet } from "../storage";

const MOCK_WALLET = {
  mnemonic: Array(24).fill("test"),
  address: "UQAbc123def456",
  createdAt: 1700000000000,
};

describe("wallet storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no wallet stored", () => {
    expect(loadWallet()).toBeNull();
  });

  it("saves and loads wallet correctly", () => {
    saveWallet(MOCK_WALLET);
    const loaded = loadWallet();
    expect(loaded).toEqual(MOCK_WALLET);
  });

  it("hasWallet returns false when no wallet", () => {
    expect(hasWallet()).toBe(false);
  });

  it("hasWallet returns true after saving", () => {
    saveWallet(MOCK_WALLET);
    expect(hasWallet()).toBe(true);
  });

  it("clearWallet removes wallet", () => {
    saveWallet(MOCK_WALLET);
    clearWallet();
    expect(loadWallet()).toBeNull();
    expect(hasWallet()).toBe(false);
  });

  it("returns null for corrupted storage", () => {
    localStorage.setItem("ton_testnet_wallet", "invalid-json{{{");
    expect(loadWallet()).toBeNull();
  });
});
