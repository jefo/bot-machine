# Router

`Router` — точка входа для всех обновлений Telegram. Он похож на приложение Express: middleware, маршруты, fallback.

## Создание

```ts
import { Router } from "@bot-machine/telegram-sdk";

const router = new Router();
```

Логгер можно передать:

```ts
import { createLogger } from "@bot-machine/telegram-sdk";

const router = new Router({ logger: createLogger() });
```

## Маршруты

### Команды

```ts
router.onCommand("start", async (ctx) => {
  await ctx.reply("Привет");
  await ctx.enterFlow("welcome");
});
```

Поддерживается `@username` и аргументы:

```text
/start
/start@my_bot
/start hello
```

### Callback-кнопки

```ts
router.onCallbackQuery("confirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Подтверждено");
});
```

Паттерн с параметром:

```ts
router.onCallbackQuery("item::id", async (ctx) => {
  const { id } = ctx.params;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`Товар ${id}`);
});
```

### Текст

```ts
router.onText("hello", async (ctx) => {
  await ctx.reply("И вам привет");
});

router.onText("weather :city", async (ctx) => {
  await ctx.reply(`Погода: ${ctx.params.city}`);
});
```

### Flow

```ts
import { FlowController } from "@bot-machine/telegram-sdk";

router.addFlow(new FlowController(flow.config, flow.name));
```

Если у пользователя в сессии есть `flowName`, роутер сначала отдаёт update этому flow. Только если flow не обработал — проверяются stateless-маршруты.

## Порядок

1. Middleware.
2. Активный flow.
3. `onCommand`.
4. `onText`.
5. `onCallbackQuery`.
6. `fallback`.

Callback-маршруты проверяются после текста, но у callback и текста разные источники, поэтому конфликтов обычно нет.

## Middleware

```ts
import { session } from "@bot-machine/telegram-sdk";

router.use(session());

router.use(async (ctx, next) => {
  const started = Date.now();
  await next();
  console.log("ms", Date.now() - started);
});
```

Middleware получает `ctx` и `next`. Вызов `next()` передаёт управление дальше.

Встроенный `loggingMiddleware` логирует update и время обработки.

## Fallback

```ts
router.fallback(async (ctx) => {
  await ctx.reply("Не понял. Нажмите /start.");
});
```

Fallback срабатывает, если не совпал ни один маршрут и пользователь не в flow.

## handle

```ts
await client.startPolling((update) => router.handle(update, client));
```

`router.handle(update, client)`:

- создаёт `BotContext`;
- запускает middleware;
- маршрутизирует update;
- ловит ошибки и логирует их.

## Ручной вызов

В тестах можно вызвать `router.route(ctx)` с готовым контекстом. Это быстрее и не требует Telegram.

## Дальше

- [Context](./context.md)
- [Sessions](./sessions.md)
