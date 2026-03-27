const WALLET_KEY = "ton_testnet_wallet";

export interface StoredWallet {
  mnemonic: string[];
  address: string;
  createdAt: number;
}

export function saveWallet(wallet: StoredWallet): void {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export function loadWallet(): StoredWallet | null {
  const raw = localStorage.getItem(WALLET_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredWallet;
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
