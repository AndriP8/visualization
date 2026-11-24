import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import {
	insert,
	levelOrder,
	type Node,
	postOrder,
	preOrder,
	TreeNodeView,
	traverse,
} from "./tree";

const SAMPLE = [8, 4, 12, 2, 6, 10, 14];

type Order = "in" | "pre" | "post" | "level";

const ORDERS: { id: Order; label: string; hint: string }[] = [
	{ id: "in", label: "In-order", hint: "sorted output" },
	{ id: "pre", label: "Pre-order", hint: "copy / serialize" },
	{ id: "post", label: "Post-order", hint: "release children first" },
	{ id: "level", label: "Level-order", hint: "one depth at a time" },
];

export function TraversalDemo() {
	const [tree] = useState<Node>(
		() =>
			SAMPLE.reduce<Node | null>(
				(node, value) => insert(node, value),
				null,
			) as Node,
	);
	const [order, setOrder] = useState<Order>("in");
	const [seq, setSeq] = useState<number[]>([]);
	const [index, setIndex] = useState(-1);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		if (!playing || index < 0 || index >= seq.length - 1) return;
		const timer = setTimeout(() => setIndex((step) => step + 1), 600);
		return () => clearTimeout(timer);
	}, [playing, index, seq.length]);

	function sequence(node: Node | null): number[] {
		return match(order)
			.with("in", () => traverse(node))
			.with("pre", () => preOrder(node))
			.with("post", () => postOrder(node))
			.with("level", () => levelOrder(node))
			.exhaustive();
	}

	function play() {
		setSeq(sequence(tree));
		setIndex(0);
		setPlaying(true);
	}

	function reset() {
		setPlaying(false);
		setSeq([]);
		setIndex(-1);
	}

	const visited = seq.slice(0, index + 1);
	const active = ORDERS.find((entry) => entry.id === order);

	return (
		<DemoSection
			title="Algorithms in the wild: visit orders"
			description="Every question you ask a tree is some order for visiting its nodes. Visiting a node between its two subtrees prints the values in sorted order. Visiting it before its children is how you copy or save a tree. Visiting it after its children frees a subtree from the bottom up. Visiting one whole level at a time tells you what sits at each depth. Each order touches every node once, so the work grows with the number of nodes (O(n))."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					{ORDERS.map(({ id, label, hint }) => (
						<button
							key={id}
							type="button"
							onClick={() => {
								setOrder(id);
								reset();
							}}
							className={`rounded-lg border px-3 py-1.5 text-left text-sm ${
								order === id
									? "border-purple-500/40 bg-purple-600/30 text-purple-200"
									: "border-zinc-600/40 bg-zinc-700/30 text-zinc-300"
							}`}
						>
							{label}
							<span
								className={`block text-[10px] ${
									order === id ? "text-purple-400" : "text-zinc-500"
								}`}
							>
								{hint}
							</span>
						</button>
					))}
					<button
						type="button"
						onClick={play}
						disabled={playing}
						className="ml-0 rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-3 py-1.5 text-sm text-cyan-300 disabled:opacity-50 md:ml-4"
					>
						Play
					</button>
					<button
						type="button"
						onClick={reset}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300"
					>
						Reset
					</button>
				</div>
				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-5">
					<div className="flex min-w-max justify-center">
						<TreeNodeView
							node={tree}
							path={seq.slice(0, index)}
							flash={seq[index] ?? null}
							miss={null}
						/>
					</div>
				</div>
				<output aria-live="polite" className="block text-sm text-zinc-400">
					{active?.label}:{" "}
					<span className="font-mono text-cyan-300">
						{visited.join(" → ") || "—"}
					</span>
					{seq.length > 0 && (
						<span className="ml-2 text-xs text-zinc-500">
							step {index + 1} of {seq.length}
						</span>
					)}
				</output>
			</div>
		</DemoSection>
	);
}
