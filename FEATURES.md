# TON Wallet Manager - Реализованные функции
## Архитектура

```
Frontend: React 19 + TypeScript + Vite
UI: Tailwind CSS + Radix UI
Blockchain: @ton/ton, @ton/crypto
API: Toncenter REST API (testnet)
State: React Context + localStorage (encrypted)
Tests: Vitest (89 тестов)
```

## Безопасность

1. **Шифрование**: Мнемоник шифруется перед сохранением в localStorage
2. **ПИН-код**: Опциональная защита доступа к кошельку
3. **Подтверждение**: Все транзакции требуют подтверждения с показом предупреждений
4. **Address Poisoning**: Проверка похожих адресов (Levenshtein distance)
5. **Предупреждения**: При выходе, отправке на свой адрес, крупных суммах

## Запуск

```bash
pnpm install
pnpm --filter @workspace/ton-wallet run dev    # http://localhost:5173
pnpm --filter @workspace/ton-wallet run build
pnpm --filter @workspace/ton-wallet run test   # 57 тестов
```
