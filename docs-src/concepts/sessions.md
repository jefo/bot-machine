# Sessions

Сессия хранит данные пользователя между сообщениями: состояние flow, имя, телефон, выбранные услуги.

## Подключение

```ts
import { Router, session } from "@bot-machine/telegram-sdk";

const router = new Router();
router.use(session());
```

Без `session()` flow не сможет запомнить, на каком состоянии остановился пользователь.

## Использование

```ts
ctx.session.name = "Иван";
ctx.session.phone = "+7 999 123-45-67";
ctx.session.flowName;  // "appointment"
ctx.session.flowState; // "phone"
```

Ключ сессии — `ctx.from.id`, то есть Telegram user id.

## In-memory

По умолчанию используется `Map`:

- данные живут, пока живёт процесс;
- при перезапуске всё теряется;
- подходит для прототипа и тестов;
- не подходит для нескольких инстансов.

## Redis

Для production используйте `RedisSessionStore`.

```ts
import { createClient } from "redis";
import { Router, session } from "@bot-machine/telegram-sdk";
import { RedisSessionStore } from "@bot-machine/telegram-sdk";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const router = new Router();
router.use(session({ store: new RedisSessionStore(redis) }));
```

Ключи хранятся с префиксом `session:`:

```text
session:123456789 -> {"flowName":"appointment","flowState":"phone","name":"Иван"}
```

Префикс можно изменить:

```ts
new RedisSessionStore(redis, { prefix: "bot:session" })
```

## Что хранить

- идентификаторы, состояния, выбранные опции;
- небольшие строки и числа;
- данные, которые можно сериализовать в JSON.

Не храните:

- огромные объекты и бинарные данные;
- клиенты БД и функции;
- секреты, которые не должны попасть в Redis.

## Очистка

Flow очищает `flowName` и `flowState`, когда выходит. Остальные поля остаются, пока вы их не удалите:

```ts
delete ctx.session.name;
```

Middleware удаляет пустую сессию автоматически.

## Тесты

В тестах можно передать свой store или работать с `ctx.session` напрямую:

```ts
const store = new Map();
const middleware = session({
  store: {
    get: async (key) => store.get(key),
    set: async (key, value) => { store.set(key, value); },
    delete: async (key) => { store.delete(key); }
  }
});
```

## Ограничения

- Нет TTL по умолчанию: старые сессии живут, пока их не удалить.
- Нет блокировок: два одновременных update могут перезаписать сессию.
- Нет миграций: при изменении структуры старые сессии нужно обрабатывать вручную.
