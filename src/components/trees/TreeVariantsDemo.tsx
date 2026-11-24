import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const NODE_OBJECTS = `interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

const tree: TreeNode = {
  value: 8,
  left: { value: 4, left: null, right: null },
  right: { value: 12, left: null, right: null },
};`;

const FLAT_ARRAY = `const children = (i: number) => [2 * i + 1, 2 * i + 2];
const parent = (i: number) => Math.floor((i - 1) / 2);

// complete tree, packed breadth-first (level order): one slot per node
const heap = [8, 4, 12, 2, 6, 10, 14];`;

const VARIANTS = [
	{
		name: "Binary tree",
		detail:
			"Each node holds at most two child pointers. No ordering rule — the shape comes from how it was built.",
	},
	{
		name: "Binary search tree",
		detail:
			"A rule the tree never breaks: everything left of a node is smaller, everything right is larger. Search becomes a pointer walk.",
	},
	{
		name: "Self-balancing",
		detail:
			"AVL, red-black, and B-trees fix themselves after each insert or delete, keeping every leaf close to the root. AVL checks branch heights directly; red-black and B-trees stay balanced through their own rules.",
	},
	{
		name: "N-ary",
		detail:
			"JSON, the DOM, and file systems store a list of children instead of two fixed pointers — the same parent-child idea, but a node can have many children.",
	},
];

const ARRAY_VALUES = [8, 4, 12, 2, 6, 10, 14];

export function TreeVariantsDemo() {
	return (
		<DemoSection
			title="Variants & memory layout"
			description="A tree is nodes plus addresses to their children. What changes between variants is the rule the tree keeps and where the nodes live in memory. They can be separate objects joined by addresses, or one packed array where a node's position tells you its parent and children."
		>
			<div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{VARIANTS.map(({ name, detail }) => (
					<div
						key={name}
						className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5"
					>
						<p className="text-sm font-medium text-purple-300">{name}</p>
						<p className="mt-1 text-xs text-zinc-500">{detail}</p>
					</div>
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				<div>
					<p className="mb-3 text-sm font-medium text-zinc-200">
						Node objects · one allocation per node
					</p>
					<ShikiCode
						code={NODE_OBJECTS}
						language="typescript"
						showLineNumbers={false}
					/>
					<p className="mt-3 text-xs text-zinc-500">
						Each node stores its value and two references. Any shape works, but
						following a path means chasing pointers to memory allocated at
						different times.
					</p>
				</div>
				<div>
					<p className="mb-3 text-sm font-medium text-zinc-200">
						Contiguous array · index math instead of pointers
					</p>
					<ShikiCode
						code={FLAT_ARRAY}
						language="typescript"
						showLineNumbers={false}
					/>
					<div className="mt-3 grid grid-cols-7 gap-1">
						{ARRAY_VALUES.map((value, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: slot index is the identity
								key={`slot-${index}`}
								className="rounded-md border border-zinc-800 bg-zinc-950/40 px-1 py-2 text-center font-mono text-xs"
							>
								<span className="block text-[10px] text-zinc-600">{index}</span>
								<span className="text-purple-300">{value}</span>
							</div>
						))}
					</div>
					<p className="mt-3 text-xs text-zinc-500">
						A complete tree has every level full except possibly the last, which
						fills from left to right. Only complete trees pack this way:
						children of slot i sit at 2i+1 and 2i+2, so no child pointers are
						stored at all. The Heaps page builds its whole structure on this
						layout.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
