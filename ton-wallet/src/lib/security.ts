export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export interface SecurityWarning {
  level: "danger" | "warning" | "info";
  message: string;
}

export function checkAddressRisks(
  toAddress: string,
  myAddress: string,
  knownAddresses: string[]
): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];

  if (toAddress.toLowerCase() === myAddress.toLowerCase()) {
    warnings.push({
      level: "danger",
      message: "Вы отправляете средства на свой собственный адрес.",
    });
  }

  for (const known of knownAddresses) {
    if (known.toLowerCase() === toAddress.toLowerCase()) continue;
    const dist = levenshtein(toAddress, known);
    if (dist > 0 && dist <= 3) {
      warnings.push({
        level: "danger",
        message: `Адрес очень похож на недавно использованный адрес (отличие ${dist} символ${dist === 1 ? "" : dist < 5 ? "а" : "ов"}). Возможна подмена адреса.`,
      });
    }
  }

  if (!knownAddresses.includes(toAddress)) {
    warnings.push({
      level: "info",
      message: "Этот адрес вы используете впервые. Дважды проверьте адрес получателя.",
    });
  }

  return warnings;
}

export function checkAmountRisks(amount: string, balance: string): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];
  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(balance);

  if (isNaN(amountNum) || amountNum <= 0) {
    warnings.push({ level: "danger", message: "Введите корректную сумму больше нуля." });
    return warnings;
  }

  if (amountNum > balanceNum) {
    warnings.push({ level: "danger", message: "Сумма превышает ваш баланс." });
  } else if (amountNum >= balanceNum * 0.95) {
    warnings.push({
      level: "warning",
      message: "Вы отправляете почти весь баланс. Учтите, что нужен газ для комиссии (~0.01 TON).",
    });
  }

  if (amountNum >= 100) {
    warnings.push({
      level: "warning",
      message: `Вы отправляете крупную сумму: ${amountNum} TON. Убедитесь, что адрес верный.`,
    });
  }

  return warnings;
}

const RECENT_ADDRESSES_KEY = "ton_recent_addresses";

export function getRecentAddresses(): string[] {
  const raw = localStorage.getItem(RECENT_ADDRESSES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addRecentAddress(addr: string): void {
  const existing = getRecentAddresses();
  const updated = [addr, ...existing.filter((a) => a !== addr)].slice(0, 20);
  localStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(updated));
}
