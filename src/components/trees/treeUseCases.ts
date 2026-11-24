export interface UseCaseNode {
	id: string;
	label: string;
	detail?: string;
	children: UseCaseNode[];
}

export type PathStyle = "filesystem" | "json";

export const FILE_SYSTEM: UseCaseNode = {
	id: "/",
	label: "~",
	detail: "home",
	children: [
		{
			id: "/projects",
			label: "projects",
			children: [
				{
					id: "/projects/visualizer",
					label: "visualizer",
					children: [
						{
							id: "/projects/visualizer/src",
							label: "src",
							children: [
								{
									id: "/projects/visualizer/src/routes",
									label: "routes",
									children: [
										{
											id: "/projects/visualizer/src/routes/trees.tsx",
											label: "trees.tsx",
											detail: "8.4 kB",
											children: [],
										},
										{
											id: "/projects/visualizer/src/routes/hash-tables.tsx",
											label: "hash-tables.tsx",
											detail: "12.1 kB",
											children: [],
										},
									],
								},
								{
									id: "/projects/visualizer/src/components",
									label: "components",
									children: [
										{
											id: "/projects/visualizer/src/components/trees",
											label: "trees",
											detail: "4 demos",
											children: [],
										},
									],
								},
							],
						},
						{
							id: "/projects/visualizer/package.json",
							label: "package.json",
							detail: "1.2 kB",
							children: [],
						},
					],
				},
				{
					id: "/projects/notes.md",
					label: "notes.md",
					detail: "3.8 kB",
					children: [],
				},
			],
		},
		{
			id: "/.config",
			label: ".config",
			children: [
				{
					id: "/.config/settings.json",
					label: "settings.json",
					detail: "640 B",
					children: [],
				},
			],
		},
	],
};

export const JSON_DOCUMENT: UseCaseNode = {
	id: "payload",
	label: "payload",
	detail: "object",
	children: [
		{
			id: "users",
			label: "users",
			detail: "array",
			children: [
				{
					id: "users[0]",
					label: "[0]",
					detail: "object",
					children: [
						{ id: "users[0].id", label: "id", detail: '"u1"', children: [] },
						{
							id: "users[0].name",
							label: "name",
							detail: '"Ada"',
							children: [],
						},
						{
							id: "users[0].roles",
							label: "roles",
							detail: "array",
							children: [
								{
									id: "users[0].roles[0]",
									label: "[0]",
									detail: '"admin"',
									children: [],
								},
							],
						},
					],
				},
				{
					id: "users[1]",
					label: "[1]",
					detail: "object",
					children: [
						{ id: "users[1].id", label: "id", detail: '"u2"', children: [] },
						{
							id: "users[1].name",
							label: "name",
							detail: '"Linus"',
							children: [],
						},
					],
				},
			],
		},
		{
			id: "orders",
			label: "orders",
			detail: "array",
			children: [
				{
					id: "orders[0]",
					label: "[0]",
					detail: "object",
					children: [
						{ id: "orders[0].id", label: "id", detail: "4412", children: [] },
						{
							id: "orders[0].items",
							label: "items",
							detail: "array",
							children: [
								{
									id: "orders[0].items[0]",
									label: "[0]",
									detail: "{ sku, qty }",
									children: [],
								},
								{
									id: "orders[0].items[1]",
									label: "[1]",
									detail: "{ sku, price: 42 }",
									children: [],
								},
							],
						},
					],
				},
			],
		},
		{
			id: "meta",
			label: "meta",
			detail: "object",
			children: [
				{ id: "meta.version", label: "version", detail: "3", children: [] },
				{ id: "meta.cached", label: "cached", detail: "true", children: [] },
			],
		},
	],
};

export function findPath(root: UseCaseNode, id: string): UseCaseNode[] {
	if (root.id === id) return [root];
	for (const child of root.children) {
		const path = findPath(child, id);
		if (path.length > 0) return [root, ...path];
	}
	return [];
}

export function flatten(root: UseCaseNode): UseCaseNode[] {
	return [root, ...root.children.flatMap(flatten)];
}

export function leaves(root: UseCaseNode): UseCaseNode[] {
	return flatten(root).filter((node) => node.children.length === 0);
}

export function formatPath(path: UseCaseNode[], style: PathStyle): string {
	if (path.length === 0) return "";
	if (style === "filesystem") {
		return path.map((node) => node.label).join("/");
	}
	return path
		.slice(1)
		.reduce(
			(text, node) =>
				node.label.startsWith("[")
					? `${text}${node.label}`
					: text
						? `${text}.${node.label}`
						: node.label,
			"",
		);
}
