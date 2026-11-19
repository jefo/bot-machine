# Форма записи

Полный сценарий: старт → услуга → имя → телефон → подтверждение → готово. Он есть в `examples/appointment.ts` и запускается без Telegram.

## Состояния

| Состояние | Что показывает | Что собирает |
| --- | --- | --- |
| `index` | старт, «Записаться» / «Не сейчас» | — |
| `service` | выбор услуги | `service` |
| `name` | вопрос об имени | `name` |
| `phone` | вопрос о телефоне | `phone` |
| `confirm` | сводка и кнопки | — |
| `done` | подтверждение | — |

## Flow

```ts
import { z } from "zod";
import {
  createFlow,
  createCommand,
  createQuery,
  Keyboard
} from "@bot-machine/telegram-sdk";

export const appointmentFlow = createFlow("appointment", {
  index: {
    component: async () => ({
      text: "Запись на приём\n\nВыберите услугу или отмените запись.",
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
      },
      cancel: {
        command: createCommand({
          name: "cancel",
          input: z.object({}),
          execute: async () => {}
        })
        // nextState не указан — flow завершится
      }
    }
  },

  service: {
    component: async () => ({
      text: "Шаг 1 из 3. Выберите услугу:",
      reply_markup: new Keyboard()
        .text("Консультация", "service_consult")
        .row()
        .text("Диагностика", "service_diag")
        .row()
        .text("Лечение", "service_treat")
        .inline()
    }),
    onAction: {
      service_consult: {
        command: createCommand({
          name: "selectConsult",
          input: z.object({}),
          execute: async (_, ctx) => {
            ctx.session.service = "Консультация";
          }
        }),
        nextState: "name"
      }
      // ...
    }
  },

  name: {
    component: async () => ({
      text: "Шаг 2 из 3. Как вас зовут?\n\nНапишите имя одним сообщением."
    }),
    onText: {
      ":name": {
        command: createCommand({
          name: "saveName",
          input: z.object({ name: z.string().min(1) }),
          execute: async ({ name }, ctx) => {
            ctx.session.name = name;
          }
        }),
        nextState: "phone"
      }
    }
  },

  phone: {
    component: async () => ({
      text: "Шаг 3 из 3. Телефон для связи?\n\nНапишите номер одним сообщением."
    }),
    onText: {
      ":phone": {
        command: createCommand({
          name: "savePhone",
          input: z.object({ phone: z.string().min(5) }),
          execute: async ({ phone }, ctx) => {
            ctx.session.phone = phone;
          }
        }),
        nextState: "confirm"
      }
    }
  },

  confirm: {
    onEnter: createQuery({
      name: "bookingSummary",
      execute: async (_, ctx) => ({
        service: ctx.session.service as string,
        name: ctx.session.name as string,
        phone: ctx.session.phone as string
      })
    }),
    component: async (props: {
      service: string;
      name: string;
      phone: string;
    }) => ({
      text: `Проверьте запись.\n\nУслуга: ${props.service}\nИмя: ${props.name}\nТелефон: ${props.phone}`,
      reply_markup: new Keyboard()
        .text("Подтвердить", "confirm")
        .row()
        .text("Отменить", "cancel")
        .inline()
    }),
    onAction: {
      confirm: {
        command: createCommand({
          name: "confirmBooking",
          input: z.object({}),
          execute: async () => {}
        }),
        nextState: "done"
      },
      cancel: {
        command: createCommand({
          name: "cancelBooking",
          input: z.object({}),
          execute: async () => {}
        })
      }
    }
  },

  done: {
    onEnter: createQuery({
      name: "bookingReceipt",
      execute: async (_, ctx) => ({
        service: ctx.session.service as string,
        name: ctx.session.name as string,
        phone: ctx.session.phone as string
      })
    }),
    component: async (props: {
      service: string;
      name: string;
      phone: string;
    }) => ({
      text: `Готово.\n\n${props.name}, вы записаны на «${props.service}».\nПозвоним на ${props.phone}.`
    })
  }
});
```

## Подключение

```ts
import { Router, FlowController, session } from "@bot-machine/telegram-sdk";

const router = new Router();
router.use(session());
router.addFlow(new FlowController(appointmentFlow.config, appointmentFlow.name));

router.onCommand("start", async (ctx) => {
  await ctx.enterFlow(appointmentFlow.name);
});
```

## Демо

```bash
bun run demo
```

Вывод:

```text
Вы: /start
Бот: Запись на приём
     [ Записаться ] [ Не сейчас ]

Вы: Записаться
Бот: Шаг 1 из 3. Выберите услугу:
     [ Консультация ] [ Диагностика ] [ Лечение ]

...

Бот: Готово.
     Иван, вы записаны на «Консультация».
     Позвоним на +7 999 123-45-67.
```

## Что добавить

- проверку телефона через `z.string().regex(...)`;
- кнопку «Назад» на каждом шаге;
- запись в БД в `confirmBooking`;
- уведомление менеджеру после `done`;
- отмену и очистку сессии.

## Тест

Сценарий проверяется без Telegram: создайте фейковый `AppContext`, установите `flowName`/`flowState` и вызывайте `FlowController.handle`. Пример — в `examples/appointment.test.ts`.
