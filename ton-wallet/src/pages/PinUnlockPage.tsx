import { useState } from "react";

interface PinUnlockPageProps {
  onUnlock: (pin: string) => void;
  onForgot: () => void;
}

export default function PinUnlockPage({ onUnlock, onForgot }: PinUnlockPageProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");
      if (newPin.length === 6) {
        setTimeout(() => onUnlock(newPin), 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0098EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Введите ПИН-код</h2>
          <p className="text-gray-400 text-sm">Разблокируйте кошелек</p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < pin.length
                  ? error
                    ? "bg-red-500"
                    : "bg-blue-500"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handlePinInput(digit.toString())}
              className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-2xl font-semibold transition-colors active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={onForgot}
            className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs transition-colors active:scale-95"
          >
            Забыли?
          </button>
          <button
            onClick={() => handlePinInput("0")}
            className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-2xl font-semibold transition-colors active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-colors active:scale-95"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
              <line x1="18" y1="9" x2="12" y2="15"/>
              <line x1="12" y1="9" x2="18" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
