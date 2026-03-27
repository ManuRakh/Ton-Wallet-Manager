import { describe, it, expect } from "vitest";
import {
  generateMnemonic,
  mnemonicToWallet,
  validateMnemonic,
  isValidTonAddress,
} from "../wallet";

describe("generateMnemonic", () => {
  it("generates 24 words", async () => {
    const mnemonic = await generateMnemonic();
    expect(mnemonic).toHaveLength(24);
  });

  it("generates unique mnemonics", async () => {
    const m1 = await generateMnemonic();
    const m2 = await generateMnemonic();
    expect(m1.join(" ")).not.toBe(m2.join(" "));
  });

  it("generates valid mnemonics", async () => {
    const mnemonic = await generateMnemonic();
    const isValid = await validateMnemonic(mnemonic);
    expect(isValid).toBe(true);
  });
});

describe("mnemonicToWallet", () => {
  it("creates wallet from valid mnemonic", async () => {
    const mnemonic = await generateMnemonic();
    const wallet = await mnemonicToWallet(mnemonic);

    expect(wallet.address).toBeTruthy();
    expect(wallet.keyPair.publicKey).toBeInstanceOf(Buffer);
    expect(wallet.keyPair.secretKey).toBeInstanceOf(Buffer);
    expect(wallet.keyPair.publicKey.length).toBe(32);
    expect(wallet.keyPair.secretKey.length).toBe(64);
  });

  it("generates testnet address", async () => {
    const mnemonic = await generateMnemonic();
    const wallet = await mnemonicToWallet(mnemonic);
    
    // Testnet addresses start with 0Q or kQ (base64url encoding)
    expect(wallet.address.startsWith("0Q") || wallet.address.startsWith("kQ")).toBe(true);
  });

  it("generates same wallet from same mnemonic", async () => {
    const mnemonic = await generateMnemonic();
    const w1 = await mnemonicToWallet(mnemonic);
    const w2 = await mnemonicToWallet(mnemonic);

    expect(w1.address).toBe(w2.address);
    expect(w1.keyPair.publicKey.toString("hex")).toBe(w2.keyPair.publicKey.toString("hex"));
  });
});

describe("validateMnemonic", () => {
  it("validates correct 24-word mnemonic", async () => {
    const mnemonic = await generateMnemonic();
    const isValid = await validateMnemonic(mnemonic);
    expect(isValid).toBe(true);
  });

  it("rejects invalid mnemonic", async () => {
    const invalid = Array(24).fill("invalid");
    const isValid = await validateMnemonic(invalid);
    expect(isValid).toBe(false);
  });

  it("rejects mnemonic with wrong length", async () => {
    const mnemonic = await generateMnemonic();
    const truncated = mnemonic.slice(0, 12);
    const isValid = await validateMnemonic(truncated);
    expect(isValid).toBe(false);
  });

  it("rejects empty mnemonic", async () => {
    const isValid = await validateMnemonic([]);
    expect(isValid).toBe(false);
  });
});

describe("isValidTonAddress", () => {
  it("accepts valid testnet address", async () => {
    const mnemonic = await generateMnemonic();
    const wallet = await mnemonicToWallet(mnemonic);
    expect(isValidTonAddress(wallet.address)).toBe(true);
  });

  it("accepts mainnet bounceable address", () => {
    expect(isValidTonAddress("EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG")).toBe(true);
  });

  it("rejects invalid address", () => {
    expect(isValidTonAddress("not-an-address")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidTonAddress("")).toBe(false);
  });
});
