import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { buildBalanced, collectRange, type Node, TreeNodeView } from "./tree";

const ROOT = buildBalanced([5, 10, 15, 20, 25, 30, 35, 45, 60]) as Node;

const ROWS = [
	{
		question: "Find one exact key",
		hash: "Almost instant on average. This is the case a hash table wins.",
		tree: "One node per level: fast when the tree is balanced, slow when it is skewed into a chain.",
	},
	{
		question: "List every value in sorted order",
		hash: "Cannot. It keeps no order, so it must collect everything and sort it first.",
		tree: "One walk already visits values smallest to largest.",
	},
	{
		question: "Everything between 5 and 50",
		hash: "Cannot. It must check every single entry.",
		tree: "Skips whole branches whose values cannot fall inside the range.",
	},
	{
		question: "Smallest or largest value",
		hash: "Cannot. It must check every single entry.",
		tree: "Follow the leftmost (or rightmost) path to the end.",
	},
	{
		question: "Closest value to X",
		hash: "Cannot. It must check every single entry.",
		tree: "Follow one search path and look at the nodes next to it.",
	},
];

const inputClass =
	"w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200";

export function TreeTradeOffDemo() {
	const [min, setMin] = useState("12");
	const [max, setMax] = useState("32");
	const [inRange, setInRange] = useState<number[]>([]);
	const [message, setMessage] = useState("");

	function runQuery() {
		const low = Number(min);
		const high = Number(max);
		if (low > high) {
			setInRange([]);
			setMessage("The start of the range is larger than its end.");
			return;
		}
		const found = collectRange(ROOT, low, high);
		setInRange(found);
		setMessage(
			found.length === 0
				? `No values between ${low} and ${high}.`
				: `Between ${low} and ${high}: ${found.join(" → ")}`,
		);
	}

	return (
		<DemoSection
			title="When a tree beats a hash table"
			description="A hash table finds one exact key faster: almost instant on average, while a balanced search tree needs one step per level. But a hash table stores values in no particular order, so every question that involves order means checking every entry. A search tree's shape is its ordering, so those questions stay cheap."
		>
			<div className="space-y-5">
				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50">
					<table className="w-full min-w-max text-left text-sm">
						<thead>
							<tr className="text-xs text-zinc-500">
								<th className="px-4 py-2 font-medium">Question</th>
								<th className="px-4 py-2 font-medium">Hash table</th>
								<th className="px-4 py-2 font-medium">Search tree</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-800/70">
							{ROWS.map((row) => (
								<tr key={row.question}>
									<td className="px-4 py-2 text-zinc-200">{row.question}</td>
									<td className="px-4 py-2 text-zinc-400">{row.hash}</td>
									<td className="px-4 py-2 text-purple-300">{row.tree}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<input
						aria-label="Start of range"
						type="number"
						value={min}
						onChange={(event) => setMin(event.target.value)}
						className={inputClass}
					/>
					<span className="text-sm text-zinc-500">to</span>
					<input
						aria-label="End of range"
						type="number"
						value={max}
						onChange={(event) => setMax(event.target.value)}
						className={inputClass}
					/>
					<button
						type="button"
						onClick={runQuery}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300"
					>
						Run range query
					</button>
				</div>
				{message && (
					<output aria-live="polite" className="block text-sm text-cyan-300">
						{message}
					</output>
				)}
				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-5">
					<div className="flex min-w-max justify-center">
						<TreeNodeView node={ROOT} path={inRange} flash={null} miss={null} />
					</div>
				</div>
				<p className="text-sm text-zinc-400">
					The tree skips whole branches whose values cannot fall inside the
					range. A hash table keeps no order, so it would have to check every
					single entry to answer the same question.
				</p>
			</div>
		</DemoSection>
	);
}
