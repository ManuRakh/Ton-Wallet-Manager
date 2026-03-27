import { useState } from "react";

interface PinSetupPageProps {
  onPinSet: (pin: string) => void;
  onSkip: () => void;
}

export default function PinSetupPage({ onPinSet, onSkip }: PinSetupPageProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");

  const handlePinInput = (digit: string) => {
    if (step === "enter") {
      if (pin.length < 6) {
        setPin(pin + digit);
        if (pin.length === 5) {
          setTimeout(() => setStep("confirm"), 200);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirm = confirmPin + digit;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 6) {
          if (newConfirm === pin) {
            onPinSet(pin);
          } else {
            setError("ПИН-коды не совпадают");
            setTimeout(() => {
              setPin("");
              setConfirmPin("");
              setStep("enter");
              setError("");
            }, 1500);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === "enter") {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError("");
  };

  const currentPin = step === "enter" ? pin : confirmPin;

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
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === "enter" ? "Создайте ПИН-код" : "Подтвердите ПИН-код"}
          </h2>
          <p className="text-gray-400 text-sm">
            {step === "enter" ? "6 цифр для защиты кошелька" : "Введите ПИН-код еще раз"}
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < currentPin.length
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
            onClick={onSkip}
            className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs transition-colors active:scale-95"
          >
            Пропустить
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

        <p className="text-center text-xs text-gray-600">
          ПИН-код защитит доступ к вашему кошельку на этом устройстве
        </p>
      </div>
    </div>
  );
}
