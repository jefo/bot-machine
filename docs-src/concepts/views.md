# Views

View — это функция, которая получает данные и возвращает сообщение для Telegram. Логика и представление разделены: команда меняет состояние, view показывает результат.

## Сигнатура

```ts
type Component = (props: any) => Promise<MessagePayload>;
```

`MessagePayload`:

```ts
interface MessagePayload {
  text: string;
  parse_mode?: "HTML" | "MarkdownV2";
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
}
```

## Пример

```ts
import { Keyboard, format } from "@bot-machine/telegram-sdk";

interface BookingProps {
  service: string;
  name: string;
  phone: string;
}

export async function BookingSummary(props: BookingProps) {
  const text = format(({ b, n }) => [
    b("Проверьте запись"), n(2),
    "Услуга: ", props.service, n(),
    "Имя: ", props.name, n(),
    "Телефон: ", props.phone
  ]);

  return {
    text: text.text,
    parse_mode: text.parseMode,
    reply_markup: new Keyboard()
      .text("Подтвердить", "confirm")
      .text("Отменить", "cancel")
      .inline()
  };
}
```

```ts
const flow = createFlow("appointment", {
  confirm: {
    onEnter: createQuery({
      name: "summary",
      execute: async (_, ctx) => ({
        service: ctx.session.service as string,
        name: ctx.session.name as string,
        phone: ctx.session.phone as string
      })
    }),
    component: BookingSummary,
    onAction: {
      confirm: { command: confirmCommand, nextState: "done" },
      cancel: { command: cancelCommand }
    }
  }
});
```

## Правила

- View не ходит в базу и не вызывает API. Данные приходят из `onEnter`.
- View не меняет сессию. Это работа команды.
- View возвращает только `MessagePayload`.
- Кнопки собираются через `Keyboard`, текст — через `format` или обычную строку.
- Если view нужны разные данные для разных состояний, делайте отдельные view, а не ветки внутри одного.

## Почему это удобно

- View можно тестировать отдельно: передать props и проверить payload.
- Один и тот же view можно использовать в нескольких состояниях.
- AI-агенту проще менять экран, не задевая бизнес-логику.
- `MessagePayload` — единственный контракт с Telegram.

## Когда не нужен отдельный файл

Для маленького бота view можно оставить inline:

```ts
component: async () => ({
  text: "Готово",
  reply_markup: new Keyboard().text("Заново", "restart").inline()
})
```

Если экран используется больше одного раза или содержит больше 10 строк, выносите в функцию.

## Дальше

- [Keyboard](./keyboard.md) — кнопки.
- [Text](./text.md) — форматирование.
