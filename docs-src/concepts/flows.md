# Flow и состояния

Flow — это конечный автомат. У него есть состояния, экран для каждого состояния и переходы по событиям.

## Определение

```ts
import { createFlow } from "@bot-machine/telegram-sdk";

export const flow = createFlow("appointment", {
  index: {
    component: async () => ({ text: "Запись на приём" })
  },
  service: {
    component: async () => ({ text: "Выберите услугу" })
  }
});
```

`createFlow` возвращает:

```ts
{
  name: "appointment",
  config: { index: {...}, service: {...} },
  states: { index: "index", service: "service" }
}
```

`states` нужен для type-safe переходов:

```ts
nextState: flow.states.service
```

Внутри самого объекта `flow` на него ссылаться нельзя — используйте строку.

## Состояние

```ts
interface FlowState {
  component: (props: any) => Promise<MessagePayload>;
  onEnter?: BotQuery;
  onAction?: Record<string, ActionHandler>;
  onText?: Record<string, ActionHandler>;
}
```

- `component` — что показать.
- `onEnter` — что загрузить перед показом.
- `onAction` — реакция на callback-кнопки.
- `onText` — реакция на текстовые сообщения.

Состояние `index` — стартовое. В него попадает пользователь после `ctx.enterFlow(flow.name)`.

## Переход

```ts
{
  component: async () => ({ text: "Что дальше?" }),
  onAction: {
    next: {
      command: someCommand,
      nextState: "result"
    }
  }
}
```

`nextState` может быть:

- строкой — именем следующего состояния;
- функцией от результата команды;
- не указан — flow завершится, сессия очистится;
- `refresh: true` вместо `nextState` — перерисовать текущее состояние.

```ts
nextState: (result) => (result.ok ? "done" : "error")
```

## Вход и выход

`ctx.enterFlow("appointment")`:

- записывает `flowName` и `flowState = "index"` в сессию;
- сразу вызывает роутер, чтобы отрисовать стартовый экран.

Выход происходит, когда у действия нет `nextState`. Сессия очищается от `flowName` и `flowState`.

## Пример: счётчик

```ts
const increment = createCommand({
  name: "increment",
  input: z.object({}),
  execute: async (_, ctx) => {
    ctx.session.count = (ctx.session.count ?? 0) + 1;
  }
});

const flow = createFlow("counter", {
  index: {
    onEnter: createQuery({
      name: "getCount",
      execute: async (_, ctx) => ({ count: ctx.session.count ?? 0 })
    }),
    component: async ({ count }: { count: number }) => ({
      text: `Счётчик: ${count}`,
      reply_markup: new Keyboard()
        .text("+1", "increment")
        .text("Сброс", "reset")
        .inline()
    }),
    onAction: {
      increment: { command: increment, refresh: true },
      reset: {
        command: createCommand({
          name: "reset",
          input: z.object({}),
          execute: async (_, ctx) => {
            ctx.session.count = 0;
          }
        }),
        refresh: true
      }
    }
  }
});
```

`refresh: true` важен: без него flow завершится, потому что `nextState` не задан.

## Паттерны

Ключи `onAction` и `onText` — строки или RegExp.

- `"confirm"` — точное совпадение callback data.
- `"service::id"` — параметр `id` попадёт в `ctx.params.id`.
- `":name"` — весь текст попадёт в `ctx.params.name`.
- `/^item_\d+$/` — регулярное выражение.

Параметры и текст передаются в команду как вход:

```ts
command: createCommand({
  name: "saveName",
  input: z.object({ name: z.string() }),
  execute: async ({ name }, ctx) => {
    ctx.session.name = name;
  }
})
```

## onEnter и props

`onEnter` выполняется перед `component`:

```ts
onEnter: createQuery({
  name: "getBooking",
  execute: async (_, ctx) => ({
    service: ctx.session.service,
    phone: ctx.session.phone
  })
}),
component: async (props: { service: string; phone: string }) => ({
  text: `Услуга: ${props.service}\nТелефон: ${props.phone}`
})
```

Результат предыдущей команды также передаётся в `onEnter` как вход. Это позволяет строить экран подтверждения из результата действия.

## Ошибки

Если команда или запрос бросили ошибку, `FlowController`:

- логирует её;
- отправляет пользователю «Произошла ошибка. Попробуйте еще раз.»;
- оставляет состояние прежним.

Это базовое поведение. Для своих сообщений используйте [обработку ошибок](../guides/errors.md).
