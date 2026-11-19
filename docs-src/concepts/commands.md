# Commands и Queries

Commands и Queries — это бизнес-логика. Они отделены от flow и view.

- **Query** — чтение. Используется в `onEnter`, чтобы получить данные для экрана.
- **Command** — запись. Используется в `onAction` и `onText`, чтобы изменить состояние.

Оба создаются через фабрики с Zod-схемами.

## createQuery

```ts
import { createQuery } from "@bot-machine/telegram-sdk";
import { z } from "zod";

export const getBookingQuery = createQuery({
  name: "getBooking",
  input: z.object({ bookingId: z.string() }),
  output: z.object({
    service: z.string(),
    phone: z.string()
  }),
  execute: async ({ bookingId }, ctx) => {
    const booking = await db.bookings.find(bookingId);
    return {
      service: booking.service,
      phone: booking.phone
    };
  }
});
```

- `input` проверяется до вызова `execute`.
- `output` проверяется после; если результат не совпал, ошибка уйдёт в flow.
- `input` можно не указывать — тогда используется `z.void()`.
- `output` можно не указывать — тогда результат не валидируется.

## createCommand

```ts
import { createCommand } from "@bot-machine/telegram-sdk";
import { z } from "zod";

export const saveNameCommand = createCommand({
  name: "saveName",
  input: z.object({ name: z.string().min(1) }),
  output: z.object({ saved: z.boolean() }),
  execute: async ({ name }, ctx) => {
    ctx.session.name = name;
    return { saved: true };
  }
});
```

Команда получает уже провалидированный вход и контекст. Возвращает результат, который может использовать `nextState`:

```ts
{
  command: saveNameCommand,
  nextState: (result) => (result.saved ? "phone" : "name")
}
```

## Откуда берётся input

`FlowController` собирает вход из:

- `ctx.params` — параметры паттерна (`:name`, `item::id`);
- `ctx.update.message.text` — текст сообщения как `text`.

Пример:

```ts
onText: {
  ":name": {
    command: createCommand({
      name: "saveName",
      input: z.object({ name: z.string() }),
      execute: async ({ name }, ctx) => {
        ctx.session.name = name;
      }
    }),
    nextState: "phone"
  }
}
```

Пользователь пишет `Иван` → `ctx.params.name = "Иван"` → команда получает `{ name: "Иван", text: "Иван" }`.

## Команда без входа

Для действий без данных используйте `z.object({})`:

```ts
const confirmCommand = createCommand({
  name: "confirm",
  input: z.object({}),
  execute: async () => {}
});
```

`z.void()` подходит для query без входа, но для callback-действий лучше `z.object({})`: flow передаёт объект параметров, и `z.void()` его не примет.

## Ошибки

Zod-ошибка или исключение в `execute`:

- логируется;
- flow показывает «Произошла ошибка. Попробуйте еще раз.»;
- состояние не меняется.

Если нужна своя реакция, обрабатывайте ошибку внутри команды или используйте middleware. Подробнее — [Ошибки и валидация](../guides/errors.md).

## Чистота

- Command меняет состояние и возвращает результат.
- Query только читает.
- Не вызывайте `ctx.reply` из команды: ответом занимается view.
- Не храните в сессии огромные объекты: сессия сериализуется в Redis.

## Тесты

Команду можно тестировать без Telegram:

```ts
const ctx = { session: {}, logger: console } as any;
const result = await saveNameCommand.execute({ name: "Иван" }, ctx);
expect(ctx.session.name).toBe("Иван");
```

Полный пример — [Тесты](../guides/testing.md).
