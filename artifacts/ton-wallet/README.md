# TON Testnet Wallet

Self-custodial кошелёк для TON testnet.

## Архитектура

```
Frontend (React + Vite)  →  Backend (NestJS)  →  TON Testnet API
    Port: 22937                Port: 8080          testnet.toncenter.com
```

**Чёткое разделение:**
- **NestJS Backend** — проксирует все запросы к TON блокчейну (баланс, транзакции, бродкаст)
- **React Frontend** — управляет ключами/мнемоникой, подписывает транзакции, отображает UI
- Приватный ключ **никогда не покидает браузер** (self-custodial)

## Запуск

### Backend (NestJS)

```bash
pnpm --filter @workspace/api-server run dev
```

Доступен на `http://localhost:8080`

### Frontend (React)

```bash
pnpm --filter @workspace/ton-wallet run dev
```

Доступен на `http://localhost:22937`

### Оба сразу (через воркспейс)

```bash
pnpm install
# Запускаются автоматически через конфиг воркспейса
```

## API эндпоинты (NestJS)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Health check |
| GET | `/api/wallet/balance?address=` | Баланс адреса |
| GET | `/api/wallet/transactions?address=&limit=` | История транзакций |
| GET | `/api/wallet/seqno?address=` | Seqno для создания транзакции |
| POST | `/api/wallet/broadcast` | Бродкаст подписанной транзакции (body: `{ boc: string }`) |

## Тесты

```bash
pnpm --filter @workspace/ton-wallet run test
```

## Стек

**Backend:**
- NestJS — фреймворк, модульная архитектура с DI
- TypeScript — строгая типизация, без Zod
- `@ton/ton`, `@ton/core` — взаимодействие с TON блокчейном

**Frontend:**
- React + Vite — SPA
- TypeScript
- `@ton/crypto`, `@ton/ton` — генерация ключей, подпись транзакций (только в браузере)
- `react-qr-code` — QR-код для receive
- `vite-plugin-node-polyfills` — Buffer/crypto полифилы для TON в браузере

---

## Архитектурные решения и компромиссы

### PostgreSQL vs MongoDB

**Выбор: PostgreSQL**

Для кошелька данные строго структурированы — адреса, хеши транзакций, суммы. Схема предсказуема. MongoDB решала бы несуществующую проблему "гибкости схемы". PostgreSQL даёт ACID, нормальные индексы, full-text поиск, и не требует ORM-магии для джойнов. MongoDB имеет смысл при реально непредсказуемой схеме или необходимости горизонтальной шардировки на десятках миллионов документов — не наш случай.

*Примечание: в текущей реализации DB не используется, т.к. данные кошелька хранятся в localStorage (требование ТЗ — без собственного backend storage). При добавлении user accounts и server-side хранилища — PostgreSQL.*

### Разделение frontend/backend

**Backend (NestJS) делает:**
- Проксирует запросы к `testnet.toncenter.com` — централизованная точка для rate limiting и кеширования
- Парсит и нормализует сырые транзакции TON в понятный формат
- Принимает подписанный BOC и бродкастит в сеть

**Frontend (React) делает:**
- Генерирует мнемонику (BIP39, 24 слова)
- Деривирует ключи из мнемоники (`@ton/crypto`)
- Подписывает транзакции локально (`WalletContractV4.createTransfer`)
- Хранит мнемонику в `localStorage` (см. ограничения ниже)

### Хранение мнемоники в localStorage

В открытом виде, без шифрования. ТЗ явно указывает "production-grade безопасность не требуется". В реальном продакшне:
- Шифровать пользовательским паролем через WebCrypto API (AES-GCM)
- Рассмотреть хранение только зашифрованного blob

### Защита от подмены адреса

3 уровня:
1. 🔴 **Блокировка** — отправка на свой адрес
2. 🔴 **Блокировка** — адрес отличается от ранее использованного на ≤3 символа по Levenshtein (Address Poisoning Attack)
3. 🔵 **Инфо** — незнакомый адрес (первое использование)

### Дальнейшие улучшения

1. Шифрование мнемоники паролем (WebCrypto AES-GCM)
2. PostgreSQL для server-side кеширования транзакций
3. WebSocket / SSE для real-time обновлений баланса
4. Поддержка Jetton токенов
5. WalletV5 для gasless транзакций
6. Multi-account

## Получить тестовые TON

https://t.me/testgiver_ton_bot
