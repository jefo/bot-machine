# Архитектура

Bot Machine — тонкий слой между Telegram и бизнес-логикой. Он не пытается быть Bot API-клиентом: за транспорт отвечает `@bot-machine/telegram-client`.

## Поток update

```text
Telegram update
      │
      ▼
TelegramClient.startPolling
      │
      ▼
Router.handle(update, client)
      │
      ├─ создаёт BotContext
      ├─ запускает middleware
      │
      ▼
session()  ── загружает session по user id
      │
      ▼
Router.route(ctx)
      │
      ├─ активный flow? ──► FlowController.handle
      │                         ├─ onAction / onText
      │                         ├─ Command (Zod input/output)
      │                         ├─ nextState / refresh
      │                         ├─ onEnter Query
      │                         └─ Component → MessagePayload
      │
      ├─ onCommand / onText / onCallbackQuery
      │
      └─ fallback
      │
      ▼
ctx.reply / ctx.editMessageText
      │
      ▼
Telegram Bot API
```

## Слои

| Слой | Файлы | Ответственность |
| --- | --- | --- |
| Транспорт | `@bot-machine/telegram-client` | HTTP к Bot API, polling |
| Маршрутизация | `router.ts` | middleware, routes, flows |
| Контекст | `context.ts` | update, reply, edit, session, enterFlow |
| Flow | `flow.ts` | состояния, переходы, onEnter, render |
| Бизнес-логика | `core.ts` | createCommand / createQuery, Zod |
| Состояние | `session.ts` | in-memory и Redis |
| Представление | `keyboard.ts`, `text.ts`, `ui-kit/` | payload, кнопки, форматирование |

## Решения

### Flow как данные

Состояния — это объект. Новый экран не требует нового класса или ветки в роутере. Сценарий можно прочитать целиком.

### Schema-first

Вход и выход команд описаны Zod. AI-агенту и человеку не нужно угадывать форму данных. Ошибка ловится до бизнес-логики.

### View отделён от логики

Команда меняет состояние, view показывает результат. Это упрощает тесты и замену экрана.

### Express-подобный роутер

`router.onCommand`, `onText`, `onCallbackQuery`, `use`, `fallback` знакомы по веб-фреймворкам. Кривая входа низкая.

### AI-first

Фреймворк проектировался под AI-агентов: явные границы, типы, предсказуемые переходы. Это не значит, что внутри есть LLM. Это значит, что код проще генерировать и проверять.

## Persona

В Bot Machine нет персоны как обязательной сущности. Участник диалога — это Telegram user id и сессия. Персона — отдельная экспериментальная абстракция для омниканальности; FSM-движок от неё не зависит.

## Компромиссы

- Больше структуры, чем в «одном файле с обработчиками».
- Нужны TypeScript и Zod.
- Flow описан кодом, а не визуально.
- Telegram-контекст зашит в `BotContext`; другие каналы потребуют адаптер.
