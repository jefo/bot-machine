import type { AppContext } from "../src/types";
import { FlowController } from "../src/flow";
import { appointmentFlow } from "./appointment";

type Sent = { text: string; extra?: any };

const sent: Sent[] = [];

const logger = {
	info() {},
	warn() {},
	debug() {},
	trace() {},
	fatal() {},
	error: console.error,
	child() {
		return logger;
	},
} as any;

function createContext(update: any): AppContext {
	return {
		update,
		client: {} as any,
		router: {} as any,
		logger,
		from: update.message?.from ?? update.callback_query?.from,
		chat: update.message?.chat ?? update.callback_query?.message?.chat,
		session: {},
		state: {},
		params: {},
		async reply(text: string, extra?: any) {
			sent.push({ text, extra });
			return {} as any;
		},
		async editMessageText(text: string, extra?: any) {
			sent.push({ text, extra });
			return true;
		},
		async deleteMessage() {
			return true;
		},
		async answerCallbackQuery() {
			return true;
		},
		async enterFlow() {},
	};
}

function printLast(userAction: string): void {
	console.log(`\nВы: ${userAction}`);
	const message = sent.at(-1);
	if (!message) return;
	console.log("\nБот:");
	for (const line of String(message.text).split("\n")) console.log(`  ${line}`);
	const rows = message.extra?.reply_markup?.inline_keyboard ?? [];
	if (rows.length > 0) {
		console.log(`  ${rows.flat().map((button: any) => `[ ${button.text} ]`).join(" ")}`);
	}
}

const ctx = createContext({
	message: { text: "/start", chat: { id: 1 }, from: { id: 1 } },
});
ctx.session.flowName = appointmentFlow.name;
ctx.session.flowState = "index";

const flow = new FlowController(appointmentFlow.config, appointmentFlow.name);

await flow.handle(ctx);
printLast("/start");

for (const step of [
	{ action: "Записаться", data: "book" },
	{ action: "Консультация", data: "service_consult" },
	{ action: "Иван", text: "Иван" },
	{ action: "+7 999 123-45-67", text: "+7 999 123-45-67" },
	{ action: "Подтвердить", data: "confirm" },
]) {
	(ctx as any).update = step.data
		? {
				callback_query: {
					data: step.data,
					message: { message_id: 1, chat: { id: 1 } },
				},
			}
		: {
				message: {
					text: step.text,
					chat: { id: 1 },
					from: { id: 1 },
				},
			};

	await flow.handle(ctx);
	printLast(step.action);
}

console.log("\nsession:", JSON.stringify(ctx.session));
