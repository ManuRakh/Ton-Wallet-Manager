import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { sendTon, isValidTonAddress } from "@/lib/wallet";
import {
  checkAddressRisks,
  checkAmountRisks,
  getRecentAddresses,
  addRecentAddress,
  SecurityWarning,
} from "@/lib/security";

interface SendPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

type SendState = "form" | "confirm" | "sending" | "success" | "error";

function WarningBadge({ warning }: { warning: SecurityWarning }) {
  const styles = {
    danger: "bg-red-500/15 border-red-500/40 text-red-300",
    warning: "bg-amber-500/15 border-amber-500/40 text-amber-300",
    info: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  };
  const icons = { danger: "🚨", warning: "⚠️", info: "ℹ️" };

  return (
    <div className={`flex gap-2 p-3 rounded-xl border text-sm ${styles[warning.level]}`}>
      <span>{icons[warning.level]}</span>
      <span>{warning.message}</span>
    </div>
  );
}

export default function SendPage({ onBack, onSuccess }: SendPageProps) {
  const { wallet, balance, refreshBalance, refreshTransactions } = useWallet();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [sendState, setSendState] = useState<SendState>("form");
  const [warnings, setWarnings] = useState<SecurityWarning[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [addressError, setAddressError] = useState("");
  const [amountError, setAmountError] = useState("");

  if (!wallet) return null;

  const validateForm = (): boolean => {
    let ok = true;

    if (!toAddress.trim()) {
      setAddressError("Введите адрес получателя");
      ok = false;
    } else if (!isValidTonAddress(toAddress.trim())) {
      setAddressError("Неверный формат TON адреса");
      ok = false;
    } else {
      setAddressError("");
    }

    const amountNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      setAmountError("Введите корректную сумму");
      ok = false;
    } else if (amountNum > parseFloat(balance)) {
      setAmountError("Недостаточно средств");
      ok = false;
    } else {
      setAmountError("");
    }

    return ok;
  };

  const handleReview = () => {
    if (!validateForm()) return;

    const recentAddresses = getRecentAddresses();
    const addrWarnings = checkAddressRisks(toAddress.trim(), wallet.address, recentAddresses);
    const amtWarnings = checkAmountRisks(amount.trim(), balance);

    setWarnings([...addrWarnings, ...amtWarnings]);
    setSendState("confirm");
  };

  const handleSend = async () => {
    setSendState("sending");
    const result = await sendTon(wallet.mnemonic, toAddress.trim(), amount.trim(), comment.trim() || undefined);

    if (result.success) {
      addRecentAddress(toAddress.trim());
      setSendState("success");
      setTimeout(() => {
        refreshBalance();
        refreshTransactions();
      }, 3000);
    } else {
      setErrorMessage(result.error || "Неизвестная ошибка");
      setSendState("error");
    }
  };

  const handleSetMax = () => {
    const fee = 0.01;
    const max = Math.max(0, parseFloat(balance) - fee);
    setAmount(max.toFixed(4));
  };

  if (sendState === "sending") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="#0098EA"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Отправка транзакции</h2>
          <p className="text-gray-400 text-sm">Ожидайте подтверждения сети...</p>
          <p className="text-gray-600 text-xs mt-2">TON testnet может отвечать медленнее обычного</p>
        </div>
      </div>
    );
  }

  if (sendState === "success") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center px-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Транзакция отправлена!</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-left space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Получатель</span>
              <span className="text-white font-mono text-xs">{toAddress.slice(0, 8)}...{toAddress.slice(-6)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Сумма</span>
              <span className="text-white">{amount} TON</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-6">Транзакция появится в истории через несколько секунд</p>
          <button
            onClick={onSuccess}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors"
          >
            Вернуться к кошельку
          </button>
        </div>
      </div>
    );
  }

  if (sendState === "error") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center px-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ошибка отправки</h2>
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{errorMessage}</p>
          <button
            onClick={() => setSendState("form")}
            className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-colors mb-2"
          >
            Попробовать снова
          </button>
          <button onClick={onBack} className="w-full py-2 text-gray-500 text-sm hover:text-white transition-colors">
            Отмена
          </button>
        </div>
      </div>
    );
  }

  if (sendState === "confirm") {
    const dangerWarnings = warnings.filter((w) => w.level === "danger");
    const hasDanger = dangerWarnings.length > 0;

    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <div className="max-w-md mx-auto w-full px-4 py-4">
          <button onClick={() => setSendState("form")} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 12L6 8l4-4"/>
            </svg>
            Изменить
          </button>

          <h1 className="text-xl font-bold text-white mb-4">Подтверждение отправки</h1>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Получатель</p>
              <p className="text-white font-mono text-sm break-all">{toAddress}</p>
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="text-xs text-gray-500 mb-1">Сумма</p>
              <p className="text-white text-lg font-bold">{amount} TON</p>
            </div>
            {comment && (
              <div className="border-t border-white/5 pt-3">
                <p className="text-xs text-gray-500 mb-1">Комментарий</p>
                <p className="text-white text-sm">{comment}</p>
              </div>
            )}
            <div className="border-t border-white/5 pt-3">
              <p className="text-xs text-gray-500 mb-1">Комиссия сети (оценка)</p>
              <p className="text-gray-300 text-sm">~0.01 TON</p>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="space-y-2 mb-4">
              {warnings.map((w, i) => (
                <WarningBadge key={i} warning={w} />
              ))}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={hasDanger}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors mb-2 ${
              hasDanger
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-400 text-white"
            }`}
          >
            {hasDanger ? "Отправка заблокирована (критическое предупреждение)" : "Подтвердить и отправить"}
          </button>

          {hasDanger && (
            <p className="text-red-400 text-xs text-center">
              Исправьте критические ошибки перед отправкой
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="max-w-md mx-auto w-full px-4 py-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4"/>
          </svg>
          Назад
        </button>

        <h1 className="text-xl font-bold text-white mb-6">Отправить TON</h1>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Адрес получателя</label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => { setToAddress(e.target.value); setAddressError(""); }}
              placeholder="UQ... или EQ..."
              className={`w-full bg-white/5 border rounded-xl px-3 py-3 text-white text-sm placeholder-gray-600 focus:outline-none font-mono ${addressError ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500/50"}`}
            />
            {addressError && <p className="text-red-400 text-xs mt-1">{addressError}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Сумма (TON)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError(""); }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full bg-white/5 border rounded-xl px-3 py-3 pr-14 text-white text-sm placeholder-gray-600 focus:outline-none ${amountError ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500/50"}`}
              />
              <button
                onClick={handleSetMax}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
              >
                Макс
              </button>
            </div>
            {amountError ? (
              <p className="text-red-400 text-xs mt-1">{amountError}</p>
            ) : (
              <p className="text-gray-600 text-xs mt-1">Доступно: {parseFloat(balance).toFixed(4)} TON</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Комментарий (необязательно)</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Добавить комментарий..."
              maxLength={120}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <button
          onClick={handleReview}
          className="w-full mt-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-colors"
        >
          Проверить перед отправкой
        </button>
      </div>
    </div>
  );
}
