export interface NavItem {
	title: string;
	path: string;
}

export interface NavGroup {
	title: string;
	items: NavItem[];
}

export const nav: NavGroup[] = [
	{
		title: "Начало",
		items: [
			{ title: "Обзор", path: "index.md" },
			{ title: "Быстрый старт", path: "getting-started.md" }
		]
	},
	{
		title: "Основы",
		items: [
			{ title: "Flow и состояния", path: "concepts/flows.md" },
			{ title: "Views", path: "concepts/views.md" },
			{ title: "Commands и Queries", path: "concepts/commands.md" },
			{ title: "Router", path: "concepts/router.md" },
			{ title: "Context", path: "concepts/context.md" },
			{ title: "Sessions", path: "concepts/sessions.md" },
			{ title: "Keyboard", path: "concepts/keyboard.md" },
			{ title: "Text", path: "concepts/text.md" }
		]
	},
	{
		title: "Руководства",
		items: [
			{ title: "Callback-кнопки", path: "guides/callbacks.md" },
			{ title: "Текстовый ввод", path: "guides/text-input.md" },
			{ title: "Форма записи", path: "guides/appointment.md" },
			{ title: "Ошибки и валидация", path: "guides/errors.md" },
			{ title: "Тесты", path: "guides/testing.md" }
		]
	},
	{
		title: "API",
		items: [{ title: "Справочник", path: "api/reference.md" }]
	},
	{
		title: "О фреймворке",
		items: [
			{ title: "Архитектура", path: "architecture.md" },
			{ title: "Production", path: "production.md" },
			{ title: "Ограничения", path: "limits.md" },
			{ title: "FAQ", path: "faq.md" }
		]
	}
];
