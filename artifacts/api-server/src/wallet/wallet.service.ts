import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Address, fromNano } from '@ton/core';
import { TonClient } from '@ton/ton';

const TESTNET_ENDPOINT = 'https://testnet.toncenter.com/api/v2/jsonRPC';

export interface TonTransaction {
  hash: string;
  lt: string;
  utime: number;
  value: string;
  fee: string;
  from: string;
  to: string;
  direction: 'in' | 'out';
  comment: string;
}

function parseFriendlyAddr(raw: string): string {
  try {
    return Address.parse(raw).toString({ testOnly: true, bounceable: false });
  } catch {
    return raw || '';
  }
}

@Injectable()
export class WalletService {
  private readonly client: TonClient;

  constructor() {
    this.client = new TonClient({ endpoint: TESTNET_ENDPOINT });
  }

  validateAddress(address: string): void {
    try {
      Address.parse(address);
    } catch {
      throw new BadRequestException(`Invalid TON address: ${address}`);
    }
  }

  async getBalance(address: string): Promise<string> {
    this.validateAddress(address);
    try {
      const addr = Address.parse(address);
      const balance = await this.client.getBalance(addr);
      return fromNano(balance);
    } catch (err: any) {
      throw new InternalServerErrorException(`Failed to fetch balance: ${err?.message}`);
    }
  }

  async getTransactions(address: string, limit = 50): Promise<TonTransaction[]> {
    this.validateAddress(address);
    try {
      const url = `https://testnet.toncenter.com/api/v2/getTransactions?address=${encodeURIComponent(address)}&limit=${limit}&archival=true`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.result)) return [];

      const myFriendly = parseFriendlyAddr(address);

      return data.result.map((tx: any): TonTransaction => {
        const inMsg = tx.in_msg;
        const outMsgs: any[] = tx.out_msgs || [];

        let direction: 'in' | 'out' = 'in';
        let value = '0';
        let from = '';
        let to = '';
        let comment = '';

        if (outMsgs.length > 0) {
          direction = 'out';
          const out = outMsgs[0];
          value = fromNano(BigInt(out.value || 0));
          from = myFriendly;
          to = parseFriendlyAddr(out.destination || '');
          if (out.msg_data?.['@type'] === 'msg.dataText' && out.msg_data.text) {
            comment = Buffer.from(out.msg_data.text, 'base64').toString('utf-8');
          }
        } else if (inMsg?.source) {
          direction = 'in';
          value = fromNano(BigInt(inMsg.value || 0));
          from = parseFriendlyAddr(inMsg.source);
          to = myFriendly;
          if (inMsg.msg_data?.['@type'] === 'msg.dataText' && inMsg.msg_data.text) {
            comment = Buffer.from(inMsg.msg_data.text, 'base64').toString('utf-8');
          }
        }

        return {
          hash: tx.transaction_id?.hash || '',
          lt: tx.transaction_id?.lt || '',
          utime: tx.utime || 0,
          value,
          fee: fromNano(BigInt(tx.fee || 0)),
          from,
          to,
          direction,
          comment,
        };
      });
    } catch (err: any) {
      throw new InternalServerErrorException(`Failed to fetch transactions: ${err?.message}`);
    }
  }

  async getSeqno(address: string): Promise<number> {
    this.validateAddress(address);
    try {
      const url = `https://testnet.toncenter.com/api/v2/runGetMethod`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          method: 'seqno',
          stack: [],
        }),
      });
      const data = await res.json();
      if (!data.ok) return 0;
      const stack = data.result?.stack;
      if (Array.isArray(stack) && stack[0]) {
        return parseInt(stack[0][1], 16);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  async broadcastBoc(boc: string): Promise<void> {
    const res = await fetch('https://testnet.toncenter.com/api/v2/sendBoc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boc }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new InternalServerErrorException(`Broadcast failed: ${data.error || 'unknown error'}`);
    }
  }
}
