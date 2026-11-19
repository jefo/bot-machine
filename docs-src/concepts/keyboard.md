# Keyboard

`Keyboard` — fluent-билдер для inline и reply-клавиатур. Он избавляет от ручной сборки `inline_keyboard`.

## Inline

```ts
import { Keyboard } from "@bot-machine/telegram-sdk";

const keyboard = new Keyboard()
  .text("Консультация", "consult")
  .text("Диагностика", "diagnostics")
  .row()
  .text("Назад", "back");

const payload = {
  text: "Выберите услугу",
  reply_markup: keyboard.inline()
};
```

`inline()` возвращает:

```json
{
  "inline_keyboard": [
    [
      { "text": "Консультация", "callback_data": "consult" },
      { "text": "Диагностика", "callback_data": "diagnostics" }
    ],
    [
      { "text": "Назад", "callback_data": "back" }
    ]
  ]
}
```

## Reply

```ts
const keyboard = new Keyboard()
  .text("Отправить телефон", "phone")
  .requestContact("Мой контакт")
  .row()
  .text("Отмена", "cancel");

await ctx.reply("Выберите действие", {
  reply_markup: keyboard.reply({ resize_keyboard: true })
});
```

`reply()` возвращает `ReplyKeyboardMarkup`. Чтобы убрать клавиатуру:

```ts
await ctx.reply("Готово", { reply_markup: Keyboard.remove() });
```

## Кнопки

| Метод | Что делает |
| --- | --- |
| `.text(label, callbackData)` | callback-кнопка |
| `.url(label, url)` | ссылка |
| `.login(label, loginUrl)` | Telegram Login |
| `.switchInline(label, query)` | inline-режим |
| `.webApp(label, webAppInfo)` | Web App |
| `.pay(label)` | оплата |
| `.requestContact(label)` | запрос контакта |
| `.requestLocation(label)` | запрос геолокации |
| `.requestPoll(label, type?)` | создание опроса |
| `.row()` | начать новый ряд |

## Правила

- Не больше 8 кнопок в ряду, иначе Telegram сожмёт текст.
- `callback_data` — строка до 64 байт. Не кладите туда JSON с кириллицей.
- Для параметров используйте короткие коды: `item::42`, а не `{"id":42}`.
- В одном ряду не смешивайте inline и reply-кнопки.

## Пример с параметром

```ts
new Keyboard()
  .text("Удалить", "delete::42")
  .text("Открыть", "open::42")
```

```ts
onAction: {
  "delete::id": {
    command: deleteCommand,
    refresh: true
  }
}
```

`ctx.params.id` будет `"42"`.

## Дальше

- [Text](./text.md)
- [Callback-кнопки](../guides/callbacks.md)
