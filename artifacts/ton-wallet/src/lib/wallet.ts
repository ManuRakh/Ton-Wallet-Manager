import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from "@ton/crypto";
import { WalletContractV4, internal, toNano, Address, beginCell } from "@ton/ton";
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
    const seqno = await fetchSeqno(myAddress);

    let body = beginCell().endCell();
    if (comment) {
      body = beginCell().storeUint(0, 32).storeStringTail(comment).endCell();
    }

    const transfer = wallet.createTransfer({
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

    const boc = transfer.toBoc().toString("base64");
    await broadcastBoc(boc);

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Unknown error" };
  }
}
