import { describe, expect, it } from "bun:test";
import type { AppContext } from "../src/types";
import { FlowController } from "../src/flow";
import { appointmentFlow } from "./appointment";

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

function createContext(): AppContext {
	const sent: string[] = [];
	const ctx = {
		update: { message: { text: "/start", chat: { id: 1 }, from: { id: 1 } } },
		client: {} as any,
		router: {} as any,
		logger,
		from: { id: 1 },
		chat: { id: 1 },
		session: { flowName: "appointment", flowState: "index" },
		state: {},
		params: {},
		async reply(text: string) {
			sent.push(text);
			return {} as any;
		},
		async editMessageText(text: string) {
			sent.push(text);
			return true;
		},
		async deleteMessage() {
			return true;
		},
		async answerCallbackQuery() {
			return true;
		},
		async enterFlow() {},
	} as unknown as AppContext;
	return Object.assign(ctx, { sent });
}

const flow = new FlowController(appointmentFlow.config, appointmentFlow.name);

async function act(ctx: AppContext, update: any): Promise<string> {
	(ctx as any).update = update;
	await flow.handle(ctx);
	return (ctx as any).sent.at(-1) as string;
}

describe("appointment flow", () => {
	it("collects a service, a name and a phone", async () => {
		const ctx = createContext();

		expect(await act(ctx, { message: { text: "/start" } })).toContain(
			"Запись на приём",
		);
		expect(
			await act(ctx, { callback_query: { data: "book", message: { message_id: 1 } } }),
		).toContain("Выберите услугу");
		expect(
			await act(ctx, {
				callback_query: { data: "service_consult", message: { message_id: 1 } },
			}),
		).toContain("Как вас зовут");
		expect(await act(ctx, { message: { text: "Иван" } })).toContain(
			"Телефон для связи",
		);
		expect(await act(ctx, { message: { text: "+7 999 123-45-67" } })).toContain(
			"Проверьте запись",
		);
		expect(
			await act(ctx, { callback_query: { data: "confirm", message: { message_id: 1 } } }),
		).toContain("вы записаны");

		expect(ctx.session).toMatchObject({
			service: "Консультация",
			name: "Иван",
			phone: "+7 999 123-45-67",
			flowState: "done",
		});
	});

	it("re-renders the current screen on an unknown action", async () => {
		const ctx = createContext();
		await act(ctx, { callback_query: { data: "book", message: { message_id: 1 } } });
		const text = await act(ctx, {
			callback_query: { data: "unknown", message: { message_id: 1 } },
		});
		expect(text).toContain("Выберите услугу");
		expect(ctx.session.flowState).toBe("service");
	});
});
