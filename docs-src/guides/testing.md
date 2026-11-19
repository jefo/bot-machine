# Тесты

Фреймворк не требует Telegram для тестов. Flow можно проверить с фейковым `AppContext`, а команды и запросы — напрямую.

## Запуск

```bash
bun test
bunx tsc --noEmit
```

В репозитории **108 тестов** и 185 assertions.

## Фейковый контекст

```ts
import type { AppContext } from "@bot-machine/telegram-sdk";

function createContext(session: Record<string, unknown> = {}): AppContext {
  const sent: string[] = [];

  const ctx = {
    update: { message: { text: "/start", chat: { id: 1 }, from: { id: 1 } } },
    client: {} as any,
    router: {} as any,
    logger: {
      info() {}, warn() {}, debug() {}, trace() {}, fatal() {},
      error: console.error,
      child() { return this; }
    },
    from: { id: 1 },
    chat: { id: 1 },
    session,
    state: {},
    params: {},
    async reply(text: string) { sent.push(text); return {} as any; },
    async editMessageText(text: string) { sent.push(text); return true; },
    async deleteMessage() { return true; },
    async answerCallbackQuery() { return true; },
    async enterFlow() {}
  } as unknown as AppContext;

  return Object.assign(ctx, { sent });
}
```

## Тест flow

```ts
import { describe, expect, it } from "bun:test";
import { FlowController } from "@bot-machine/telegram-sdk";
import { appointmentFlow } from "./appointment";

const flow = new FlowController(appointmentFlow.config, appointmentFlow.name);

async function act(ctx: AppContext, update: any): Promise<string> {
  (ctx as any).update = update;
  await flow.handle(ctx);
  return (ctx as any).sent.at(-1);
}

it("собирает запись", async () => {
  const ctx = createContext({
    flowName: "appointment",
    flowState: "index"
  });

  expect(await act(ctx, { message: { text: "/start" } }))
    .toContain("Запись на приём");

  expect(await act(ctx, { callback_query: { data: "book", message: { message_id: 1 } } }))
    .toContain("Выберите услугу");

  // ... имя, телефон, подтверждение

  expect(ctx.session).toMatchObject({
    service: "Консультация",
    name: "Иван",
    phone: "+7 999 123-45-67",
    flowState: "done"
  });
});
```

## Тест команды

```ts
it("сохраняет имя", async () => {
  const ctx = { session: {}, logger: console } as any;
  await saveNameCommand.execute({ name: "Иван" }, ctx);
  expect(ctx.session.name).toBe("Иван");
});
```

## Тест запроса

```ts
it("читает имя из сессии", async () => {
  const ctx = { session: { name: "Иван" }, logger: console } as any;
  const result = await getNameQuery.execute(undefined, ctx);
  expect(result).toEqual({ name: "Иван" });
});
```

## Тест роутера

```ts
const router = new Router();
const handler = mock(async (ctx) => {
  await ctx.reply("ok");
});
router.onCommand("start", handler);

const ctx = createContext();
await router.route(ctx);
expect(handler).toHaveBeenCalled();
```

## Снимки

UI-kit использует snapshot-тесты для клавиатур и сообщений. Если меняете текст или разметку, обновите снимки:

```bash
bun test --update-snapshots
```

## Что проверять

- переходы и `nextState`;
- `refresh` и выход из flow;
- параметры `:name` и `::id`;
- Zod-валидацию;
- сохранение в сессию;
- ошибки и fallback;
- клавиатуры и форматирование.

## Дальше

- [Форма записи](./appointment.md)
- [Ограничения](../limits.md)
