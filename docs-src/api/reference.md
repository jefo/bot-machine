# Справочник API

Версия: **0.1.11**. Импорт:

```ts
import {
  Router,
  FlowController,
  createFlow,
  createCommand,
  createQuery,
  session,
  RedisSessionStore,
  Keyboard,
  format,
  createLogger
} from "@bot-machine/telegram-sdk";
```

`TelegramClient` импортируется отдельно:

```ts
import { TelegramClient } from "@bot-machine/telegram-client";
```

## createFlow

```ts
createFlow(name: string, config: FlowConfig): FlowDefinition
```

Создаёт type-safe определение flow.

```ts
const flow = createFlow("appointment", {
  index: { component: async () => ({ text: "Старт" }) }
});

flow.name;    // "appointment"
flow.config;  // объект состояний
flow.states;  // { index: "index" }
```

## FlowController

```ts
new FlowController(config: FlowConfig, name: string)
```

| Метод | Описание |
| --- | --- |
| `handle(ctx): Promise<boolean>` | обработать update, если пользователь в этом flow |
| `name` | имя flow |

```ts
const controller = new FlowController(flow.config, flow.name);
router.addFlow(controller);
```

## FlowState

```ts
interface FlowState {
  component: Component;
  onEnter?: BotQuery;
  onAction?: Record<string, ActionHandler>;
  onText?: Record<string, ActionHandler>;
}
```

`component` обязателен. Остальные поля опциональны.

## ActionHandler

```ts
interface ActionHandler {
  command: BotCommand;
  nextState?: string | ((result: any) => string);
  refresh?: boolean;
}
```

- `nextState` — переход.
- `refresh: true` — перерисовать текущее состояние.
- Если нет ни `nextState`, ни `refresh` — выйти из flow.

## createCommand

```ts
createCommand({
  name: string,
  input?: ZodType,
  output?: ZodType,
  execute: (input, ctx) => Promise<TOutput>
}): BotCommand
```

```ts
const saveName = createCommand({
  name: "saveName",
  input: z.object({ name: z.string() }),
  output: z.object({ saved: z.boolean() }),
  execute: async ({ name }, ctx) => {
    ctx.session.name = name;
    return { saved: true };
  }
});
```

`input` по умолчанию `z.void()`. `output` по умолчанию `z.any()`; если задан, результат проверяется.

## createQuery

```ts
createQuery({
  name: string,
  input?: ZodType,
  output?: ZodType,
  execute: (input, ctx) => Promise<TOutput>
}): BotQuery
```

```ts
const getCount = createQuery({
  name: "getCount",
  input: z.void(),
  output: z.object({ count: z.number() }),
  execute: async (_, ctx) => ({ count: ctx.session.count ?? 0 })
});
```

## Router

```ts
new Router(options?: { logger?: ILogger })
```

| Метод | Описание |
| --- | --- |
| `onCommand(pattern, handler)` | `/start`, `/start@bot`, RegExp |
| `onCallbackQuery(pattern, handler)` | callback data, `::id` |
| `onText(pattern, handler)` | текст, `:name` |
| `addFlow(controller)` | зарегистрировать flow |
| `use(middleware)` | middleware |
| `fallback(handler)` | обработчик без совпадений |
| `handle(update, client)` | точка входа из polling |
| `route(ctx)` | маршрутизация готового контекста |

```ts
router.onCommand("start", async (ctx) => {
  await ctx.reply("Привет");
  await ctx.enterFlow("welcome");
});
```

## session

```ts
session(options?: { store?: ISessionStore }): Middleware
```

```ts
router.use(session());
```

По умолчанию in-memory. Для Redis:

```ts
router.use(session({ store: new RedisSessionStore(redis) }));
```

## RedisSessionStore

```ts
new RedisSessionStore(client: RedisClientType, options?: { prefix?: string })
```

```ts
const store = new RedisSessionStore(redis, { prefix: "bot:session" });
```

## Keyboard

```ts
const keyboard = new Keyboard()
  .text("Да", "confirm")
  .text("Нет", "cancel")
  .row()
  .url("Сайт", "https://example.com");
```

| Метод | Описание |
| --- | --- |
| `text(label, callbackData)` | callback-кнопка |
| `url(label, url)` | ссылка |
| `login(label, loginUrl)` | Telegram Login |
| `switchInline(label, query)` | inline-режим |
| `webApp(label, info)` | Web App |
| `pay(label)` | оплата |
| `requestContact(label)` | контакт |
| `requestLocation(label)` | геолокация |
| `requestPoll(label, type?)` | опрос |
| `row()` | новый ряд |
| `inline()` | `InlineKeyboardMarkup` |
| `reply(options?)` | `ReplyKeyboardMarkup` |
| `static remove()` | убрать reply-клавиатуру |

## format

```ts
format((tools) => Fragment): FormattedText
```

Инструменты: `b`, `i`, `u`, `s`, `sp`, `c`, `l`, `p`, `n`, символы (`check`, `cross`, `bullet`, `arrow`, `rocket` и др.).

```ts
const text = format(({ b, c, n }) => [b("Итого:"), " ", c("1000 ₽"), n()]);
await ctx.reply(text.text, { parse_mode: text.parseMode });
```

## AppContext

| Поле | Тип |
| --- | --- |
| `update` | `Update` |
| `client` | `TelegramClient` |
| `logger` | `ILogger` |
| `router` | `Router` |
| `from` | `User \| undefined` |
| `chat` | `Chat \| undefined` |
| `session` | `Record<string, any>` |
| `state` | `Record<string, any>` |
| `params` | `Record<string, string>` |

| Метод | Описание |
| --- | --- |
| `reply(text, extra?)` | отправить сообщение |
| `editMessageText(text, extra?)` | редактировать сообщение |
| `deleteMessage()` | удалить сообщение |
| `answerCallbackQuery(text?)` | ответить на callback |
| `enterFlow(name, initialState?)` | войти в flow |

## MessagePayload

```ts
interface MessagePayload {
  text: string;
  parse_mode?: "HTML" | "MarkdownV2";
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
}
```

## ISessionStore

```ts
interface ISessionStore {
  get(key: string): Promise<Record<string, any> | undefined>;
  set(key: string, value: Record<string, any>): Promise<void>;
  delete(key: string): Promise<void>;
}
```

## createLogger

```ts
createLogger(options?: pino.LoggerOptions): ILogger
```

```ts
const logger = createLogger();
const router = new Router({ logger });
```

## Экспорты

| Экспорт | Назначение |
| --- | --- |
| `Router` | маршрутизация update |
| `FlowController` | исполнение flow |
| `createFlow` | определение flow |
| `createCommand` | бизнес-команда |
| `createQuery` | запрос данных |
| `session` | middleware сессии |
| `RedisSessionStore` | Redis-хранилище |
| `Keyboard` | клавиатуры |
| `format` | HTML-форматирование |
| `createLogger` | pino-логгер |
| `UI-kit` | готовые сообщения |
