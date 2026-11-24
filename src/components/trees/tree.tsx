export interface Node {
	value: number;
	left: Node | null;
	right: Node | null;
}

export function insert(node: Node | null, value: number): Node {
	if (!node) return { value, left: null, right: null };
	if (value < node.value) node.left = insert(node.left, value);
	else if (value > node.value) node.right = insert(node.right, value);
	return node;
}

export function traverse(node: Node | null, values: number[] = []): number[] {
	if (!node) return values;
	traverse(node.left, values);
	values.push(node.value);
	traverse(node.right, values);
	return values;
}

export function preOrder(node: Node | null, values: number[] = []): number[] {
	if (!node) return values;
	values.push(node.value);
	preOrder(node.left, values);
	preOrder(node.right, values);
	return values;
}

export function postOrder(node: Node | null, values: number[] = []): number[] {
	if (!node) return values;
	postOrder(node.left, values);
	postOrder(node.right, values);
	values.push(node.value);
	return values;
}

export function levelOrder(node: Node | null): number[] {
	if (!node) return [];
	const values: number[] = [];
	const queue: Node[] = [node];
	for (let i = 0; i < queue.length; i++) {
		const current = queue[i] as Node;
		values.push(current.value);
		if (current.left) queue.push(current.left);
		if (current.right) queue.push(current.right);
	}
	return values;
}

export function remove(node: Node | null, value: number): Node | null {
	if (!node) return null;
	if (value < node.value) {
		node.left = remove(node.left, value);
		return node;
	}
	if (value > node.value) {
		node.right = remove(node.right, value);
		return node;
	}
	if (!node.left) return node.right;
	if (!node.right) return node.left;
	let successor = node.right;
	while (successor.left) successor = successor.left;
	node.value = successor.value;
	node.right = remove(node.right, successor.value);
	return node;
}

export function collectRange(
	node: Node | null,
	min: number,
	max: number,
	values: number[] = [],
): number[] {
	if (!node) return values;
	if (node.value > min) collectRange(node.left, min, max, values);
	if (node.value >= min && node.value <= max) values.push(node.value);
	if (node.value < max) collectRange(node.right, min, max, values);
	return values;
}

export function height(node: Node | null): number {
	return node ? 1 + Math.max(height(node.left), height(node.right)) : 0;
}

export function buildBalanced(
	values: number[],
	start = 0,
	end = values.length,
): Node | null {
	if (start >= end) return null;
	const middle = Math.floor((start + end) / 2);
	return {
		value: values[middle] as number,
		left: buildBalanced(values, start, middle),
		right: buildBalanced(values, middle + 1, end),
	};
}

export function TreeNodeView({
	node,
	path,
	flash,
	miss,
}: {
	node: Node;
	path: number[];
	flash: number | null;
	miss: number | null;
}) {
	const children = [node.left, node.right].filter(Boolean) as Node[];
	let tone = "border-purple-500/40 bg-purple-500/15 text-purple-200";
	if (miss === node.value)
		tone = "border-amber-500/50 bg-amber-500/15 text-amber-200";
	else if (path.includes(node.value))
		tone = "border-cyan-500/50 bg-cyan-500/15 text-cyan-200";
	else if (flash === node.value)
		tone = "border-purple-300 bg-purple-500/30 text-purple-100";
	return (
		<div className="flex flex-col items-center">
			<span
				className={`rounded-full border px-3 py-2 font-mono text-sm ${tone}`}
			>
				{node.value}
			</span>
			{children.length > 0 && <span className="block h-4 w-px bg-zinc-700" />}
			{children.length > 0 && (
				<div
					className={
						children.length > 1 ? "border-t border-zinc-700" : undefined
					}
				>
					<div className="flex items-start gap-5">
						{children.map((child) => (
							<div key={child.value} className="flex flex-col items-center">
								{children.length > 1 && (
									<span className="block h-4 w-px bg-zinc-700" />
								)}
								<TreeNodeView
									node={child}
									path={path}
									flash={flash}
									miss={miss}
								/>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
