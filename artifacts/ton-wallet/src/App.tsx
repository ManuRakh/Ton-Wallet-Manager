import { useState } from "react";
import { WalletProvider, useWallet } from "@/context/WalletContext";
import SetupPage from "@/pages/SetupPage";
import DashboardPage from "@/pages/DashboardPage";
import ReceivePage from "@/pages/ReceivePage";
import SendPage from "@/pages/SendPage";

type AppView = "dashboard" | "send" | "receive";

function AppContent() {
  const { wallet } = useWallet();
  const [view, setView] = useState<AppView>("dashboard");

  if (!wallet) {
    return <SetupPage />;
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

  return (
    <DashboardPage
      onSend={() => setView("send")}
      onReceive={() => setView("receive")}
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
