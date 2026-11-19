# Быстрый старт

Соберём бота, который спрашивает имя и здоровается.

## Требования

- [Bun](https://bun.com) 1.2+
- Токен от [@BotFather](https://t.me/BotFather)

## Установка

```bash
bun add @bot-machine/telegram-sdk @bot-machine/telegram-client zod
```

`@bot-machine/telegram-sdk` — фреймворк. `@bot-machine/telegram-client` — тонкий клиент Bot API. `zod` — схемы для команд и запросов.

## Код

```ts
import { TelegramClient } from "@bot-machine/telegram-client";
import {
  Router,
  FlowController,
  session,
  createFlow,
  createCommand,
  createQuery
} from "@bot-machine/telegram-sdk";
import { z } from "zod";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is required");

const client = new TelegramClient(token);
const router = new Router();

// Сессия нужна flow, чтобы помнить состояние между сообщениями.
router.use(session());

router.onCommand("start", async (ctx) => {
  await ctx.reply("Привет! Давайте познакомимся.");
  await ctx.enterFlow("welcome");
});

const welcome = createFlow("welcome", {
  index: {
    component: async () => ({ text: "Как вас зовут?" }),
    onText: {
      ":name": {
        command: createCommand({
          name: "saveName",
          input: z.object({ name: z.string().min(1) }),
          execute: async ({ name }, ctx) => {
            ctx.session.name = name;
          }
        }),
        nextState: "greet"
      }
    }
  },
  greet: {
    onEnter: createQuery({
      name: "getName",
      execute: async (_, ctx) => ({ name: ctx.session.name as string })
    }),
    component: async ({ name }: { name: string }) => ({
      text: `Привет, ${name}!`
    })
  }
});

router.addFlow(new FlowController(welcome.config, welcome.name));

await client.startPolling((update) => router.handle(update, client));
```

Запуск:

```bash
BOT_TOKEN=123456:AA... bun run index.ts
```

В Telegram: `/start` → имя → приветствие.

## Что произошло

1. `Router` получил update от Telegram.
2. `session()` загрузил сессию пользователя.
3. `/start` вызвал `ctx.enterFlow("welcome")`.
4. `FlowController` отрисовал состояние `index`.
5. Текст «Иван» совпал с паттерном `:name`.
6. `createCommand` проверил вход по Zod и сохранил имя в сессию.
7. Flow перешёл в `greet`, `onEnter` достал имя, view отрисовал ответ.

## Демо без токена

В репозитории есть сценарий записи на приём, который работает в консоли:

```bash
bun install
bun run demo
```

Он проходит старт → услуга → имя → телефон → подтверждение → готово и печатает сессию. Telegram-токен не нужен.

## Структура проекта

```text
my-bot/
├── index.ts
├── package.json
└── tsconfig.json
```

Для большого бота:

```text
src/
├── bot.ts              router, middleware, flows
├── flows/
│   ├── appointment.ts
│   └── support.ts
├── views/
│   ├── appointment.ts
│   └── common.ts
└── commands/
    ├── booking.ts
    └── profile.ts
```

## Дальше

- [Flow и состояния](./concepts/flows.md)
- [Views](./concepts/views.md)
- [Commands и Queries](./concepts/commands.md)
