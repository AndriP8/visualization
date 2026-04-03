import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

// ── B-Tree implementation (order 3: max 2 keys per node) ─────────────────────
const ORDER = 3; // max children; max keys = ORDER - 1 = 2

interface BNode {
	id: string;
	keys: number[];
	children: BNode[];
}

let nodeCounter = 0;
function makeNode(keys: number[] = [], children: BNode[] = []): BNode {
	return { id: `n${nodeCounter++}`, keys, children };
}

function isLeaf(node: BNode): boolean {
	return node.children.length === 0;
}

// Clone tree (deep) — to get new references for React state
function cloneNode(node: BNode): BNode {
	return {
		id: node.id,
		keys: [...node.keys],
		children: node.children.map(cloneNode),
	};
}

// Insert into B-Tree; returns new root and the path of node ids visited
function insertBTree(
	root: BNode,
	value: number,
): { root: BNode; path: string[]; splitOccurred: boolean } {
	const newRoot = cloneNode(root);
	const path: string[] = [];
	let splitOccurred = false;

	function insertNonFull(node: BNode, val: number) {
		path.push(node.id);
		if (isLeaf(node)) {
			// Insert in sorted order
			const idx = node.keys.findIndex((k) => k > val);
			if (idx === -1) {
				node.keys.push(val);
			} else {
				node.keys.splice(idx, 0, val);
			}
		} else {
			// Find child to recurse into
			let i = node.keys.length - 1;
			while (i >= 0 && val < node.keys[i]) i--;
			i++;
			const child = cloneNode(node.children[i]);
			node.children[i] = child;
			insertNonFull(child, val);
			// Split child if overflow
			if (child.keys.length >= ORDER) {
				splitOccurred = true;
				splitChild(node, i, child);
			}
		}
	}

	function splitChild(parent: BNode, _childIndex: number, child: BNode) {
		const mid = Math.floor((ORDER - 1) / 2);
		const midKey = child.keys[mid];
		const rightNode = makeNode(
			child.keys.slice(mid + 1),
			child.children.slice(mid + 1),
		);
		child.keys = child.keys.slice(0, mid);
		child.children = child.children.slice(0, mid + 1);

		// Insert midKey into parent
		const insertAt = parent.keys.findIndex((k) => k > midKey);
		if (insertAt === -1) {
			parent.keys.push(midKey);
			parent.children.push(rightNode);
		} else {
			parent.keys.splice(insertAt, 0, midKey);
			parent.children.splice(insertAt + 1, 0, rightNode);
		}
	}

	insertNonFull(newRoot, value);

	// If root is full, split it
	if (newRoot.keys.length >= ORDER) {
		splitOccurred = true;
		const mid = Math.floor((ORDER - 1) / 2);
		const midKey = newRoot.keys[mid];
		const leftNode = makeNode(
			newRoot.keys.slice(0, mid),
			newRoot.children.slice(0, mid + 1),
		);
		const rightNode = makeNode(
			newRoot.keys.slice(mid + 1),
			newRoot.children.slice(mid + 1),
		);
		const newRootNode = makeNode([midKey], [leftNode, rightNode]);
		return { root: newRootNode, path, splitOccurred };
	}

	return { root: newRoot, path, splitOccurred };
}

// ── Tree layout computation ───────────────────────────────────────────────────
interface LayoutNode {
	node: BNode;
	x: number;
	y: number;
	parentX?: number;
	parentY?: number;
}

const NODE_W = 80;
const NODE_H = 36;
const LEVEL_H = 70;

function computeLayout(root: BNode): LayoutNode[] {
	const result: LayoutNode[] = [];

	function traverse(
		node: BNode,
		depth: number,
		leftOffset: number,
		parentX?: number,
		parentY?: number,
	): number {
		if (isLeaf(node)) {
			const x = leftOffset * (NODE_W + 20) + NODE_W / 2;
			const y = depth * LEVEL_H + NODE_H / 2;
			result.push({ node, x, y, parentX, parentY });
			return leftOffset + 1;
		}
		const startX = leftOffset;
		let offset = leftOffset;
		for (const child of node.children) {
			offset = traverse(child, depth + 1, offset, undefined, undefined);
		}
		const x =
			startX * (NODE_W + 20) +
			NODE_W / 2 +
			((offset - startX) * (NODE_W + 20) - (NODE_W + 20)) / 2;
		const y = depth * LEVEL_H + NODE_H / 2;
		result.push({ node, x, y, parentX, parentY });
		// Patch children parentX/parentY
		for (let i = 0; i < node.children.length; i++) {
			const childLayout = result.find((r) => r.node.id === node.children[i].id);
			if (childLayout) {
				childLayout.parentX = x;
				childLayout.parentY = y;
			}
		}
		return offset;
	}

	traverse(root, 0, 0);
	return result;
}

// ── SVG Tree renderer ─────────────────────────────────────────────────────────
function TreeSVG({
	root,
	highlightPath,
	splitOccurred,
}: {
	root: BNode;
	highlightPath: string[];
	splitOccurred: boolean;
}) {
	const layout = computeLayout(root);
	const maxX = Math.max(...layout.map((l) => l.x)) + NODE_W / 2 + 20;
	const maxY = Math.max(...layout.map((l) => l.y)) + NODE_H / 2 + 20;

	return (
		<svg
			viewBox={`-10 -10 ${maxX + 20} ${maxY + 20}`}
			className="w-full overflow-visible"
			style={{ minHeight: Math.max(120, maxY + 20) }}
			role="img"
			aria-label="B-Tree diagram"
		>
			<title>B-Tree diagram</title>
			{/* Edges */}
			{layout.map(({ node, x, y, parentX, parentY }) =>
				parentX !== undefined && parentY !== undefined ? (
					<motion.line
						key={`edge-${node.id}`}
						x1={parentX}
						y1={parentY + NODE_H / 2}
						x2={x}
						y2={y - NODE_H / 2}
						stroke="var(--svg-text-muted)"
						strokeWidth={1.5}
						initial={{ pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{ duration: 0.3 }}
						aria-label={`edge to node ${node.id}`}
					/>
				) : null,
			)}

			{/* Nodes */}
			{layout.map(({ node, x, y }) => {
				const isHighlighted = highlightPath.includes(node.id);
				const isLeafNode = isLeaf(node);
				const bg = isHighlighted
					? splitOccurred
						? "#14532d"
						: "#134e3e"
					: isLeafNode
						? "#1c1917"
						: "var(--svg-bg)";
				const stroke = isHighlighted
					? splitOccurred
						? "#22c55e"
						: "#14b8a6"
					: "var(--svg-border)";

				return (
					<motion.g
						key={node.id}
						layout
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ type: "spring", stiffness: 300, damping: 25 }}
					>
						<motion.rect
							x={x - NODE_W / 2}
							y={y - NODE_H / 2}
							width={NODE_W}
							height={NODE_H}
							rx={8}
							fill={bg}
							stroke={stroke}
							strokeWidth={isHighlighted ? 2 : 1}
							animate={{ fill: bg, stroke }}
							transition={{ duration: 0.3 }}
						/>
						<text
							x={x}
							y={y + 5}
							textAnchor="middle"
							fontSize={11}
							fontFamily="monospace"
							fill={isHighlighted ? "#5eead4" : "var(--svg-text)"}
						>
							{node.keys.join(", ")}
						</text>
						{isLeafNode && (
							<text
								x={x}
								y={y - NODE_H / 2 - 4}
								textAnchor="middle"
								fontSize={8}
								fill="var(--svg-text-muted)"
							>
								leaf
							</text>
						)}
					</motion.g>
				);
			})}
		</svg>
	);
}

// ── Main component ────────────────────────────────────────────────────────────
const PRESET_VALUES = [10, 20, 5, 15, 30, 25, 8, 40, 3, 35];

export function BTreeExplorerDemo() {
	const [root, setRoot] = useState<BNode>(() => makeNode());
	const [input, setInput] = useState("");
	const [highlightPath, setHighlightPath] = useState<string[]>([]);
	const [lastSplit, setLastSplit] = useState(false);
	const [insertLog, setInsertLog] = useState<
		{ value: number; split: boolean }[]
	>([]);
	const [isAnimating, setIsAnimating] = useState(false);
	const [presetIdx, setPresetIdx] = useState(0);
	const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
		},
		[],
	);

	const doInsert = useCallback(
		(val: number) => {
			if (isAnimating) return;
			if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
			setIsAnimating(true);
			const { root: newRoot, path, splitOccurred } = insertBTree(root, val);
			setRoot(newRoot);
			setHighlightPath(path);
			setLastSplit(splitOccurred);
			setInsertLog((prev) => [{ value: val, split: splitOccurred }, ...prev]);
			animTimeoutRef.current = setTimeout(() => {
				setHighlightPath([]);
				setIsAnimating(false);
			}, 1200);
		},
		[root, isAnimating],
	);

	const handleInsert = useCallback(() => {
		const val = Number.parseInt(input, 10);
		if (Number.isNaN(val)) return;
		doInsert(val);
		setInput("");
	}, [input, doInsert]);

	const insertNext = useCallback(() => {
		if (presetIdx >= PRESET_VALUES.length) return;
		doInsert(PRESET_VALUES[presetIdx]);
		setPresetIdx((p) => p + 1);
	}, [presetIdx, doInsert]);

	const resetTree = useCallback(() => {
		// Don't reset nodeCounter — IDs only need to be unique, not sequential from 0.
		// Resetting to 0 causes key collisions in React StrictMode (double invoke).
		if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
		setRoot(makeNode());
		setHighlightPath([]);
		setLastSplit(false);
		setInsertLog([]);
		setPresetIdx(0);
		setInput("");
		setIsAnimating(false);
	}, []);

	const treeDepth = (node: BNode): number => {
		if (isLeaf(node)) return 1;
		return 1 + Math.max(...node.children.map(treeDepth));
	};

	return (
		<DemoSection
			title="Demo 2: B-Tree Structure Explorer"
			description="Insert values one at a time. Observe the traversal path, and watch the key 'aha moment': node splitting when a node overflows (order 3 = max 2 keys)."
		>
			{/* Controls */}
			<div className="flex flex-wrap gap-2 mb-4 items-center">
				<input
					type="number"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleInsert()}
					placeholder="Enter number…"
					className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-secondary text-sm text-text-secondary placeholder-text-faint focus:outline-none focus:border-teal-500/60 w-36"
				/>
				<button
					type="button"
					onClick={handleInsert}
					disabled={isAnimating || !input}
					className="px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-600/20 text-accent-teal border border-teal-500/30 hover:bg-teal-600/30 transition-colors disabled:opacity-40"
				>
					Insert
				</button>
				<button
					type="button"
					onClick={insertNext}
					disabled={isAnimating || presetIdx >= PRESET_VALUES.length}
					className="px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600/20 text-accent-violet border border-violet-500/30 hover:bg-violet-600/30 transition-colors disabled:opacity-40"
				>
					▶ Insert Next ({PRESET_VALUES[presetIdx] ?? "done"})
				</button>
				<button
					type="button"
					onClick={resetTree}
					className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-tertiary/50 text-text-secondary border border-border-tertiary hover:bg-surface-tertiary transition-colors"
				>
					↺ Reset
				</button>
				<div className="flex gap-3 text-xs text-text-muted ml-auto">
					<span>
						Depth:{" "}
						<strong className="text-text-secondary">{treeDepth(root)}</strong>
					</span>
					<span>
						Splits:{" "}
						<strong className="text-text-secondary">
							{insertLog.filter((l) => l.split).length}
						</strong>
					</span>
				</div>
			</div>

			{/* Split badge */}
			<AnimatePresence mode="wait">
				{lastSplit && highlightPath.length > 0 && (
					<motion.div
						key="split-msg"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0 }}
						className="mb-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-accent-green text-xs"
					>
						🌿 <strong>Node split!</strong> Middle key promoted to parent — tree
						stays balanced. This is what keeps B-Trees at O(log n) even after
						many inserts.
					</motion.div>
				)}
			</AnimatePresence>

			{/* Tree SVG */}
			<div className="rounded-xl border border-border-secondary/50 bg-surface-primary p-4 mb-4 overflow-x-auto">
				<TreeSVG
					root={root}
					highlightPath={highlightPath}
					splitOccurred={lastSplit}
				/>
				{root.keys.length === 0 && (
					<p className="text-center text-xs text-text-faint mt-2">
						Tree is empty — insert a value to begin
					</p>
				)}
			</div>

			{/* Insert log */}
			<div className="flex gap-3 flex-wrap text-xs font-mono">
				{insertLog.map((entry, i) => (
					<motion.span
						key={`${entry.value}-${i}`}
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						className={`px-2 py-0.5 rounded border ${
							entry.split
								? "bg-green-500/10 border-green-500/25 text-accent-green-soft"
								: "bg-surface-secondary border-border-secondary text-text-tertiary"
						}`}
					>
						{entry.value}
						{entry.split && " ✂"}
					</motion.span>
				))}
			</div>

			{/* Legend */}
			<div className="mt-4 p-3 rounded-lg bg-surface-secondary/30 border border-border-secondary/50 text-xs text-text-tertiary space-y-1">
				<p>
					<strong className="text-text-secondary">Order 3:</strong> max{" "}
					<strong className="text-accent-teal-soft">2 keys</strong> per node.
					When a 3rd key is inserted, the node{" "}
					<strong className="text-accent-green-soft">splits</strong> — the
					median key rises to the parent. If the root splits, the tree grows
					taller by one level.
				</p>
				<p>
					<span className="text-accent-teal-soft font-mono">← teal path</span> =
					traversal.{" "}
					<span className="text-accent-green-soft font-mono">✂ green</span> =
					split occurred.
				</p>
			</div>
		</DemoSection>
	);
}
