import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loadWallet, saveWallet, clearWallet, StoredWallet } from "@/lib/storage";
import { fetchBalance, fetchTransactions, TonTransaction } from "@/lib/api";

interface WalletContextValue {
  wallet: StoredWallet | null;
  balance: string;
  transactions: TonTransaction[];
  isLoadingBalance: boolean;
  isLoadingTx: boolean;
  setWallet: (w: StoredWallet | null) => void;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  logout: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWalletState] = useState<StoredWallet | null>(loadWallet);
  const [balance, setBalance] = useState("0");
  const [transactions, setTransactions] = useState<TonTransaction[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  const setWallet = (w: StoredWallet | null) => {
    setWalletState(w);
    if (w) saveWallet(w);
    else clearWallet();
  };

  const refreshBalance = async () => {
    if (!wallet) return;
    setIsLoadingBalance(true);
    try {
      const bal = await fetchBalance(wallet.address);
      setBalance(bal);
    } catch {
      setBalance("0");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const refreshTransactions = async () => {
    if (!wallet) return;
    setIsLoadingTx(true);
    try {
      const txs = await fetchTransactions(wallet.address);
      setTransactions(txs);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoadingTx(false);
    }
  };

  const logout = () => {
    setWallet(null);
    setBalance("0");
    setTransactions([]);
  };

  // Sequential to respect toncenter free-tier rate limit (1 req/s)
  const refreshAll = async (addr: string) => {
    setIsLoadingBalance(true);
    setIsLoadingTx(true);
    try {
      const bal = await fetchBalance(addr);
      setBalance(bal);
    } catch {
      setBalance("0");
    } finally {
      setIsLoadingBalance(false);
    }
    // Small gap between requests
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const txs = await fetchTransactions(addr);
      setTransactions(txs);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    if (wallet) {
      refreshAll(wallet.address);
    }
  }, [wallet?.address]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        balance,
        transactions,
        isLoadingBalance,
        isLoadingTx,
        setWallet,
        refreshBalance,
        refreshTransactions,
        logout,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
