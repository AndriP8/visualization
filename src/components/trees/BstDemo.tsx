import { useEffect, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import {
	height,
	insert,
	type Node,
	remove,
	TreeNodeView,
	traverse,
} from "./tree";

const STEP_MS = 600;

type Pending = {
	steps: number[];
	finalRoot: Node | null;
	result: { flash: number | null; miss: number | null; message: string };
};

const REMOVE_CASES = [
	"it had no children, so its parent just links past it",
	"it had one child, which moves up into its place",
	"it had two children, so the smallest larger node moves up into its place",
];

function compareSteps(
	tree: Node | null,
	target: number,
): { steps: number[]; found: boolean } {
	const steps: number[] = [];
	let node = tree;
	while (node) {
		steps.push(node.value);
		if (target === node.value) return { steps, found: true };
		node = target < node.value ? node.left : node.right;
	}
	return { steps, found: false };
}

function findNode(tree: Node | null, target: number): Node | null {
	let node = tree;
	while (node && node.value !== target)
		node = target < node.value ? node.left : node.right;
	return node;
}

function childCount(node: Node): 0 | 1 | 2 {
	return ((node.left ? 1 : 0) + (node.right ? 1 : 0)) as 0 | 1 | 2;
}

export function BstDemo() {
	const [root, setRoot] = useState<Node | null>(() =>
		[8, 4, 12, 2, 6, 10, 14].reduce<Node | null>(
			(tree, value) => insert(tree, value),
			null,
		),
	);
	const [value, setValue] = useState("5");
	const [query, setQuery] = useState(8);
	const [message, setMessage] = useState("");
	const [path, setPath] = useState<number[]>([]);
	const [miss, setMiss] = useState<number | null>(null);
	const [flash, setFlash] = useState<number | null>(null);
	const [pending, setPending] = useState<Pending | null>(null);
	const [stepIndex, setStepIndex] = useState(0);

	const walking = pending !== null;

	useEffect(() => {
		if (!pending) return;
		if (stepIndex < pending.steps.length) {
			const timer = setTimeout(() => setStepIndex((step) => step + 1), STEP_MS);
			return () => clearTimeout(timer);
		}
		setPath(pending.steps);
		setFlash(pending.result.flash);
		setMiss(pending.result.miss);
		setMessage(pending.result.message);
		setRoot(pending.finalRoot);
		setPending(null);
	}, [pending, stepIndex]);

	function startWalk(walk: Pending) {
		setPath([]);
		setMiss(null);
		setFlash(null);
		setMessage("");
		setStepIndex(0);
		setPending(walk);
	}

	function addValue() {
		const number = Number(value);
		if (
			!Number.isInteger(number) ||
			number < 0 ||
			number > 99 ||
			traverse(root).includes(number)
		)
			return;
		const { steps } = compareSteps(root, number);
		const last = steps.at(-1);
		startWalk({
			steps,
			finalRoot: insert(structuredClone(root), number),
			result: {
				flash: number,
				miss: null,
				message:
					last === undefined
						? `Inserted ${number} as the first node.`
						: `Inserted ${number} below ${last}.`,
			},
		});
	}

	function searchValue() {
		const { steps, found } = compareSteps(root, query);
		const last = steps.at(-1) ?? null;
		startWalk({
			steps,
			finalRoot: root,
			result: found
				? {
						flash: null,
						miss: null,
						message: `Found ${query} in ${steps.length} step${steps.length === 1 ? "" : "s"}.`,
					}
				: {
						flash: null,
						miss: last,
						message:
							steps.length === 0
								? "Tree is empty."
								: `${query} is not in the tree.`,
					},
		});
	}

	function removeValue() {
		if (!root) {
			startWalk({
				steps: [],
				finalRoot: null,
				result: { flash: null, miss: null, message: "Tree is empty." },
			});
			return;
		}
		const { steps } = compareSteps(root, query);
		const node = findNode(root, query);
		const last = steps.at(-1) ?? null;
		startWalk({
			steps,
			finalRoot: node ? remove(structuredClone(root), query) : root,
			result: node
				? {
						flash: null,
						miss: null,
						message: `Removed ${query}: ${REMOVE_CASES[childCount(node)]}.`,
					}
				: { flash: null, miss: last, message: `${query} is not in the tree.` },
		});
	}

	const walkPath = pending ? pending.steps.slice(0, stepIndex) : path;
	const walkFlash = pending ? (pending.steps[stepIndex] ?? null) : flash;

	return (
		<DemoSection
			title="Operations playground"
			description="Insert, search, and delete all follow the same rule: compare with the current node, then take its left or right address. The highlight walks the path one node at a time, the visited nodes stay lit behind it, and the message appears when the walk finishes."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<input
						aria-label="Value to insert"
						type="number"
						min="0"
						max="99"
						value={value}
						onChange={(event) => setValue(event.target.value)}
						className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
					/>
					<button
						type="button"
						onClick={addValue}
						disabled={walking}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300 disabled:opacity-50"
					>
						Insert
					</button>
					<input
						aria-label="Value to search or delete"
						type="number"
						value={query}
						onChange={(event) => setQuery(Number(event.target.value))}
						className="ml-0 w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 md:ml-4"
					/>
					<button
						type="button"
						onClick={searchValue}
						disabled={walking}
						className="rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-3 py-1.5 text-sm text-cyan-300 disabled:opacity-50"
					>
						Search
					</button>
					<button
						type="button"
						onClick={removeValue}
						disabled={walking}
						className="rounded-lg border border-rose-500/30 bg-rose-600/20 px-3 py-1.5 text-sm text-rose-300 disabled:opacity-50"
					>
						Delete
					</button>
					<button
						type="button"
						onClick={() => {
							setRoot(null);
							setPending(null);
							setPath([]);
							setMiss(null);
							setFlash(null);
							setMessage("");
						}}
						disabled={walking}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300 disabled:opacity-50"
					>
						Clear
					</button>
				</div>
				{message && (
					<output aria-live="polite" className="block text-sm text-cyan-300">
						{message}
					</output>
				)}
				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-5">
					{root ? (
						<div className="flex min-w-max justify-center">
							<TreeNodeView
								node={root}
								path={walkPath}
								flash={walkFlash}
								miss={miss}
							/>
						</div>
					) : (
						<p className="text-sm text-zinc-600">Tree is empty</p>
					)}
				</div>
				<p className="text-sm text-zinc-400">
					In-order:{" "}
					<span className="font-mono text-purple-300">
						{traverse(root).join(" → ") || "—"}
					</span>
				</p>
				<p className="text-sm text-zinc-400">
					Height:{" "}
					<span className="font-mono text-purple-300">{height(root)}</span>
					<span className="ml-2 text-xs text-zinc-500">
						(search visits at most one node per level)
					</span>
				</p>
			</div>
		</DemoSection>
	);
}
