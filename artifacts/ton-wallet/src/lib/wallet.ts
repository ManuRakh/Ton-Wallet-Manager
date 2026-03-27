import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from "@ton/crypto";
import { WalletContractV4, internal, toNano, fromNano, Address } from "@ton/ton";
import { TonClient } from "@ton/ton";

export const TESTNET_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";
export const TESTNET_API_KEY = "";

export function getTonClient(): TonClient {
  return new TonClient({
    endpoint: TESTNET_ENDPOINT,
    apiKey: TESTNET_API_KEY || undefined,
  });
}

export async function generateMnemonic(): Promise<string[]> {
  return await mnemonicNew(24);
}

export async function mnemonicToWallet(mnemonic: string[]): Promise<{
  address: string;
  keyPair: { publicKey: Buffer; secretKey: Buffer };
}> {
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({
    publicKey: keyPair.publicKey,
    workchain: 0,
  });
  return {
    address: wallet.address.toString({ testOnly: true, bounceable: false }),
    keyPair,
  };
}

export async function validateMnemonic(mnemonic: string[]): Promise<boolean> {
  return await mnemonicValidate(mnemonic);
}

export function isValidTonAddress(addr: string): boolean {
  try {
    Address.parse(addr);
    return true;
  } catch {
    return false;
  }
}

export async function getBalance(address: string): Promise<string> {
  const client = getTonClient();
  try {
    const addr = Address.parse(address);
    const balance = await client.getBalance(addr);
    return fromNano(balance);
  } catch (e) {
    console.error("getBalance error", e);
    return "0";
  }
}

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
  status: "ok" | "failed";
}

export async function getTransactions(address: string, limit = 50): Promise<TonTransaction[]> {
  try {
    const url = `https://testnet.toncenter.com/api/v2/getTransactions?address=${encodeURIComponent(address)}&limit=${limit}&archival=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok || !data.result) return [];

    const addr = Address.parse(address);
    const friendlyAddr = addr.toString({ testOnly: true, bounceable: false });

    return data.result.map((tx: any) => {
      const inMsg = tx.in_msg;
      const outMsgs = tx.out_msgs || [];

      let direction: "in" | "out" = "in";
      let value = "0";
      let from = "";
      let to = "";
      let comment = "";

      if (outMsgs.length > 0) {
        direction = "out";
        const outMsg = outMsgs[0];
        value = fromNano(BigInt(outMsg.value || 0));
        from = friendlyAddr;
        try {
          to = outMsg.destination
            ? Address.parse(outMsg.destination).toString({ testOnly: true, bounceable: false })
            : "";
        } catch {
          to = outMsg.destination || "";
        }
        if (outMsg.msg_data?.["@type"] === "msg.dataText") {
          comment = outMsg.msg_data.text
            ? Buffer.from(outMsg.msg_data.text, "base64").toString("utf-8")
            : "";
        }
      } else if (inMsg && inMsg.source) {
        direction = "in";
        value = fromNano(BigInt(inMsg.value || 0));
        try {
          from = Address.parse(inMsg.source).toString({ testOnly: true, bounceable: false });
        } catch {
          from = inMsg.source || "";
        }
        to = friendlyAddr;
        if (inMsg.msg_data?.["@type"] === "msg.dataText") {
          comment = inMsg.msg_data.text
            ? Buffer.from(inMsg.msg_data.text, "base64").toString("utf-8")
            : "";
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
        status: "ok" as const,
      };
    });
  } catch (e) {
    console.error("getTransactions error", e);
    return [];
  }
}

export async function sendTon(
  mnemonic: string[],
  toAddress: string,
  amount: string,
  comment?: string
): Promise<{ success: boolean; error?: string; hash?: string }> {
  try {
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    const client = getTonClient();
    const contract = client.open(wallet);

    const seqno = await contract.getSeqno();

    const transfer = await contract.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: Address.parse(toAddress),
          value: toNano(amount),
          bounce: false,
          body: comment || "",
        }),
      ],
      sendMode: 3,
    });

    await contract.send(transfer);

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Unknown error" };
  }
}
