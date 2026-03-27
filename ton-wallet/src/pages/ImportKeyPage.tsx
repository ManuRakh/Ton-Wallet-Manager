import { useState } from "react";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import { StoredWallet } from "@/lib/storage";

interface ImportKeyPageProps {
  onBack: () => void;
  onImport: (wallet: StoredWallet) => void;
}

export default function ImportKeyPage({ onBack, onImport }: ImportKeyPageProps) {
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setError("");
    const key = privateKey.trim();

    if (!key) {
      setError("Введите приватный ключ");
      return;
    }

    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      setError("Приватный ключ должен содержать ровно 64 hex символа");
      return;
    }

    setLoading(true);
    try {
      const secretKey = Buffer.from(key, "hex");
      const publicKey = secretKey.slice(32);

      const wallet = WalletContractV4.create({
        publicKey,
        workchain: 0,
      });

      const address = wallet.address.toString({ testOnly: true, bounceable: false });

      // Сохраняем как фейковую мнемонику (для совместимости)
      const fakeWallet: StoredWallet = {
        mnemonic: [`IMPORTED_KEY:${key}`],
        address,
        createdAt: Date.now(),
      };

      onImport(fakeWallet);
    } catch (e: any) {
      setError(e?.message || "Неверный приватный ключ");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-lg font-bold text-white">Импорт приватного ключа</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 py-6 space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <div className="text-sm text-amber-300">
              <p className="font-semibold mb-1">Внимание</p>
              <p className="text-amber-400">Импорт приватного ключа даст полный доступ к кошельку. Убедитесь, что вводите ключ в безопасном месте.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Приватный ключ (64 hex символа)
          </label>
          <textarea
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="Введите приватный ключ в hex формате..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 font-mono text-sm resize-none"
            rows={3}
          />
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold transition-colors"
        >
          {loading ? "Импорт..." : "Импортировать кошелек"}
        </button>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
          <p>💡 Приватный ключ — это 64 hex символа (0-9, a-f). Пример: a1b2c3d4e5f6...</p>
        </div>
      </div>
    </div>
  );
}
