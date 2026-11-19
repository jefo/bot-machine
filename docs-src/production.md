# Production

Чек-лист для бота, который работает не только на ноутбуке.

## 1. Сессии

По умолчанию сессии живут в памяти процесса. Для production подключите Redis:

```ts
import { createClient } from "redis";
import { RedisSessionStore } from "@bot-machine/telegram-sdk";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

router.use(
  session({
    store: new RedisSessionStore(redis, { prefix: "bot:session" })
  })
);
```

Проверьте:

- TTL или регулярную очистку старых ключей;
- сериализацию: в сессии только JSON-данные;
- размер сессии: не храните истории диалогов целиком.

## 2. Логирование

```ts
import { createLogger } from "@bot-machine/telegram-sdk";

const logger = createLogger();
const router = new Router({ logger });
router.use(loggingMiddleware());
```

В production отключите `pino-pretty` (он для development) и пишите JSON в stdout.

## 3. Ошибки

- Логируйте ошибки с `update_id` и `user_id`.
- Не показывайте пользователю стектрейсы.
- Для ожидаемых ошибок возвращайте `{ ok: false, reason }`.
- Для неожиданных — fallback и алерт.

## 4. Polling

В 0.1.11 используется long polling:

```ts
await client.startPolling((update) => router.handle(update, client));
```

- Один процесс на токен. Второй polling-процесс начнёт конфликтовать.
- При деплое сначала останавливайте старый процесс, потом запускайте новый.
- Для нескольких инстансов нужен webhook или распределённая блокировка.

## 5. Перезапуск

- Сессии в Redis переживают перезапуск.
- Активные flow продолжатся с `flowState`.
- Проверьте, что версия кода совместима со старыми состояниями.

## 6. Деплой

Bun-процесс под systemd, Docker или на платформе с поддержкой Bun:

```bash
BOT_TOKEN=... REDIS_URL=... bun run start
```

Переменные:

```env
BOT_TOKEN=123456:AA...
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

## 7. Мониторинг

Минимум:

- процесс жив;
- polling не падает;
- ошибки в логах;
- задержка ответа;
- число активных сессий.

## 8. Безопасность

- Токен только в env, не в git.
- Не логируйте токен.
- Ограничьте доступ к Redis.
- Валидируйте всё, что приходит от пользователя.
- Не выполняйте команды из текста.

## Чек-лист

- [ ] Redis подключён.
- [ ] Токен в env.
- [ ] Логи JSON.
- [ ] Fallback отвечает пользователю.
- [ ] Один polling-процесс.
- [ ] Есть healthcheck.
- [ ] Есть план перезапуска.
- [ ] Тесты проходят.
