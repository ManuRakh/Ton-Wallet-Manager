import { useState } from "react";
import { useWallet } from "@/context/WalletContext";

interface ExportPageProps {
  onBack: () => void;
}

export default function ExportPage({ onBack }: ExportPageProps) {
  const { wallet } = useWallet();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!wallet) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.mnemonic.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 border-b border-white/5 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">Экспорт мнемоник</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 py-6 space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="text-sm text-red-300">
              <p className="font-semibold mb-1">Важно!</p>
              <p className="text-red-400">Никогда не делитесь мнемоник фразой. Любой, у кого есть эти слова, получит полный доступ к вашим средствам.</p>
            </div>
          </div>
        </div>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors"
          >
            Показать мнемоник фразу
          </button>
        ) : (
          <>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-2">
                {wallet.mnemonic.map((word, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                    <span className="text-sm text-white font-mono">{word}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full py-3.5 rounded-xl font-semibold transition-colors ${
                copied
                  ? "bg-green-500/20 border border-green-500/40 text-green-400"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
              }`}
            >
              {copied ? "✓ Скопировано!" : "Скопировать все слова"}
            </button>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
              <p>💡 Сохраните эти слова в безопасном месте. Они нужны для восстановления доступа к кошельку.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
