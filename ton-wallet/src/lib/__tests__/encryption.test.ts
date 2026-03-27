import { describe, it, expect, beforeEach } from "vitest";
import { saveWallet, loadWallet, clearWallet, StoredWallet } from "../storage";

const MOCK_WALLET: StoredWallet = {
  mnemonic: [
    "abandon", "ability", "able", "about", "above", "absent",
    "absorb", "abstract", "absurd", "abuse", "access", "accident",
    "account", "accuse", "achieve", "acid", "acoustic", "acquire",
    "across", "act", "action", "actor", "actress", "actual"
  ],
  address: "0QAbc123def456ghi789jkl012mno345pqr678stu9012vwx",
  createdAt: 1700000000000,
};

describe("Wallet encryption", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("encrypts wallet data before storing", () => {
    saveWallet(MOCK_WALLET);
    const raw = localStorage.getItem("ton_testnet_wallet");
    
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("abandon");
    expect(raw).not.toContain(MOCK_WALLET.address);
  });

  it("decrypts wallet data correctly", () => {
    saveWallet(MOCK_WALLET);
    const loaded = loadWallet();
    
    expect(loaded).toEqual(MOCK_WALLET);
  });

  it("generates encryption key on first save", () => {
    expect(localStorage.getItem("ton_wallet_enc_key")).toBeNull();
    
    saveWallet(MOCK_WALLET);
    
    const key = localStorage.getItem("ton_wallet_enc_key");
    expect(key).toBeTruthy();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("reuses same encryption key for multiple saves", () => {
    saveWallet(MOCK_WALLET);
    const key1 = localStorage.getItem("ton_wallet_enc_key");
    
    const wallet2 = { ...MOCK_WALLET, address: "different_address" };
    saveWallet(wallet2);
    const key2 = localStorage.getItem("ton_wallet_enc_key");
    
    expect(key1).toBe(key2);
  });

  it("cannot decrypt with wrong key", () => {
    saveWallet(MOCK_WALLET);
    
    // Corrupt the encryption key
    localStorage.setItem("ton_wallet_enc_key", "wrong_key");
    
    const loaded = loadWallet();
    expect(loaded).toBeNull();
  });

  it("handles corrupted encrypted data gracefully", () => {
    saveWallet(MOCK_WALLET);
    
    // Corrupt the encrypted data
    localStorage.setItem("ton_testnet_wallet", "corrupted!!!data");
    
    const loaded = loadWallet();
    expect(loaded).toBeNull();
  });

  it("encrypts different wallets differently", () => {
    saveWallet(MOCK_WALLET);
    const encrypted1 = localStorage.getItem("ton_testnet_wallet");
    
    clearWallet();
    localStorage.removeItem("ton_wallet_enc_key"); // Force new key
    
    const wallet2 = { ...MOCK_WALLET, address: "different" };
    saveWallet(wallet2);
    const encrypted2 = localStorage.getItem("ton_testnet_wallet");
    
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("preserves all wallet fields through encryption", () => {
    const complexWallet: StoredWallet = {
      mnemonic: Array(24).fill("test"),
      address: "0QTest123",
      createdAt: Date.now(),
    };
    
    saveWallet(complexWallet);
    const loaded = loadWallet();
    
    expect(loaded).toEqual(complexWallet);
    expect(loaded?.mnemonic).toHaveLength(24);
    expect(loaded?.createdAt).toBe(complexWallet.createdAt);
  });

  it("handles special characters in mnemonic", () => {
    const specialWallet: StoredWallet = {
      mnemonic: ["test-word", "word_with_underscore", "word123", "UPPERCASE"],
      address: "0QSpecial",
      createdAt: 1234567890,
    };
    
    saveWallet(specialWallet);
    const loaded = loadWallet();
    
    expect(loaded).toEqual(specialWallet);
  });

  it("encryption is deterministic with same key", () => {
    saveWallet(MOCK_WALLET);
    const encrypted1 = localStorage.getItem("ton_testnet_wallet");
    
    clearWallet();
    saveWallet(MOCK_WALLET);
    const encrypted2 = localStorage.getItem("ton_testnet_wallet");
    
    expect(encrypted1).toBe(encrypted2);
  });
});
