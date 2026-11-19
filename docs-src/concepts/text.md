# Text

`format` собирает HTML-сообщение из фрагментов и сам экранирует пользовательский текст. Не нужно вручную склеивать строки с `<b>`.

## Базовый пример

```ts
import { format } from "@bot-machine/telegram-sdk";

const message = format(({ b, i, c, n }) => [
  b("Запись подтверждена"), n(2),
  "Услуга: ", c("Консультация"), n(),
  i("Позвоним за час до приёма.")
]);

await ctx.reply(message.text, { parse_mode: message.parseMode });
```

`format` возвращает `FormattedText`:

```ts
class FormattedText {
  text: string;
  parseMode: "HTML" | undefined;
}
```

Если в тексте нет форматирования, `parseMode` будет `undefined`.

## Инструменты

| Инструмент | Результат |
| --- | --- |
| `b(x)` | жирный |
| `i(x)` | курсив |
| `u(x)` | подчёркнутый |
| `s(x)` | зачёркнутый |
| `sp(x)` | спойлер |
| `c(x)` | код |
| `l(text, url)` | ссылка |
| `p(x)` | экранированный текст |
| `n(count?)` | перенос строки |
| `bullet`, `check`, `cross`, `warning`, `rocket` | символы |

## Символы

```ts
const message = format(({ check, b, n }) => [
  check, " ", b("Готово"), n(),
  "Заявка у менеджера."
]);
```

Доступны: `bullet`, `dot`, `star`, `arrow`, `arrowRight`, `arrowLeft`, `arrowUp`, `arrowDown`, `check`, `cross`, `checkboxOn`, `checkboxOff`, `warning`, `info`, `question`, `lightbulb`, `gem`, `rocket`, `party`, `money`, `gift`, `hr`.

## Экранирование

Пользовательские строки экранируются автоматически:

```ts
const name = "<Иван & Co>";
const message = format(({ b }) => [b(name)]);
// <b>&lt;Иван &amp; Co&gt;</b>
```

Не вставляйте HTML вручную в `text`, если он пришёл от пользователя.

## Когда не использовать

Для простого текста без форматирования достаточно строки:

```ts
await ctx.reply("Готово");
```

`format` нужен, когда есть жирный текст, ссылки, код или несколько абзацев.

## UI-kit

Готовые сообщения:

```ts
import { WelcomeMessage, SuccessMessage, InfoPanel } from "@bot-machine/telegram-sdk";

const welcome = WelcomeMessage({ title: "Добро пожаловать", subtitle: "Начнём" });
await ctx.reply(welcome.text, { parse_mode: welcome.parseMode });
```

## Дальше

- [Views](./views.md)
- [Keyboard](./keyboard.md)
