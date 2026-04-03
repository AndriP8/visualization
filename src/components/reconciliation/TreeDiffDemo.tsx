import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { FiberTree } from "./FiberTree";
import type { FiberNodeData } from "./types";

const BEFORE_TREE: FiberNodeData = {
	id: "app",
	type: "App",
	status: "unchanged",
	children: [
		{
			id: "header",
			type: "header",
			status: "unchanged",
			children: [
				{ id: "h1", type: "h1", status: "unchanged", props: { text: "Hello" } },
			],
		},
		{
			id: "main",
			type: "main",
			status: "unchanged",
			children: [
				{ id: "p1", type: "p", status: "unchanged", props: { text: "Item 1" } },
				{ id: "p2", type: "p", status: "unchanged", props: { text: "Item 2" } },
			],
		},
	],
};

const AFTER_TREE: FiberNodeData = {
	id: "app",
	type: "App",
	status: "unchanged",
	children: [
		{
			id: "header",
			type: "header",
			status: "unchanged",
			children: [
				{
					id: "h1",
					type: "h1",
					status: "updated",
					props: { text: "World" },
				},
			],
		},
		{
			id: "main",
			type: "main",
			status: "unchanged",
			children: [
				{ id: "p1", type: "p", status: "unchanged", props: { text: "Item 1" } },
				{
					id: "p2",
					type: "p",
					status: "removed",
					props: { text: "Item 2" },
				},
				{
					id: "p3",
					type: "p",
					status: "added",
					props: { text: "Item 3" },
				},
			],
		},
	],
};

const STATUS_LEGEND = [
	{ status: "unchanged", color: "var(--svg-border)", label: "Unchanged" },
	{ status: "updated", color: "#ca8a04", label: "Updated" },
	{ status: "added", color: "#16a34a", label: "Added" },
	{ status: "removed", color: "#dc2626", label: "Removed" },
];

export function TreeDiffDemo() {
	const [showAfter, setShowAfter] = useState(false);

	return (
		<DemoSection
			title="Demo 1: Tree Diff Visualizer"
			description="See how React compares the &quot;before&quot; and &quot;after&quot; fiber trees. Nodes are color-coded by what changed."
		>
			{/* Legend */}
			<div className="flex gap-4 mb-5 flex-wrap">
				{STATUS_LEGEND.map((item) => (
					<div
						key={item.status}
						className="flex items-center gap-1.5 text-xs text-text-tertiary"
					>
						<span
							className="w-3 h-3 rounded-full border-2"
							style={{
								borderColor: item.color,
								backgroundColor: `${item.color}33`,
							}}
						/>
						{item.label}
					</div>
				))}
			</div>

			{/* Toggle */}
			<div className="flex items-center gap-3 mb-5">
				<button
					type="button"
					onClick={() => setShowAfter(false)}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						!showAfter
							? "bg-violet-500/20 text-accent-violet border border-violet-500/30"
							: "bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary"
					}`}
				>
					Before setState
				</button>
				<button
					type="button"
					onClick={() => setShowAfter(true)}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						showAfter
							? "bg-violet-500/20 text-accent-violet border border-violet-500/30"
							: "bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary"
					}`}
				>
					After setState
				</button>
			</div>

			{/* Trees side by side */}
			<div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
				<FiberTree
					root={BEFORE_TREE}
					label="Previous Tree"
					width={400}
					height={300}
				/>
				{showAfter && (
					<FiberTree
						root={AFTER_TREE}
						label="New Tree (diff)"
						width={400}
						height={300}
					/>
				)}
			</div>

			{/* Explanation */}
			{showAfter && (
				<div className="mt-5 p-4 rounded-lg bg-surface-secondary/50 border border-border-secondary/50 text-sm text-text-secondary space-y-1">
					<p>
						<span className="text-accent-yellow-soft font-mono">
							&lt;h1&gt;
						</span>{" "}
						— Same type, text prop changed → <strong>UPDATE</strong> (patch
						props only)
					</p>
					<p>
						<span className="text-accent-red-soft font-mono">
							&lt;p&gt; Item 2
						</span>{" "}
						— Removed from tree → <strong>DELETE</strong> (unmount)
					</p>
					<p>
						<span className="text-accent-green-soft font-mono">
							&lt;p&gt; Item 3
						</span>{" "}
						— New node → <strong>INSERT</strong> (mount)
					</p>
				</div>
			)}
		</DemoSection>
	);
}
