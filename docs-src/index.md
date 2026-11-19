# Bot Machine

**Low-code фреймворк для Telegram-ботов: flow, view, command.**

Bot Machine — это слой между Telegram API и бизнес-логикой. Бот описывается как конечный автомат: состояния, переходы, экраны и действия. Роутер, сессии, callback-кнопки и текстовый ввод уже внутри.

```ts
export const flow = createFlow("appointment", {
  index: {
    component: async () => ({
      text: "Запись на приём",
      reply_markup: new Keyboard()
        .text("Записаться", "book")
        .text("Не сейчас", "cancel")
        .inline()
    }),
    onAction: {
      book: {
        command: createCommand({
          name: "startBooking",
          input: z.object({}),
          execute: async () => {}
        }),
        nextState: "service"
      }
    }
  },
  service: {
    component: async () => ({
      text: "Выберите услугу:",
      reply_markup: new Keyboard()
        .text("Консультация", "consult")
        .inline()
    }),
    onAction: {
      consult: {
        command: createCommand({
          name: "selectConsult",
          input: z.object({}),
          execute: async (_, ctx) => {
            ctx.session.service = "Консультация";
          }
        }),
        nextState: "name"
      }
    }
  }
});
```

## Зачем это нужно

Обычный Telegram-бот быстро превращается в набор обработчиков:

```text
if (state === "name") ...
else if (state === "phone") ...
else if (callback === "confirm") ...
```

Чем больше шагов, тем сложнее понять, где находится пользователь и что произойдёт после нажатия. Bot Machine заменяет это одним объектом flow:

- состояние видно в структуре;
- переход — это данные, а не ветка `if`;
- экран отделён от бизнес-действия;
- сессия и роутинг не пишутся заново в каждом боте.

## Три части

| Часть | Что это | Пример |
| --- | --- | --- |
| Flow | состояния и переходы | `createFlow("appointment", {...})` |
| View | функция, которая возвращает текст и кнопки | `component: async (props) => ({ text })` |
| Command | бизнес-действие с Zod-схемой | `createCommand({ input, execute })` |

## Что уже есть

- **108 тестов** и 185 assertions.
- Роутер в стиле Express: команды, callback, текст, middleware, fallback.
- Сессии: in-memory и Redis.
- `Keyboard` для inline и reply-клавиатур.
- HTML-форматирование без ручной сборки строк.
- UI-kit с базовыми и e-commerce компонентами.
- Логирование через pino.
- Рабочее демо записи на приём без Telegram-токена.

## Для кого

- Для разработчиков, которые делают ботов с многошаговыми сценариями.
- Для AI-агентов: у flow, view и command явные границы, поэтому код проще генерировать и менять.
- Для заказчиков, которым важно получить читаемый сценарий, а не набор обработчиков.

## Статус

Документация описывает снимок `jefo/bot-machine`: стабильную **0.1.11** плюс портфолио-правки — экспорт Redis/UI-kit, валидация `output`, необязательный logger. Оригинальный npm-пакет 0.1.11 — та же архитектура. Более новая 0.2.0 находится в разработке и меняет API; здесь её нет.

Оригинальный репозиторий: [kaizin-lab/bot-machine](https://github.com/kaizin-lab/bot-machine)  
npm: [`@bot-machine/telegram-sdk`](https://www.npmjs.com/package/@bot-machine/telegram-sdk)

<div class="note">
<strong>Про persona.</strong> В Bot Machine нет персоны как обязательной сущности. Здесь только FSM, экраны, команды и роутер. Персона — отдельная экспериментальная абстракция для омниканальности; на FSM-движок она не влияет.
</div>

## Дальше

- [Быстрый старт](./getting-started.md) — собрать первого бота.
- [Flow и состояния](./concepts/flows.md) — как устроен сценарий.
- [Справочник API](./api/reference.md) — все экспорты и сигнатуры.
