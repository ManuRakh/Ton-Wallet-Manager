import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from "@ton/crypto";
import {
  WalletContractV4,
  internal,
  external,
  toNano,
  Address,
  beginCell,
  storeMessage,
} from "@ton/ton";
import { fetchSeqno, broadcastBoc } from "./api";

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

export async function sendTon(
  mnemonic: string[],
  toAddress: string,
  amount: string,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    const myAddress = wallet.address.toString({ testOnly: true, bounceable: false });

    // Request 1: get seqno via REST (not TonClient JSON-RPC — saves one extra state check)
    const seqno = await fetchSeqno(myAddress);

    let body = beginCell().endCell();
    if (comment) {
      body = beginCell().storeUint(0, 32).storeStringTail(comment).endCell();
    }

    const transferBody = wallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: Address.parse(toAddress),
          value: toNano(amount),
          bounce: false,
          body,
        }),
      ],
      sendMode: 3,
    });

    // When seqno === 0 the wallet contract is not yet deployed.
    // Include stateInit so the validator deploys it together with this message.
    const externalMsg = external({
      to: wallet.address,
      init: seqno === 0 ? wallet.init : undefined,
      body: transferBody,
    });

    // storeMessage handles external-in; external() returns MessageRelaxed
    // which is structurally identical for external-in — safe cast.
    const boc = beginCell()
      .store(storeMessage(externalMsg as any))
      .endCell()
      .toBoc()
      .toString("base64");

    // Request 2: broadcast
    await broadcastBoc(boc);

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Unknown error" };
  }
}
