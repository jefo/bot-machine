# Context

`AppContext` (`ctx`) — всё, что нужно для обработки одного update: Telegram-клиент, сессия, параметры и методы ответа.

Новый контекст создаётся на каждый update и передаётся в middleware, обработчики, команды и запросы.

## Свойства

| Поле | Тип | Что это |
| --- | --- | --- |
| `ctx.update` | `Update` | Сырой update от Telegram |
| `ctx.client` | `TelegramClient` | Клиент Bot API |
| `ctx.logger` | `ILogger` | Логгер |
| `ctx.router` | `Router` | Роутер |
| `ctx.from` | `User \| undefined` | Автор сообщения или нажатия |
| `ctx.chat` | `Chat \| undefined` | Чат |
| `ctx.session` | `Record<string, any>` | Данные пользователя между update |
| `ctx.state` | `Record<string, any>` | Данные в рамках одного update |
| `ctx.params` | `Record<string, string>` | Параметры маршрута |

## Методы

### reply

Отправляет новое сообщение.

```ts
await ctx.reply("Привет");
await ctx.reply("<b>Жирный</b>", { parse_mode: "HTML" });
```

### editMessageText

Редактирует сообщение, на котором нажали кнопку.

```ts
await ctx.editMessageText("Новый текст");
```

Если update не содержит сообщения (например, обычный текст), метод бросит ошибку. Используйте его в `onCallbackQuery` или в flow, который обрабатывает callback.

### answerCallbackQuery

Убирает «часики» на кнопке. Вызывайте после обработки callback.

```ts
await ctx.answerCallbackQuery();
await ctx.answerCallbackQuery("Готово");
```

### deleteMessage

Удаляет сообщение, связанное с update.

```ts
await ctx.deleteMessage();
```

### enterFlow

Входит в flow и сразу рисует стартовый экран.

```ts
await ctx.enterFlow("appointment");
await ctx.enterFlow("appointment", "service");
```

По умолчанию стартовое состояние — `index`.

## Пример

```ts
router.onCallbackQuery("profile::id", async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = await getProfile(ctx.params.id);
  await ctx.editMessageText(`Имя: ${profile.name}`);
});
```

## Контекст и сессия

`ctx.session` живёт между update. `ctx.state` — только на один запрос.

```ts
ctx.state.requestStartedAt = Date.now(); // не сохранится
ctx.session.lastSeen = new Date().toISOString(); // сохранится
```

Для сессии нужен middleware `session()`. Без него `ctx.session` — пустой объект, который не сохраняется.
