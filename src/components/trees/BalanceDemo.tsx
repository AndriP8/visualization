import { DemoSection } from "../shared/DemoSection";
import { buildBalanced, height, insert, type Node, TreeNodeView } from "./tree";

const VALUES = [1, 2, 3, 4, 5, 6, 7];

const skewed = VALUES.reduce<Node | null>(
	(tree, value) => insert(tree, value),
	null,
) as Node;
const balanced = buildBalanced([...VALUES].sort()) as Node;

export function BalanceDemo() {
	return (
		<DemoSection
			title="Skewed vs. balanced"
			description="Both trees hold the same seven values, and each node is the same small record — one value plus two links. Inserting the values in order leaves one long chain, so a lookup may have to check every node. Rebuilding from the middle keeps every path short, so a lookup checks only a few nodes. Height is the number that search cost depends on."
		>
			<div className="grid gap-5 md:grid-cols-2">
				{[
					["Sorted insertions", skewed, "height 7 — search is O(n)"],
					["Rebuilt balanced", balanced, "height 3 — search is O(log n)"],
				].map(([title, node, note]) => (
					<div
						key={title as string}
						className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
					>
						<p className="mb-3 text-sm font-medium text-zinc-200">
							{title as string}
						</p>
						<div className="overflow-x-auto">
							<div className="flex min-w-max justify-center">
								<TreeNodeView
									node={node as Node}
									path={[]}
									flash={null}
									miss={null}
								/>
							</div>
						</div>
						<p className="mt-3 text-xs text-zinc-500">{note as string}</p>
					</div>
				))}
			</div>
			<p className="mt-4 text-sm text-zinc-400">
				Heights:{" "}
				<span className="font-mono text-purple-300">{height(skewed)}</span> vs{" "}
				<span className="font-mono text-purple-300">{height(balanced)}</span>
				<span className="ml-2 text-xs text-zinc-500">
					AVL and red-black trees keep this gap closed with rotations
				</span>
			</p>
		</DemoSection>
	);
}
