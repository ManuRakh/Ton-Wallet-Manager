import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import QRCode from "react-qr-code";

interface ReceivePageProps {
  onBack: () => void;
}

export default function ReceivePage({ onBack }: ReceivePageProps) {
  const { wallet } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!wallet) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="max-w-md mx-auto w-full px-4 py-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4"/>
          </svg>
          Назад
        </button>

        <h1 className="text-xl font-bold text-white mb-6">Получить TON</h1>

        <div className="bg-white rounded-2xl p-4 mb-6 flex items-center justify-center mx-auto w-fit">
          <QRCode
            value={`ton://transfer/${wallet.address}`}
            size={180}
            bgColor="#fff"
            fgColor="#0a0a1a"
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Ваш адрес (TON testnet)</p>
          <p className="text-white font-mono text-sm break-all">{wallet.address}</p>
        </div>

        <button
          onClick={handleCopy}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors ${
            copied
              ? "bg-green-500/20 border border-green-500/40 text-green-400"
              : "bg-blue-500 hover:bg-blue-400 text-white"
          }`}
        >
          {copied ? "✓ Адрес скопирован!" : "Скопировать адрес"}
        </button>

        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-300 text-xs">
            Это адрес в сети <strong>TON Testnet</strong>. Получить тестовые TON можно через{" "}
            <a
              href="https://t.me/testgiver_ton_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-200"
            >
              @testgiver_ton_bot
            </a>{" "}
            в Telegram.
          </p>
        </div>
      </div>
    </div>
  );
}
