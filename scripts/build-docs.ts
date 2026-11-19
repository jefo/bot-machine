import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { gfmHeadingId } from "marked-gfm-heading-id";
import hljs from "highlight.js";
import { nav } from "../docs-src/nav";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.join(root, "docs-src");
const out = path.join(root, "docs");

const marked = new Marked(
	gfmHeadingId(),
	markedHighlight({
		langPrefix: "hljs language-",
		highlight(code, lang) {
			const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
			return hljs.highlight(code, { language }).value;
		}
	})
);

const flat = nav.flatMap((group) => group.items);

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function stripTags(value: string): string {
	return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function pageHref(mdPath: string): string {
	return mdPath.replace(/\.md$/, ".html");
}

function relativeHref(from: string, to: string): string {
	const fromDir = path.posix.dirname(pageHref(from));
	const target = pageHref(to);
	const relative = path.posix.relative(fromDir === "." ? "" : fromDir, target);
	return relative || "index.html";
}

function layout(options: {
	title: string;
	description: string;
	html: string;
	current: string;
	toc: string;
	prev?: { title: string; path: string };
	next?: { title: string; path: string };
}): string {
	const sidebar = nav
		.map(
			(group) => `
			<div class="nav-group">
				<span>${escapeHtml(group.title)}</span>
				${group.items
					.map(
						(item) =>
							`<a href="${relativeHref(options.current, item.path)}"${
								item.path === options.current ? ' class="active"' : ""
							}>${escapeHtml(item.title)}</a>`
					)
					.join("\n")}
			</div>`
		)
		.join("\n");

	const pager =
		options.prev || options.next
			? `<div class="pager">
				${
					options.prev
						? `<a href="${relativeHref(options.current, options.prev.path)}"><small>Назад</small>${escapeHtml(options.prev.title)}</a>`
						: "<span></span>"
				}
				${
					options.next
						? `<a class="next" href="${relativeHref(options.current, options.next.path)}"><small>Дальше</small>${escapeHtml(options.next.title)}</a>`
						: "<span></span>"
				}
			</div>`
			: "";

	return `<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>${escapeHtml(options.title)} — Bot Machine</title>
	<meta name="description" content="${escapeHtml(options.description)}" />
	<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2315161c'/%3E%3Cpath d='M8 10h16v2H8zm0 5h10v2H8zm0 5h13v2H8z' fill='%23faf9f5'/%3E%3C/svg%3E" />
	<link rel="stylesheet" href="${relativeHref(options.current, "assets/docs.css").replace(/\.html$/, ".css")}" />
</head>
<body>
	<header class="topbar">
		<a class="brand" href="${relativeHref(options.current, "index.md")}">Bot Machine <small>0.1.11</small></a>
		<nav class="topnav">
			<a href="https://github.com/kaizin-lab/bot-machine">GitHub</a>
			<a href="https://www.npmjs.com/package/@bot-machine/telegram-sdk">npm</a>
			<a class="keep" href="https://github.com/jefo">портфолио</a>
		</nav>
		<button class="menu" type="button" aria-label="Открыть меню">меню</button>
	</header>
	<div class="layout">
		<aside class="sidebar">
			${sidebar}
		</aside>
		<main class="content">
			<article class="prose">
				${options.html}
				${pager}
				<div class="footer">Bot Machine 0.1.11 · MIT · <a href="https://github.com/kaizin-lab/bot-machine">исходный репозиторий</a></div>
			</article>
		</main>
		<aside class="toc">
			<span>На этой странице</span>
			${options.toc}
		</aside>
	</div>
	<script src="${relativeHref(options.current, "assets/docs.js").replace(/\.html$/, ".js")}"></script>
</body>
</html>`;
}

function buildToc(html: string): string {
	const headings = [...html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)];
	return headings
		.map(
			(match) =>
				`<a class="h${match[1]}" href="#${match[2]}">${stripTags(match[3] ?? "")}</a>`
		)
		.join("\n");
}

function buildPage(item: { title: string; path: string }, index: number): void {
	const source = fs.readFileSync(path.join(src, item.path), "utf8");
	const html = (marked.parse(source) as string)
		.replace(/<table>/g, '<div class="table-wrap"><table>')
		.replace(/<\/table>/g, "</table></div>")
		.replace(/href="([^"]+)\.md(#[^"]*)?"/g, 'href="$1.html$2"');
	const firstParagraph = html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? item.title;
	const prev = index > 0 ? flat[index - 1] : undefined;
	const next = index < flat.length - 1 ? flat[index + 1] : undefined;

	const page = layout({
		title: item.title,
		description: stripTags(firstParagraph).slice(0, 180),
		html,
		current: item.path,
		toc: buildToc(html),
		prev,
		next
	});

	const target = path.join(out, pageHref(item.path));
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, page);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(src, "assets"), path.join(out, "assets"), { recursive: true });
fs.writeFileSync(path.join(out, ".nojekyll"), "");

flat.forEach(buildPage);

const notFound = layout({
	title: "Страница не найдена",
	description: "Страница не найдена в документации Bot Machine.",
	html: "<h1>404</h1><p>Такой страницы нет. Вернитесь в <a href=\"/bot-machine/\">документацию</a>.</p>",
	current: "index.md",
	toc: ""
});
fs.writeFileSync(path.join(out, "404.html"), notFound);

console.log(`docs built: ${flat.length} pages`);
