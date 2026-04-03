import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface TreeNode {
	id: string;
	tag: string;
	x: number;
	y: number;
	visible?: boolean;
	excludeReason?: string;
	children?: TreeNode[];
}

interface CssRule {
	selector: string;
	property: string;
	value: string;
	enabled: boolean;
}

const DOM_TREE: TreeNode = {
	id: "html",
	tag: "html",
	x: 160,
	y: 25,
	children: [
		{
			id: "head",
			tag: "head",
			x: 70,
			y: 90,
			visible: false,
			excludeReason: "Not visual",
			children: [
				{
					id: "meta",
					tag: "meta",
					x: 30,
					y: 155,
					visible: false,
					excludeReason: "Not visual",
				},
				{
					id: "script",
					tag: "script",
					x: 110,
					y: 155,
					visible: false,
					excludeReason: "Not visual",
				},
			],
		},
		{
			id: "body",
			tag: "body",
			x: 250,
			y: 90,
			children: [
				{ id: "h1", tag: "h1", x: 190, y: 155, visible: true },
				{ id: "p", tag: "p", x: 250, y: 155, visible: true },
				{
					id: "div-hidden",
					tag: "div.hidden",
					x: 310,
					y: 155,
					visible: true,
				},
			],
		},
	],
};

const CSSOM_RULES: TreeNode = {
	id: "stylesheet",
	tag: "stylesheet",
	x: 160,
	y: 25,
	children: [
		{
			id: "css-body",
			tag: "body { }",
			x: 70,
			y: 90,
			children: [
				{
					id: "css-font",
					tag: "font: sans-serif",
					x: 70,
					y: 155,
				},
			],
		},
		{
			id: "css-h1",
			tag: "h1 { }",
			x: 160,
			y: 90,
			children: [
				{
					id: "css-color",
					tag: "color: blue",
					x: 160,
					y: 155,
				},
			],
		},
		{
			id: "css-hidden",
			tag: ".hidden { }",
			x: 250,
			y: 90,
			children: [
				{
					id: "css-display",
					tag: "display: none",
					x: 250,
					y: 155,
				},
			],
		},
	],
};

function flattenTree(node: TreeNode): TreeNode[] {
	const result: TreeNode[] = [node];
	if (node.children) {
		for (const child of node.children) {
			result.push(...flattenTree(child));
		}
	}
	return result;
}

function renderMiniTree(
	node: TreeNode,
	options: {
		treeColor: string;
		dimmedIds?: Set<string>;
		parentX?: number;
		parentY?: number;
	},
) {
	const elements: React.ReactNode[] = [];
	const isDimmed = options.dimmedIds?.has(node.id);

	if (options.parentX !== undefined && options.parentY !== undefined) {
		elements.push(
			<line
				key={`edge-${node.id}`}
				x1={options.parentX}
				y1={options.parentY + 14}
				x2={node.x}
				y2={node.y - 2}
				stroke={isDimmed ? "var(--svg-bg)" : "var(--svg-border)"}
				strokeWidth={1.5}
				strokeDasharray={isDimmed ? "4 2" : "none"}
			/>,
		);
	}

	elements.push(
		<g key={`node-${node.id}`} opacity={isDimmed ? 0.3 : 1}>
			<rect
				x={node.x - 35}
				y={node.y - 10}
				width={70}
				height={24}
				rx={5}
				fill={isDimmed ? "var(--svg-bg)" : "#1c1c1e"}
				stroke={isDimmed ? "var(--svg-bg)" : options.treeColor}
				strokeWidth={1}
			/>
			<text
				x={node.x}
				y={node.y + 5}
				textAnchor="middle"
				fill={isDimmed ? "var(--svg-text-muted)" : options.treeColor}
				fontSize={9}
				fontFamily="monospace"
			>
				{node.tag}
			</text>
			{isDimmed && node.excludeReason && (
				<text
					x={node.x}
					y={node.y + 20}
					textAnchor="middle"
					fill="#ef4444"
					fontSize={7}
					fontFamily="monospace"
				>
					✕ {node.excludeReason}
				</text>
			)}
		</g>,
	);

	if (node.children) {
		for (const child of node.children) {
			elements.push(
				...renderMiniTree(child, {
					...options,
					parentX: node.x,
					parentY: node.y,
				}),
			);
		}
	}

	return elements;
}

export function RenderTreeDemo() {
	const [showRenderTree, setShowRenderTree] = useState(false);
	const [cssRules, setCssRules] = useState<CssRule[]>([
		{
			selector: ".hidden",
			property: "display",
			value: "none",
			enabled: true,
		},
		{ selector: "h1", property: "color", value: "blue", enabled: true },
		{
			selector: "body",
			property: "font-family",
			value: "sans-serif",
			enabled: true,
		},
	]);

	const displayNoneEnabled = cssRules.find(
		(r) => r.selector === ".hidden" && r.property === "display",
	)?.enabled;

	const excludedIds = new Set<string>();
	// head, meta, script are always excluded
	excludedIds.add("head");
	excludedIds.add("meta");
	excludedIds.add("script");
	// div.hidden excluded only if display:none is enabled
	if (displayNoneEnabled) {
		excludedIds.add("div-hidden");
	}

	const domNodes = flattenTree(DOM_TREE);
	const renderTreeNodes = domNodes.filter(
		(n) => !excludedIds.has(n.id) && n.id !== "html",
	);

	const toggleCssRule = (index: number) => {
		setCssRules((prev) =>
			prev.map((r, i) => (i === index ? { ...r, enabled: !r.enabled } : r)),
		);
	};

	return (
		<DemoSection
			title="Demo 2: DOM + CSSOM → Render Tree"
			description="The browser merges DOM and CSSOM trees. Only visible nodes make it into the Render Tree."
		>
			{/* CSS Rule toggles */}
			<div className="mb-5">
				<h4 className="text-xs text-text-muted uppercase tracking-wider mb-2">
					CSS Rules (toggle to see Render Tree change)
				</h4>
				<div className="flex flex-wrap gap-2">
					{cssRules.map((rule, i) => (
						<button
							key={`${rule.selector}-${rule.property}`}
							type="button"
							onClick={() => toggleCssRule(i)}
							className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
								rule.enabled
									? "border-cyan-500/30 bg-cyan-500/10 text-accent-cyan-soft"
									: "border-border-primary bg-surface-primary/50 text-text-faint line-through"
							}`}
						>
							{rule.selector} {"{ "}
							{rule.property}: {rule.value} {"}"}
						</button>
					))}
				</div>
			</div>

			{/* Trees */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
				{/* DOM Tree */}
				<div className="rounded-lg bg-surface-secondary/30 border border-border-primary p-4">
					<h4 className="text-xs font-semibold text-accent-amber-soft uppercase tracking-wider mb-3">
						DOM Tree
					</h4>
					<svg
						viewBox="0 0 320 185"
						className="w-full"
						role="img"
						aria-labelledby="dom-tree-svg-title"
					>
						<title id="dom-tree-svg-title">DOM Tree structure</title>
						{renderMiniTree(DOM_TREE, {
							treeColor: "#f59e0b",
							dimmedIds: showRenderTree ? excludedIds : undefined,
						})}
					</svg>
				</div>

				{/* CSSOM Tree */}
				<div className="rounded-lg bg-surface-secondary/30 border border-border-primary p-4">
					<h4 className="text-xs font-semibold text-accent-cyan-soft uppercase tracking-wider mb-3">
						CSSOM Tree
					</h4>
					<svg
						viewBox="0 0 320 185"
						className="w-full"
						role="img"
						aria-labelledby="cssom-tree-svg-title"
					>
						<title id="cssom-tree-svg-title">CSSOM Tree structure</title>
						{renderMiniTree(CSSOM_RULES, { treeColor: "#22d3ee" })}
					</svg>
				</div>
			</div>

			{/* Merge button */}
			<div className="flex justify-center mb-5">
				<button
					type="button"
					onClick={() => setShowRenderTree(!showRenderTree)}
					className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all border ${
						showRenderTree
							? "bg-emerald-500/20 text-accent-emerald border-emerald-500/30"
							: "bg-amber-500/20 text-accent-amber border-amber-500/30 hover:bg-amber-500/30"
					}`}
				>
					{showRenderTree
						? "✓ Render Tree Built"
						: "⬇ Merge → Build Render Tree"}
				</button>
			</div>

			{/* Render Tree result */}
			<AnimatePresence>
				{showRenderTree && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<div className="rounded-lg bg-surface-secondary/30 border border-emerald-500/20 p-4">
							<h4 className="text-xs font-semibold text-accent-emerald-soft uppercase tracking-wider mb-3">
								Render Tree (visible nodes only)
							</h4>
							<div className="flex flex-wrap gap-2 mb-4">
								{renderTreeNodes.map((node, i) => (
									<motion.div
										key={node.id}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: i * 0.08 }}
										className="px-3 py-2 rounded-lg bg-surface-primary border border-emerald-500/20"
									>
										<span className="text-xs font-mono text-accent-emerald-soft">
											{node.tag}
										</span>
									</motion.div>
								))}
							</div>

							{/* Excluded nodes explanation */}
							<div className="space-y-1.5">
								<h5 className="text-xs text-text-muted font-semibold">
									Excluded from Render Tree:
								</h5>
								<div className="flex flex-wrap gap-2">
									{domNodes
										.filter((n) => excludedIds.has(n.id))
										.map((node) => (
											<span
												key={node.id}
												className="px-2 py-1 text-xs font-mono rounded bg-red-500/10 text-accent-red-soft border border-red-500/20"
											>
												{"<"}
												{node.tag}
												{">"} —{" "}
												{node.id === "div-hidden"
													? "display: none"
													: "not visual content"}
											</span>
										))}
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</DemoSection>
	);
}
