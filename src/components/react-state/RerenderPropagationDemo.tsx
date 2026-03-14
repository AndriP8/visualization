import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

// ─── Tree Definition ──────────────────────────────────────────────────────────

interface TreeNode {
	id: string;
	label: string;
	children: TreeNode[];
}

const TREE: TreeNode = {
	id: "App",
	label: "App",
	children: [
		{
			id: "Header",
			label: "Header",
			children: [],
		},
		{
			id: "Main",
			label: "Main",
			children: [
				{
					id: "Card",
					label: "Card",
					children: [{ id: "Item1", label: "Item", children: [] }],
				},
				{
					id: "List",
					label: "List",
					children: [
						{ id: "Item2", label: "Item", children: [] },
						{ id: "Item3", label: "Item", children: [] },
					],
				},
			],
		},
		{
			id: "Sidebar",
			label: "Sidebar",
			children: [],
		},
	],
};

// ─── Layout computation ───────────────────────────────────────────────────────

interface NodeLayout {
	id: string;
	label: string;
	x: number;
	y: number;
	parentId: string | null;
}

const NODE_W = 88;
const NODE_H = 36;
const Y_GAP = 64;

function computeLayout(
	node: TreeNode,
	depth: number,
	xOffset: { value: number },
	parentId: string | null,
	result: NodeLayout[],
): number {
	if (node.children.length === 0) {
		const x = xOffset.value;
		xOffset.value += NODE_W + 16;
		result.push({
			id: node.id,
			label: node.label,
			x,
			y: depth * Y_GAP + 24,
			parentId,
		});
		return x;
	}

	const childXValues: number[] = [];
	for (const child of node.children) {
		childXValues.push(
			computeLayout(child, depth + 1, xOffset, node.id, result),
		);
	}

	const x = (childXValues[0] + childXValues[childXValues.length - 1]) / 2;
	result.push({
		id: node.id,
		label: node.label,
		x,
		y: depth * Y_GAP + 24,
		parentId,
	});
	return x;
}

function buildLayout(): NodeLayout[] {
	const result: NodeLayout[] = [];
	computeLayout(TREE, 0, { value: 0 }, null, result);
	return result;
}

const LAYOUT = buildLayout();

// Normalise x so tree is centred in viewBox
const allX = LAYOUT.map((n) => n.x);
const minX = Math.min(...allX);
const maxX = Math.max(...allX);
const treeWidth = maxX - minX + NODE_W;
const X_PAD = 20;
const NORMALISED_LAYOUT = LAYOUT.map((n) => ({
	...n,
	x: n.x - minX + X_PAD + NODE_W / 2,
}));
const SVG_WIDTH = treeWidth + 2 * X_PAD;
const SVG_HEIGHT = Math.max(...LAYOUT.map((n) => n.y)) + NODE_H + 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Collect node IDs of `id` and all its descendants */
function getSubtreeIds(nodeId: string, tree: TreeNode): string[] {
	function collect(node: TreeNode): string[] {
		return [node.id, ...node.children.flatMap(collect)];
	}
	function find(node: TreeNode): TreeNode | null {
		if (node.id === nodeId) return node;
		for (const child of node.children) {
			const found = find(child);
			if (found) return found;
		}
		return null;
	}
	const target = find(tree);
	return target ? collect(target) : [];
}

// ─── SVG Node ────────────────────────────────────────────────────────────────

interface SvgNodeProps {
	layout: NodeLayout & { x: number };
	isFlashing: boolean;
	isMemoized: boolean;
	isSkipped: boolean; // memoized AND would re-render but props haven't changed
	onClickSetState: (id: string) => void;
}

function SvgNode({
	layout,
	isFlashing,
	isMemoized,
	isSkipped,
	onClickSetState,
}: SvgNodeProps) {
	const { x, y, id, label } = layout;
	const rx = x - NODE_W / 2;
	const ry = y - NODE_H / 2;
	const [isHovered, setIsHovered] = useState(false);

	const borderColor = isFlashing
		? "#f97316"
		: isSkipped
			? "#3b82f6"
			: isMemoized
				? "#6366f1"
				: "#3f3f46";

	const bgColor = isFlashing
		? "#431407"
		: isSkipped
			? "#1e3a5f"
			: isMemoized
				? "#1e1b4b"
				: "#18181b";

	const textColor = isFlashing
		? "#fb923c"
		: isSkipped
			? "#60a5fa"
			: isMemoized
				? "#a5b4fc"
				: "#a1a1aa";

	const scale = isHovered ? 1.05 : 1;

	return (
		<motion.g
			animate={{ scale }}
			transition={{ duration: 0.2 }}
			style={{ cursor: "pointer" }}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<motion.rect
				x={rx}
				y={ry}
				width={NODE_W}
				height={NODE_H}
				rx={7}
				fill={bgColor}
				stroke={borderColor}
				strokeWidth={isFlashing ? 2 : isHovered ? 2 : 1.5}
				animate={{
					fill: bgColor,
					stroke: borderColor,
				}}
				transition={{ duration: 0.25 }}
			/>
			{/* Click area for setState */}
			<foreignObject x={rx} y={ry} width={NODE_W} height={NODE_H}>
				<button
					type="button"
					onClick={() => onClickSetState(id)}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						width: "100%",
						cursor: "pointer",
						background: "transparent",
						border: "none",
						padding: 0,
					}}
				>
					<span
						style={{
							fontFamily: "monospace",
							fontSize: 12,
							fontWeight: 700,
							color: textColor,
							userSelect: "none",
						}}
					>
						{label}
					</span>
				</button>
			</foreignObject>

			{/* Flash pulse ring */}
			{isFlashing && (
				<motion.rect
					x={rx - 3}
					y={ry - 3}
					width={NODE_W + 6}
					height={NODE_H + 6}
					rx={10}
					fill="none"
					stroke="#f97316"
					strokeWidth={1.5}
					initial={{ opacity: 1, scale: 1 }}
					animate={{ opacity: 0, scale: 1.15 }}
					transition={{
						duration: 0.6,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeOut",
					}}
				/>
			)}
			{/* Hover glow effect */}
			{isHovered && !isFlashing && (
				<motion.rect
					x={rx - 2}
					y={ry - 2}
					width={NODE_W + 4}
					height={NODE_H + 4}
					rx={9}
					fill="none"
					stroke={borderColor}
					strokeWidth={1}
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.4 }}
					transition={{ duration: 0.2 }}
				/>
			)}
			{/* Skipped indicator */}
			{isSkipped && (
				<text
					x={x}
					y={ry - 4}
					textAnchor="middle"
					fontSize={8}
					fill="#3b82f6"
					fontFamily="monospace"
				>
					skipped ✓
				</text>
			)}
		</motion.g>
	);
}

// ─── Main Demo ────────────────────────────────────────────────────────────────

type FlashPhase = "idle" | "running";

export function RerenderPropagationDemo() {
	const [memoized, setMemoized] = useState<Set<string>>(new Set());
	const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
	const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
	const [phase, setPhase] = useState<FlashPhase>("idle");
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleSetState = useCallback(
		(nodeId: string) => {
			if (phase === "running") return;
			if (timeoutRef.current) clearTimeout(timeoutRef.current);

			// Include the clicked node itself in re-render (React re-renders the component that calls setState)
			const subtree = getSubtreeIds(nodeId, TREE);
			const willFlash = new Set(subtree.filter((id) => !memoized.has(id)));
			const willSkip = new Set(
				subtree.filter((id) => memoized.has(id) && id !== nodeId),
			);

			setPhase("running");
			setFlashingIds(willFlash);
			setSkippedIds(willSkip);

			timeoutRef.current = setTimeout(() => {
				setFlashingIds(new Set());
				setSkippedIds(new Set());
				setPhase("idle");
			}, 1800);
		},
		[phase, memoized],
	);

	const handleToggleMemo = useCallback((nodeId: string) => {
		setMemoized((prev) => {
			const next = new Set(prev);
			if (next.has(nodeId)) {
				next.delete(nodeId);
			} else {
				next.add(nodeId);
			}
			return next;
		});
	}, []);

	const nodeById = Object.fromEntries(NORMALISED_LAYOUT.map((n) => [n.id, n]));

	return (
		<DemoSection
			title="Demo 1: Re-render Propagation Tree"
			description="Interactive visualization showing how React re-renders propagate through the component tree."
		>
			{/* How to Use */}
			<div className="mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
				<div className="text-xs font-semibold text-violet-300 mb-2 flex items-center gap-2">
					<span>💡</span>
					How to Use
				</div>
				<div className="text-xs text-violet-200/80 space-y-1.5">
					<p>
						<strong className="text-violet-200">1. Click any component</strong>{" "}
						in the tree below to simulate setState() being called
					</p>
					<p>
						<strong className="text-violet-200">
							2. Toggle React.memo checkboxes
						</strong>{" "}
						to see how memoization blocks unnecessary re-renders
					</p>
				</div>
			</div>

			{/* Memo Control Panel */}
			<div className="mb-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
				<div className="text-xs font-semibold text-zinc-300 mb-3">
					React.memo Controls
				</div>
				<div className="flex flex-wrap gap-3">
					{NORMALISED_LAYOUT.map((node) => (
						<label
							key={node.id}
							className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all cursor-pointer ${
								memoized.has(node.id)
									? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300"
									: "bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
							}`}
						>
							<input
								type="checkbox"
								checked={memoized.has(node.id)}
								onChange={() => handleToggleMemo(node.id)}
								className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-900 checked:bg-indigo-500 checked:border-indigo-500 cursor-pointer"
							/>
							<span className="text-xs font-mono font-semibold">
								{node.label}
								{node.id !== node.label && (
									<span className="text-zinc-600 ml-1">#{node.id}</span>
								)}
							</span>
						</label>
					))}
				</div>
			</div>

			{/* Legend */}
			<div className="mb-4 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800">
				<div className="text-[10px] font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
					Legend
				</div>
				<div className="flex flex-wrap gap-4 text-xs">
					{[
						{ color: "#f97316", label: "Re-rendering (orange flash)" },
						{ color: "#6366f1", label: "React.memo enabled (indigo)" },
						{ color: "#3b82f6", label: "Re-render skipped (blue)" },
					].map(({ color, label }) => (
						<div
							key={label}
							className="flex items-center gap-1.5 text-zinc-400"
						>
							<span
								className="w-3 h-3 rounded-sm border-2"
								style={{ borderColor: color, backgroundColor: `${color}22` }}
							/>
							{label}
						</div>
					))}
				</div>
			</div>

			{/* SVG Tree */}
			<div className="overflow-x-auto">
				<svg
					viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
					width="100%"
					style={{
						minWidth: SVG_WIDTH,
						maxWidth: 600,
						display: "block",
						margin: "0 auto",
					}}
					aria-label="React component tree diagram"
					role="img"
				>
					{/* Edges */}
					{NORMALISED_LAYOUT.filter((n) => n.parentId !== null).map((n) => {
						const parent = nodeById[n.parentId as string];
						if (!parent) return null;
						return (
							<line
								key={`${n.parentId}-${n.id}`}
								x1={parent.x}
								y1={parent.y + NODE_H / 2}
								x2={n.x}
								y2={n.y - NODE_H / 2}
								stroke="#3f3f46"
								strokeWidth={1.5}
							/>
						);
					})}

					{/* Nodes */}
					{NORMALISED_LAYOUT.map((n) => (
						<SvgNode
							key={n.id}
							layout={n}
							isFlashing={flashingIds.has(n.id)}
							isMemoized={memoized.has(n.id)}
							isSkipped={skippedIds.has(n.id)}
							onClickSetState={handleSetState}
						/>
					))}
				</svg>
			</div>

			{/* Callout */}
			<AnimatePresence>
				{phase === "running" && (
					<motion.div
						key="callout"
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm text-orange-300"
					>
						<strong>Re-rendering: </strong>
						{flashingIds.size} component{flashingIds.size !== 1 ? "s" : ""}{" "}
						re-render
						{skippedIds.size > 0 && (
							<span className="ml-2 text-blue-300">
								· <strong>{skippedIds.size}</strong> memo-skipped
							</span>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Key insight */}
			<div className="mt-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-400 space-y-1">
				<p>
					<span className="text-orange-400 font-semibold">
						Default (no memo):
					</span>{" "}
					When a parent re-renders, React re-executes every child component
					function in its subtree — regardless of whether props changed.
				</p>
				<p>
					<span className="text-indigo-400 font-semibold">React.memo:</span>{" "}
					Wraps a component in a shallow prop comparison. If none of the props
					changed since last render, React reuses the previous output and skips
					the re-render.
				</p>
			</div>
		</DemoSection>
	);
}
