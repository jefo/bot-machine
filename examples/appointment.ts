import { z } from "zod";
import { createFlow } from "../src/flow";
import { createCommand, createQuery } from "../src/core";
import { Keyboard } from "../src/keyboard";

/**
 * A small appointment flow that uses every core part of the framework:
 * a state machine, callback actions, text input, an onEnter query and
 * React-like views. No Telegram token is needed to run the demo.
 */
export const appointmentFlow = createFlow("appointment", {
	index: {
		component: async () => ({
			text: "Запись на приём\n\nВыберите услугу или отмените запись.",
			reply_markup: new Keyboard()
				.text("Записаться", "book")
				.text("Не сейчас", "cancel")
				.inline(),
		}),
		onAction: {
			book: {
				command: createCommand({
					name: "startBooking",
					input: z.object({}),
					execute: async () => {},
				}),
				nextState: "service",
			},
			cancel: {
				command: createCommand({
					name: "cancelBooking",
					input: z.object({}),
					execute: async () => {},
				}),
				nextState: undefined,
			},
		},
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
				.inline(),
		}),
		onAction: {
			service_consult: {
				command: createCommand({
					name: "selectConsult",
					input: z.object({}),
					execute: async (_, ctx) => {
						ctx.session.service = "Консультация";
					},
				}),
				nextState: "name",
			},
			service_diag: {
				command: createCommand({
					name: "selectDiag",
					input: z.object({}),
					execute: async (_, ctx) => {
						ctx.session.service = "Диагностика";
					},
				}),
				nextState: "name",
			},
			service_treat: {
				command: createCommand({
					name: "selectTreat",
					input: z.object({}),
					execute: async (_, ctx) => {
						ctx.session.service = "Лечение";
					},
				}),
				nextState: "name",
			},
		},
	},

	name: {
		component: async () => ({
			text: "Шаг 2 из 3. Как вас зовут?\n\nНапишите имя одним сообщением.",
		}),
		onText: {
			":name": {
				command: createCommand({
					name: "saveName",
					input: z.object({ name: z.string().min(1) }),
					execute: async ({ name }, ctx) => {
						ctx.session.name = name;
					},
				}),
				nextState: "phone",
			},
		},
	},

	phone: {
		component: async () => ({
			text: "Шаг 3 из 3. Телефон для связи?\n\nНапишите номер одним сообщением.",
		}),
		onText: {
			":phone": {
				command: createCommand({
					name: "savePhone",
					input: z.object({ phone: z.string().min(5) }),
					execute: async ({ phone }, ctx) => {
						ctx.session.phone = phone;
					},
				}),
				nextState: "confirm",
			},
		},
	},

	confirm: {
		onEnter: createQuery({
			name: "bookingSummary",
			execute: async (_, ctx) => ({
				service: ctx.session.service as string,
				name: ctx.session.name as string,
				phone: ctx.session.phone as string,
			}),
		}),
		component: async (props: { service: string; name: string; phone: string }) => ({
			text: `Проверьте запись.\n\nУслуга: ${props.service}\nИмя: ${props.name}\nТелефон: ${props.phone}`,
			reply_markup: new Keyboard()
				.text("Подтвердить", "confirm")
				.row()
				.text("Отменить", "cancel")
				.inline(),
		}),
		onAction: {
			confirm: {
				command: createCommand({
					name: "confirmBooking",
					input: z.object({}),
					execute: async () => {},
				}),
				nextState: "done",
			},
			cancel: {
				command: createCommand({
					name: "cancelBooking",
					input: z.object({}),
					execute: async () => {},
				}),
				nextState: undefined,
			},
		},
	},

	done: {
		onEnter: createQuery({
			name: "bookingReceipt",
			execute: async (_, ctx) => ({
				service: ctx.session.service as string,
				name: ctx.session.name as string,
				phone: ctx.session.phone as string,
			}),
		}),
		component: async (props: { service: string; name: string; phone: string }) => ({
			text: `Готово.\n\n${props.name}, вы записаны на «${props.service}».\nПозвоним на ${props.phone}.`,
		}),
	},
});
