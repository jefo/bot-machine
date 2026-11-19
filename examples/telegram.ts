import { TelegramClient } from "@bot-machine/telegram-client";
import { FlowController } from "../src/flow";
import { Router } from "../src/router";
import { session } from "../src/session";
import { createLogger } from "../src/logger";
import { appointmentFlow } from "./appointment";

const token = process.env.BOT_TOKEN;
if (!token) {
	console.error("BOT_TOKEN is not set.");
	process.exit(1);
}

const logger = createLogger();
const router = new Router({ logger });

router.use(session());
router.onCommand("start", async (ctx) => {
	await ctx.reply("Запись на приём");
	await ctx.enterFlow(appointmentFlow.name);
});
router.addFlow(
	new FlowController(appointmentFlow.config, appointmentFlow.name),
);

const client = new TelegramClient(token);
console.log("Bot Machine appointment bot is running.");
await client.startPolling((update) => router.handle(update, client));
