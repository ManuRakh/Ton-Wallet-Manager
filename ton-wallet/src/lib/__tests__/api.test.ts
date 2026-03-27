import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchBalance, fetchTransactions, fetchSeqno, broadcastBoc } from "../api";

global.fetch = vi.fn();

describe("fetchBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns balance in TON", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: true, result: { balance: "5000000000" } }),
    });

    const balance = await fetchBalance("UQTest");
    expect(balance).toBe("5");
  });

  it("throws error when API returns not ok", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: false, error: "Invalid address" }),
    });

    await expect(fetchBalance("UQTest")).rejects.toThrow("Invalid address");
  });

  it("returns 0 for empty balance", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: true, result: { balance: "0" } }),
    });

    const balance = await fetchBalance("UQTest");
    expect(balance).toBe("0");
  });
});

describe("fetchTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no transactions", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: true, result: [] }),
    });

    const txs = await fetchTransactions("UQTest");
    expect(txs).toEqual([]);
  });

  it("parses outgoing transaction correctly", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        result: [
          {
            transaction_id: { hash: "abc123", lt: "1000" },
            utime: 1700000000,
            fee: "10000000",
            in_msg: {},
            out_msgs: [
              {
                value: "2000000000",
                destination: "UQReceiver",
                msg_data: { "@type": "msg.dataText", text: Buffer.from("test").toString("base64") },
              },
            ],
          },
        ],
      }),
    });

    const txs = await fetchTransactions("UQTest");
    expect(txs).toHaveLength(1);
    expect(txs[0].direction).toBe("out");
    expect(txs[0].value).toBe("2");
    expect(txs[0].comment).toBe("test");
  });

  it("parses incoming transaction correctly", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        result: [
          {
            transaction_id: { hash: "def456", lt: "2000" },
            utime: 1700000100,
            fee: "5000000",
            in_msg: {
              source: "UQSender",
              value: "3000000000",
              msg_data: { "@type": "msg.dataText", text: Buffer.from("hello").toString("base64") },
            },
            out_msgs: [],
          },
        ],
      }),
    });

    const txs = await fetchTransactions("UQTest");
    expect(txs).toHaveLength(1);
    expect(txs[0].direction).toBe("in");
    expect(txs[0].value).toBe("3");
    expect(txs[0].comment).toBe("hello");
  });

  it("returns empty array on API error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: false }),
    });

    const txs = await fetchTransactions("UQTest");
    expect(txs).toEqual([]);
  });
});

describe("fetchSeqno", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns seqno from stack", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        result: { exit_code: 0, stack: [["num", "0x5"]] },
      }),
    });

    const seqno = await fetchSeqno("UQTest");
    expect(seqno).toBe(5);
  });

  it("returns 0 when contract not initialized (exit_code -13)", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        result: { exit_code: -13 },
      }),
    });

    const seqno = await fetchSeqno("UQTest");
    expect(seqno).toBe(0);
  });

  it("returns 0 when API returns not ok", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: false }),
    });

    const seqno = await fetchSeqno("UQTest");
    expect(seqno).toBe(0);
  });

  it("returns 0 when stack is empty", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        result: { exit_code: 0, stack: [] },
      }),
    });

    const seqno = await fetchSeqno("UQTest");
    expect(seqno).toBe(0);
  });
});

describe("broadcastBoc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds when API returns ok", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: true }),
    });

    await expect(broadcastBoc("base64boc")).resolves.toBeUndefined();
  });

  it("throws error when API returns not ok", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: false, error: "Invalid BOC" }),
    });

    await expect(broadcastBoc("base64boc")).rejects.toThrow("Invalid BOC");
  });

  it("throws generic error when no error message", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: false }),
    });

    await expect(broadcastBoc("base64boc")).rejects.toThrow("unknown error");
  });
});
