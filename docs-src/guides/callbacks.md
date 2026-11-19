# Callback-кнопки

Callback-кнопка отправляет `callback_data` вместо текста. В flow она обрабатывается через `onAction`.

## Кнопка

```ts
component: async () => ({
  text: "Подтвердить запись?",
  reply_markup: new Keyboard()
    .text("Да", "confirm")
    .text("Нет", "cancel")
    .inline()
})
```

## Обработчик

```ts
onAction: {
  confirm: {
    command: createCommand({
      name: "confirmBooking",
      input: z.object({}),
      execute: async (_, ctx) => {
        ctx.session.confirmed = true;
      }
    }),
    nextState: "done"
  },
  cancel: {
    command: createCommand({
      name: "cancelBooking",
      input: z.object({}),
      execute: async (_, ctx) => {
        ctx.session.confirmed = false;
      }
    }),
    nextState: "cancelled"
  }
}
```

## Callback вне flow

```ts
router.onCallbackQuery("help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Справка");
});
```

`ctx.answerCallbackQuery()` обязателен: он убирает индикатор загрузки на кнопке. Можно передать текст:

```ts
await ctx.answerCallbackQuery("Сохранено");
```

## Редактирование сообщения

В flow callback автоматически редактирует сообщение, на котором нажали кнопку. В stateless-обработчике вызовите `ctx.editMessageText` сами.

Если сообщение не содержит текста (например, фото), `editMessageText` не сработает. В этом случае отправьте новое сообщение.

## Параметры

```ts
new Keyboard()
  .text("Удалить", "delete::42")
  .text("Открыть", "open::42")
```

```ts
onAction: {
  "delete::id": {
    command: deleteItemCommand,
    refresh: true
  }
}
```

`ctx.params.id` будет `"42"`, команда получит его во входе.

## Ограничения Telegram

- `callback_data` — до 64 байт.
- Кириллица занимает 2 байта на символ, JSON быстро выходит за лимит.
- Используйте короткие коды: `service::consult`, а не `{"service":"Консультация"}`.
- Старые кнопки остаются в истории. Если пользователь нажмёт кнопку из старого сообщения, flow обработает её в текущем состоянии; предусмотрите это.

## Полный пример

Смотрите [форму записи](./appointment.md) — там callback-кнопки, текст и подтверждение собраны вместе.
