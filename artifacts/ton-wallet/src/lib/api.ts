export interface TonTransaction {
  hash: string;
  lt: string;
  utime: number;
  value: string;
  fee: string;
  from: string;
  to: string;
  direction: "in" | "out";
  comment: string;
}

const BASE = "/api/wallet";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

export async function fetchBalance(address: string): Promise<string> {
  const data = await get<{ balance: string }>(`/balance?address=${encodeURIComponent(address)}`);
  return data.balance;
}

export async function fetchTransactions(address: string, limit = 50): Promise<TonTransaction[]> {
  const data = await get<{ transactions: TonTransaction[] }>(
    `/transactions?address=${encodeURIComponent(address)}&limit=${limit}`
  );
  return data.transactions;
}

export async function fetchSeqno(address: string): Promise<number> {
  const data = await get<{ seqno: number }>(`/seqno?address=${encodeURIComponent(address)}`);
  return data.seqno;
}

export async function broadcastBoc(boc: string): Promise<void> {
  await post<{ success: boolean }>("/broadcast", { boc });
}
