const WALLET_KEY = "ton_testnet_wallet";
const ENCRYPTION_KEY = "ton_wallet_enc_key";
const PIN_KEY = "ton_wallet_pin";
const PIN_HASH_KEY = "ton_wallet_pin_hash";

export interface StoredWallet {
  mnemonic: string[];
  address: string;
  createdAt: number;
}

function simpleEncrypt(text: string, key: string): string {
  const combined = text + key;
  return btoa(combined);
}

function simpleDecrypt(encrypted: string, key: string): string {
  const decoded = atob(encrypted);
  return decoded.slice(0, -key.length);
}

function getOrCreateEncryptionKey(): string {
  let key = localStorage.getItem(ENCRYPTION_KEY);
  if (!key) {
    key = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(ENCRYPTION_KEY, key);
  }
  return key;
}

export function saveWallet(wallet: StoredWallet): void {
  const key = getOrCreateEncryptionKey();
  const encrypted = simpleEncrypt(JSON.stringify(wallet), key);
  localStorage.setItem(WALLET_KEY, encrypted);
}

export function loadWallet(): StoredWallet | null {
  const raw = localStorage.getItem(WALLET_KEY);
  if (!raw) return null;
  try {
    const key = getOrCreateEncryptionKey();
    const decrypted = simpleDecrypt(raw, key);
    return JSON.parse(decrypted) as StoredWallet;
  } catch {
    return null;
  }
}

export function clearWallet(): void {
  localStorage.removeItem(WALLET_KEY);
}

export function hasWallet(): boolean {
  return localStorage.getItem(WALLET_KEY) !== null;
}

function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function savePin(pin: string): void {
  const hash = simpleHash(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export function verifyPin(pin: string): boolean {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return true;
  return simpleHash(pin) === stored;
}

export function hasPin(): boolean {
  return localStorage.getItem(PIN_HASH_KEY) !== null;
}

export function clearPin(): void {
  localStorage.removeItem(PIN_HASH_KEY);
}
