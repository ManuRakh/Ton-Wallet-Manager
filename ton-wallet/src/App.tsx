import { useState, useEffect } from "react";
import { WalletProvider, useWallet } from "@/context/WalletContext";
import { hasPin, verifyPin } from "@/lib/storage";
import SetupPage from "@/pages/SetupPage";
import DashboardPage from "@/pages/DashboardPage";
import ReceivePage from "@/pages/ReceivePage";
import SendPage from "@/pages/SendPage";
import ExportPage from "@/pages/ExportPage";
import PinUnlockPage from "@/pages/PinUnlockPage";

type AppView = "dashboard" | "send" | "receive" | "export";

function AppContent() {
  const { wallet, logout } = useWallet();
  const [view, setView] = useState<AppView>("dashboard");
  const [unlocked, setUnlocked] = useState(!hasPin());

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (wallet) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [wallet]);

  if (!wallet) {
    return <SetupPage />;
  }

  if (!unlocked) {
    return (
      <PinUnlockPage
        onUnlock={(pin) => {
          if (verifyPin(pin)) {
            setUnlocked(true);
          }
        }}
        onForgot={() => {
          if (confirm("Сбросить ПИН-код? Вы останетесь в кошельке, но ПИН будет удален.")) {
            setUnlocked(true);
          }
        }}
      />
    );
  }

  if (view === "receive") {
    return <ReceivePage onBack={() => setView("dashboard")} />;
  }

  if (view === "send") {
    return (
      <SendPage
        onBack={() => setView("dashboard")}
        onSuccess={() => setView("dashboard")}
      />
    );
  }

  if (view === "export") {
    return <ExportPage onBack={() => setView("dashboard")} />;
  }

  return (
    <DashboardPage
      onSend={() => setView("send")}
      onReceive={() => setView("receive")}
      onExport={() => setView("export")}
    />
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
