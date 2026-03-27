import { Address, fromNano } from "@ton/core";

const TONCENTER = "https://testnet.toncenter.com/api/v2";

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

function parseFriendlyAddr(raw: string): string {
  try {
    return Address.parse(raw).toString({ testOnly: true, bounceable: false });
  } catch {
    return raw || "";
  }
}

export async function fetchBalance(address: string): Promise<string> {
  const res = await fetch(
    `${TONCENTER}/getAddressInformation?address=${encodeURIComponent(address)}`
  );
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch balance");
  return fromNano(BigInt(data.result.balance || 0));
}

export async function fetchTransactions(
  address: string,
  limit = 50
): Promise<TonTransaction[]> {
  const res = await fetch(
    `${TONCENTER}/getTransactions?address=${encodeURIComponent(address)}&limit=${limit}&archival=true`
  );
  const data = await res.json();
  if (!data.ok || !Array.isArray(data.result)) return [];

  const myFriendly = parseFriendlyAddr(address);

  return data.result.map((tx: any): TonTransaction => {
    const inMsg = tx.in_msg;
    const outMsgs: any[] = tx.out_msgs || [];

    let direction: "in" | "out" = "in";
    let value = "0";
    let from = "";
    let to = "";
    let comment = "";

    if (outMsgs.length > 0) {
      direction = "out";
      const out = outMsgs[0];
      value = fromNano(BigInt(out.value || 0));
      from = myFriendly;
      to = parseFriendlyAddr(out.destination || "");
      if (out.msg_data?.["@type"] === "msg.dataText" && out.msg_data.text) {
        comment = Buffer.from(out.msg_data.text, "base64").toString("utf-8");
      }
    } else if (inMsg?.source) {
      direction = "in";
      value = fromNano(BigInt(inMsg.value || 0));
      from = parseFriendlyAddr(inMsg.source);
      to = myFriendly;
      if (inMsg.msg_data?.["@type"] === "msg.dataText" && inMsg.msg_data.text) {
        comment = Buffer.from(inMsg.msg_data.text, "base64").toString("utf-8");
      }
    }

    return {
      hash: tx.transaction_id?.hash || "",
      lt: tx.transaction_id?.lt || "",
      utime: tx.utime || 0,
      value,
      fee: fromNano(BigInt(tx.fee || 0)),
      from,
      to,
      direction,
      comment,
    };
  });
}

export async function fetchSeqno(address: string): Promise<number> {
  const res = await fetch(`${TONCENTER}/runGetMethod`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, method: "seqno", stack: [] }),
  });
  const data = await res.json();
  if (!data.ok) return 0;
  const stack = data.result?.stack;
  if (Array.isArray(stack) && stack[0]) {
    return parseInt(stack[0][1], 16);
  }
  return 0;
}

export async function broadcastBoc(boc: string): Promise<void> {
  const res = await fetch(`${TONCENTER}/sendBoc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boc }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Broadcast failed: ${data.error || "unknown error"}`);
  }
}
