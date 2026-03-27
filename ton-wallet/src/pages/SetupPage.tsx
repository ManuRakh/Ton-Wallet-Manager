import { useState } from "react";
import { generateMnemonic, mnemonicToWallet, validateMnemonic } from "@/lib/wallet";
import { useWallet } from "@/context/WalletContext";
import { savePin } from "@/lib/storage";
import PinSetupPage from "./PinSetupPage";
import ImportKeyPage from "./ImportKeyPage";

type Step = "choose" | "create-show" | "create-confirm" | "import" | "import-key" | "pin-setup";

export default function SetupPage() {
  const { setWallet } = useWallet();
  const [step, setStep] = useState<Step>("choose");
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [confirmInput, setConfirmInput] = useState("");
  const [importInput, setImportInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const words = await generateMnemonic();
      setMnemonic(words);
      setStep("create-show");
    } catch {
      setError("Ошибка генерации кошелька");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmCreate = async () => {
    const inputWords = confirmInput.trim().toLowerCase().split(/\s+/);
    const mnemonicLower = mnemonic.map((w) => w.toLowerCase());
    if (JSON.stringify(inputWords) !== JSON.stringify(mnemonicLower)) {
      setError("Фраза не совпадает. Проверьте введённые слова.");
      return;
    }
    setStep("pin-setup");
  };

  const finishSetup = async (walletData: { mnemonic: string[]; address: string }) => {
    setWallet({ ...walletData, createdAt: Date.now() });
  };

  const handleImport = async () => {
    const words = importInput.trim().toLowerCase().split(/\s+/);
    if (words.length !== 24) {
      setError("Введите ровно 24 слова сид-фразы");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const valid = await validateMnemonic(words);
      if (!valid) {
        setError("Неверная мнемоническая фраза. Проверьте слова.");
        setLoading(false);
        return;
      }
      const { address } = await mnemonicToWallet(words);
      setMnemonic(words);
      setStep("pin-setup");
    } catch {
      setError("Ошибка импорта кошелька. Проверьте фразу.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "pin-setup") {
    return (
      <PinSetupPage
        onPinSet={async (pin) => {
          savePin(pin);
          const { address } = await mnemonicToWallet(mnemonic);
          finishSetup({ mnemonic, address });
        }}
        onSkip={async () => {
          const { address } = await mnemonicToWallet(mnemonic);
          finishSetup({ mnemonic, address });
        }}
      />
    );
  }

  if (step === "import-key") {
    return (
      <ImportKeyPage
        onBack={() => setStep("choose")}
        onImport={(wallet) => {
          setStep("pin-setup");
          setMnemonic(wallet.mnemonic);
        }}
      />
    );
  }

  if (step === "choose") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 mb-4">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#0098EA" fillOpacity="0.15"/>
                <path d="M20 8L31 14V26L20 32L9 26V14L20 8Z" fill="#0098EA"/>
                <path d="M20 8L31 14L20 20L9 14L20 8Z" fill="#007BC0" fillOpacity="0.7"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">TON Testnet Wallet</h1>
            <p className="text-gray-400 mt-2 text-sm">Self-custodial кошелёк для TON testnet</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Генерация..." : "Создать новый кошелёк"}
            </button>
            <button
              onClick={() => { setStep("import"); setError(""); }}
              className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors"
            >
              Импортировать мнемонику
            </button>
            <button
              onClick={() => { setStep("import-key"); setError(""); }}
              className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors"
            >
              Импортировать приватный ключ
            </button>
          </div>
          {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    );
  }

  if (step === "create-show") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold text-white mb-2">Ваша сид-фраза</h2>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
            <p className="text-amber-400 text-sm font-medium">⚠️ Запишите эти 24 слова в надёжном месте</p>
            <p className="text-amber-300/70 text-xs mt-1">Не сохраняйте в цифровом виде. Потеря фразы = потеря доступа к кошельку.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {mnemonic.map((word, i) => (
              <div key={i} className="flex items-center bg-white/5 rounded-lg px-2 py-1.5 border border-white/10">
                <span className="text-gray-500 text-xs w-5 shrink-0">{i + 1}.</span>
                <span className="text-white text-sm font-mono ml-1">{word}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleCopyMnemonic}
            className="w-full py-2 mb-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm border border-white/10 transition-colors"
          >
            {copied ? "✓ Скопировано!" : "Скопировать фразу"}
          </button>

          <button
            onClick={() => { setStep("create-confirm"); setError(""); }}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors"
          >
            Я записал — продолжить
          </button>
        </div>
      </div>
    );
  }

  if (step === "create-confirm") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold text-white mb-2">Подтвердите фразу</h2>
          <p className="text-gray-400 text-sm mb-4">Введите все 24 слова через пробел, чтобы подтвердить сохранение</p>

          <textarea
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="word1 word2 word3 ..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none mb-4 font-mono"
          />

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <button
            onClick={handleConfirmCreate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Создание..." : "Подтвердить и создать кошелёк"}
          </button>
          <button
            onClick={() => { setStep("create-show"); setError(""); }}
            className="w-full mt-2 py-2 text-gray-400 text-sm hover:text-white transition-colors"
          >
            ← Назад к фразе
          </button>
        </div>
      </div>
    );
  }

  if (step === "import") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold text-white mb-2">Импорт кошелька</h2>
          <p className="text-gray-400 text-sm mb-4">Введите 24 слова вашей сид-фразы через пробел</p>

          <textarea
            value={importInput}
            onChange={(e) => setImportInput(e.target.value)}
            placeholder="word1 word2 word3 ..."
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none mb-4 font-mono"
          />

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Импорт..." : "Импортировать"}
          </button>
          <button
            onClick={() => { setStep("choose"); setError(""); }}
            className="w-full mt-2 py-2 text-gray-400 text-sm hover:text-white transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  return null;
}
