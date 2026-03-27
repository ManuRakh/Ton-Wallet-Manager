import { useState, useMemo } from "react";
import { useWallet } from "@/context/WalletContext";
import { TonTransaction } from "@/lib/wallet";

function formatDate(utime: number): string {
  return new Date(utime * 1000).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

function TxItem({ tx }: { tx: TonTransaction }) {
  const isIn = tx.direction === "in";
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isIn ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
            {isIn ? "↓" : "↑"}
          </div>
          <div>
            <p className="text-sm text-white">{isIn ? "Получено" : "Отправлено"}</p>
            <p className="text-xs text-gray-500">{formatDate(tx.utime)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-mono font-medium ${isIn ? "text-green-400" : "text-white"}`}>
            {isIn ? "+" : "-"}{parseFloat(tx.value).toFixed(4)} TON
          </p>
          <p className="text-xs text-gray-600">fee {parseFloat(tx.fee).toFixed(4)}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/5 text-xs text-gray-400 space-y-1 text-left">
          <div className="flex justify-between">
            <span className="text-gray-600">От:</span>
            <span className="font-mono">{shortAddr(tx.from)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Кому:</span>
            <span className="font-mono">{shortAddr(tx.to)}</span>
          </div>
          {tx.comment && (
            <div className="flex justify-between">
              <span className="text-gray-600">Комментарий:</span>
              <span>{tx.comment}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Hash:</span>
            <span className="font-mono">{shortAddr(tx.hash)}</span>
          </div>
        </div>
      )}
    </button>
  );
}

interface DashboardPageProps {
  onSend: () => void;
  onReceive: () => void;
}

export default function DashboardPage({ onSend, onReceive }: DashboardPageProps) {
  const { wallet, balance, transactions, isLoadingBalance, isLoadingTx, refreshBalance, refreshTransactions, logout } = useWallet();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.from.toLowerCase().includes(q) ||
        tx.to.toLowerCase().includes(q) ||
        tx.hash.toLowerCase().includes(q) ||
        tx.comment.toLowerCase().includes(q) ||
        tx.value.includes(q)
    );
  }, [transactions, search]);

  const handleCopyAddress = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    refreshBalance();
    refreshTransactions();
  };

  if (!wallet) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 0L12.5 3V9L7 12L1.5 9V3L7 0Z" fill="#0098EA"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm">TON Testnet</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="text-gray-500 hover:text-white transition-colors p-1"
                title="Обновить"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13.5 2.5A6.5 6.5 0 0 0 2.5 8" strokeLinecap="round"/>
                  <path d="M2.5 13.5A6.5 6.5 0 0 0 13.5 8" strokeLinecap="round"/>
                  <path d="M13.5 2.5V5.5H10.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.5 13.5V10.5H5.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-red-500/10"
              >
                Выйти
              </button>
            </div>
          </div>

          <div className="text-center py-2">
            <div className="text-4xl font-bold text-white mb-1">
              {isLoadingBalance ? (
                <span className="text-gray-500 text-2xl">Загрузка...</span>
              ) : (
                <>{parseFloat(balance).toFixed(4)} <span className="text-blue-400">TON</span></>
              )}
            </div>
            <button
              onClick={handleCopyAddress}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1 font-mono"
            >
              <span>{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="7" height="7" rx="1"/>
                <path d="M8 4V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2"/>
              </svg>
              {copied && <span className="text-green-400 not-italic font-sans">Скопировано!</span>}
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={onReceive}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors"
            >
              ↓ Получить
            </button>
            <button
              onClick={onSend}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors"
            >
              ↑ Отправить
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="px-4 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по транзакциям..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/40"
          />
        </div>

        <div className="flex-1">
          {isLoadingTx ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">Загрузка транзакций...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-600 text-sm">
              {search ? "Транзакции не найдены" : "Транзакций пока нет"}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((tx) => (
                <TxItem key={tx.hash + tx.lt} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
