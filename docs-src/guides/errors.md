# Ошибки и валидация

В Bot Machine ошибки делятся на три слоя: ввод, бизнес-логика и транспорт.

## Ввод

Zod проверяет вход команды и запроса до `execute`.

```ts
const savePhone = createCommand({
  name: "savePhone",
  input: z.object({
    phone: z.string().regex(/^\+?\d{10,15}$/, "Некорректный номер")
  }),
  execute: async ({ phone }, ctx) => {
    ctx.session.phone = phone;
  }
});
```

Если пользователь написал `abc`, команда не выполнится. `FlowController` залогирует ошибку и отправит:

```text
Произошла ошибка. Попробуйте еще раз.
```

Состояние останется прежним, и пользователь сможет ввести значение снова.

## Своё сообщение

Чтобы показать понятный текст, проверяйте значение в команде и возвращайте результат:

```ts
const savePhone = createCommand({
  name: "savePhone",
  input: z.object({ phone: z.string() }),
  output: z.object({ ok: z.boolean(), reason: z.string().optional() }),
  execute: async ({ phone }, ctx) => {
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return { ok: false, reason: "Похоже, это не номер. Попробуйте ещё раз." };
    }
    ctx.session.phone = phone;
    return { ok: true };
  }
});
```

В flow:

```ts
onText: {
  ":phone": {
    command: savePhone,
    nextState: (result) => (result.ok ? "confirm" : "phone")
  }
}
```

Чтобы показать `reason`, передайте его в `onEnter` через `ctx.session` или используйте отдельное состояние ошибки.

## Бизнес-логика

Исключение в `execute`:

- логируется;
- flow не меняет состояние;
- пользователь видит общее сообщение.

Не глотайте ошибки молча. Если ошибка ожидаемая (нет слота, нет товара), верните результат с `ok: false` и обработайте его в `nextState`.

## Транспорт

`ctx.editMessageText` может упасть, если сообщение нельзя редактировать (например, это фото или текст без callback). В stateless-обработчике проверяйте тип update или отправляйте новое сообщение.

`callback_data` длиннее 64 байт Telegram отклонит. Используйте короткие коды.

## Middleware

Логирование и централизованная обработка:

```ts
router.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.logger.error({ error }, "update failed");
    await ctx.reply("Что-то пошло не так. Попробуйте позже.");
  }
});
```

Встроенный `loggingMiddleware` пишет update, время и ошибку.

## Fallback

Если пользователь пишет что-то вне flow и маршрутов:

```ts
router.fallback(async (ctx) => {
  await ctx.reply("Не понял. Нажмите /start.");
});
```

## Чек-лист

- У каждой команды есть `input`-схема.
- Ожидаемые ошибки возвращаются как данные, а не исключения.
- Неожиданные ошибки логируются.
- Пользователь всегда видит следующий шаг.
- `callback_data` короткий.
- `answerCallbackQuery` вызывается на каждом callback.
