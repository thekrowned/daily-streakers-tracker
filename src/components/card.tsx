import type { JSXNode } from "hono/jsx";

function Card({
	title,
	descriptions,
	children,
}: {
	title?: string;
	descriptions?: any;
	children?: any;
}) {
	return (
		<div class="card">
			{title && <div class="card__title">{title}</div>}
			{descriptions && <div class="card__descriptions">{descriptions}</div>}
			{children}
		</div>
	);
}

export { Card };
