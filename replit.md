# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### `artifacts/ton-wallet` — TON Testnet Self-Custodial Wallet

React + Vite SPA, fully client-side, **no own backend**.

All blockchain data is fetched directly from `https://testnet.toncenter.com/api/v2` in the browser.
All crypto operations (key derivation, transaction signing) happen in the browser — private keys never leave the client.

**Tech:**
- `@ton/ton`, `@ton/crypto`, `@ton/core` — TON blockchain integration
- `react-qr-code` — QR code generation for receive screen
- `vite-plugin-node-polyfills` — Node.js polyfills (Buffer, crypto) for browser
- `vitest` — unit tests
- TON Testnet API: `testnet.toncenter.com`
- `localStorage` — mnemonic and recent address storage

**Features:**
- Create new wallet (24-word BIP39 mnemonic)
- Import wallet via mnemonic
- Dashboard: address, balance, transaction history with search
- Receive screen: address display, copy, QR code
- Send screen: validation, security warnings, confirmation step
- Anti-address-poisoning: Levenshtein distance check, self-send detection, new address info

**Security checks (lib/security.ts):**
- Danger: same address as self → blocked
- Danger: address similar to known by ≤3 chars (Levenshtein) → blocked
- Info: new/unknown address → shown, not blocked
- Warning: sending >95% of balance → shown, not blocked
- Warning: sending >100 TON → shown, not blocked

**Key files:**
- `src/lib/api.ts` — toncenter.com REST API client (balance, transactions, seqno, broadcast)
- `src/lib/wallet.ts` — key derivation, address generation, transaction signing (client-side only)
- `src/lib/security.ts` — address risk analysis
- `src/lib/storage.ts` — localStorage helpers
- `src/context/WalletContext.tsx` — global wallet state
- `src/pages/` — SetupPage, DashboardPage, ReceivePage, SendPage

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (no own backend)
- **Validation**: Plain TypeScript types — no Zod

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── ton-wallet/         # React + Vite SPA (the main app)
│   ├── api-server/         # Unused artifact shell (kept for platform bookkeeping)
│   └── mockup-sandbox/     # Design mockup sandbox
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Tests

```bash
pnpm --filter @workspace/ton-wallet run test
# 29 unit tests, all passing
```
