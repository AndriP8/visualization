import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StackValue {
	label: string;
	value: string;
	kind: "primitive" | "ref";
	refTo?: string; // id of heap object
}

interface StackFrame {
	id: string;
	label: string;
	color: string;
	values: StackValue[];
}

interface HeapObject {
	id: string;
	label: string;
	color: string;
	x: number; // 0–1 relative positioning
	y: number;
	properties: string[];
}

interface Step {
	highlightLine: number;
	description: string;
	stack: StackFrame[];
	heap: HeapObject[];
}

// ─── Code ─────────────────────────────────────────────────────────────────────

const CODE = `function greet(name) {
  const prefix = "Hello, "; // ref → heap string
  const msg = buildMsg(prefix, name);
  return msg;
}

function buildMsg(a, b) {
  const result = { text: a + b }; // heap object
  const len = result.text.length;  // number (stack)
  return result;
}

const user = { name: "Alice" };   // heap object
greet(user.name);`;

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
	{
		highlightLine: -1,
		description:
			"Program starts. Call stack is empty, heap is empty. We're about to allocate the first object.",
		stack: [],
		heap: [],
	},
	{
		highlightLine: 12,
		description:
			"Global frame executes. `user` is a heap object — the stack stores a reference (pointer) to it, not the object itself. Try to spot the arrow pointing from the stack to the heap!",
		stack: [
			{
				id: "global",
				label: "global",
				color: "#6366f1",
				values: [
					{ label: "user", value: "ref →", kind: "ref", refTo: "user_obj" },
				],
			},
		],
		heap: [
			{
				id: "user_obj",
				label: "{ name: 'Alice' }",
				color: "#6366f1",
				x: 0.25,
				y: 0.25,
				properties: ["name: 'Alice'"],
			},
		],
	},
	{
		highlightLine: 13,
		description:
			"`greet()` is called. Its stack frame is pushed. `name` is a string — strings are primitives in JS but V8 stores their data on the heap; the stack holds a value reference. `prefix` also refs a heap string.",
		stack: [
			{
				id: "global",
				label: "global",
				color: "#6366f1",
				values: [
					{ label: "user", value: "ref →", kind: "ref", refTo: "user_obj" },
				],
			},
			{
				id: "greet",
				label: "greet()",
				color: "#8b5cf6",
				values: [
					{ label: "name", value: "ref →", kind: "ref", refTo: "str_alice" },
					{ label: "prefix", value: "ref →", kind: "ref", refTo: "str_hello" },
				],
			},
		],
		heap: [
			{
				id: "user_obj",
				label: "{ name: 'Alice' }",
				color: "#6366f1",
				x: 0.25,
				y: 0.2,
				properties: ["name: 'Alice'"],
			},
			{
				id: "str_alice",
				label: '"Alice"',
				color: "#8b5cf6",
				x: 0.72,
				y: 0.2,
				properties: [],
			},
			{
				id: "str_hello",
				label: '"Hello, "',
				color: "#8b5cf6",
				x: 0.72,
				y: 0.6,
				properties: [],
			},
		],
	},
	{
		highlightLine: 7,
		description:
			"`buildMsg()` is called. A new heap object `{ text: ... }` is allocated. `len` is a plain number — numbers fit directly in the stack frame as a Smi (small integer) value in V8.",
		stack: [
			{
				id: "global",
				label: "global",
				color: "#6366f1",
				values: [
					{ label: "user", value: "ref →", kind: "ref", refTo: "user_obj" },
				],
			},
			{
				id: "greet",
				label: "greet()",
				color: "#8b5cf6",
				values: [
					{ label: "name", value: "ref →", kind: "ref", refTo: "str_alice" },
					{ label: "prefix", value: "ref →", kind: "ref", refTo: "str_hello" },
				],
			},
			{
				id: "buildMsg",
				label: "buildMsg()",
				color: "#a78bfa",
				values: [
					{ label: "result", value: "ref →", kind: "ref", refTo: "result_obj" },
					{ label: "len", value: "13", kind: "primitive" },
				],
			},
		],
		heap: [
			{
				id: "user_obj",
				label: "{ name: 'Alice' }",
				color: "#6366f1",
				x: 0.2,
				y: 0.15,
				properties: ["name: 'Alice'"],
			},
			{
				id: "str_alice",
				label: '"Alice"',
				color: "#8b5cf6",
				x: 0.65,
				y: 0.15,
				properties: [],
			},
			{
				id: "str_hello",
				label: '"Hello, "',
				color: "#8b5cf6",
				x: 0.65,
				y: 0.5,
				properties: [],
			},
			{
				id: "result_obj",
				label: "{ text: … }",
				color: "#a78bfa",
				x: 0.2,
				y: 0.65,
				properties: ["text: 'Hello, Alice'"],
			},
		],
	},
	{
		highlightLine: 9,
		description:
			"`buildMsg()` returns. Its frame is popped. Note that `result_obj` on the heap still exists — it is now only referenced by `greet()`'s `msg` variable.",
		stack: [
			{
				id: "global",
				label: "global",
				color: "#6366f1",
				values: [
					{ label: "user", value: "ref →", kind: "ref", refTo: "user_obj" },
				],
			},
			{
				id: "greet",
				label: "greet()",
				color: "#8b5cf6",
				values: [
					{ label: "name", value: "ref →", kind: "ref", refTo: "str_alice" },
					{ label: "prefix", value: "ref →", kind: "ref", refTo: "str_hello" },
					{ label: "msg", value: "ref →", kind: "ref", refTo: "result_obj" },
				],
			},
		],
		heap: [
			{
				id: "user_obj",
				label: "{ name: 'Alice' }",
				color: "#6366f1",
				x: 0.2,
				y: 0.15,
				properties: ["name: 'Alice'"],
			},
			{
				id: "str_alice",
				label: '"Alice"',
				color: "#8b5cf6",
				x: 0.65,
				y: 0.15,
				properties: [],
			},
			{
				id: "str_hello",
				label: '"Hello, "',
				color: "#8b5cf6",
				x: 0.65,
				y: 0.5,
				properties: [],
			},
			{
				id: "result_obj",
				label: "{ text: … }",
				color: "#a78bfa",
				x: 0.2,
				y: 0.65,
				properties: ["text: 'Hello, Alice'"],
			},
		],
	},
	{
		highlightLine: 3,
		description:
			"`greet()` returns and is popped. Its local variables (`name`, `prefix`, `msg`) vanish — `str_hello`, `str_alice`, and `result_obj` lose all references and become GC-eligible. `user_obj` stays alive because the global frame still holds `user` — it's the only remaining root reference.",
		stack: [
			{
				id: "global",
				label: "global",
				color: "#6366f1",
				values: [
					{ label: "user", value: "ref →", kind: "ref", refTo: "user_obj" },
				],
			},
		],
		heap: [
			{
				id: "user_obj",
				label: "{ name: 'Alice' }",
				color: "#6366f1",
				x: 0.2,
				y: 0.15,
				properties: ["name: 'Alice'"],
			},
			{
				id: "str_alice",
				label: '"Alice" ☠️',
				color: "#52525b",
				x: 0.65,
				y: 0.15,
				properties: [],
			},
			{
				id: "str_hello",
				label: '"Hello, " ☠️',
				color: "#52525b",
				x: 0.65,
				y: 0.5,
				properties: [],
			},
			{
				id: "result_obj",
				label: "{ text: … } ☠️",
				color: "#52525b",
				x: 0.2,
				y: 0.65,
				properties: [],
			},
		],
	},
];

// ─── Heap Panel ───────────────────────────────────────────────────────────────

const W = 300;
const H = 280;
const R = 28;

function HeapPanel({
	heap,
	stack,
}: {
	heap: HeapObject[];
	stack: StackFrame[];
}) {
	// Collect all active {from→to} reference pairs
	const arrows: Array<{ fromId: string; toId: string; color: string }> = [];
	for (const frame of stack) {
		for (const val of frame.values) {
			if (val.kind === "ref" && val.refTo) {
				arrows.push({ fromId: frame.id, toId: val.refTo, color: frame.color });
			}
		}
	}

	const heapById = Object.fromEntries(heap.map((h) => [h.id, h]));

	return (
		<svg
			width="100%"
			viewBox={`0 0 ${W} ${H}`}
			className="rounded-lg bg-zinc-900 border border-zinc-800"
			role="img"
			aria-label="Heap visualization"
		>
			<title>Heap visualization</title>
			{/* Grid */}
			<defs>
				<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
					<path
						d="M 20 0 L 0 0 0 20"
						fill="none"
						stroke="#27272a"
						strokeWidth="0.5"
					/>
				</pattern>
			</defs>
			<rect width={W} height={H} fill="url(#grid)" />

			{/* Heap objects */}
			<AnimatePresence>
				{heap.map((obj) => {
					const cx = obj.x * W;
					const cy = obj.y * H;
					return (
						<motion.g
							key={obj.id}
							initial={{ opacity: 0, scale: 0.3 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.3 }}
							transition={{ duration: 0.4 }}
							style={{ transformOrigin: `${cx}px ${cy}px` }}
						>
							<circle
								cx={cx}
								cy={cy}
								r={R}
								fill={`${obj.color}22`}
								stroke={obj.color}
								strokeWidth={1.5}
							/>
							<foreignObject x={cx - R} y={cy - R} width={R * 2} height={R * 2}>
								<div
									style={{
										width: "100%",
										height: "100%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										textAlign: "center",
										fontSize: "9px",
										fontFamily: "monospace",
										color: obj.color,
										padding: "2px",
										lineHeight: 1.2,
									}}
								>
									{obj.label}
								</div>
							</foreignObject>
						</motion.g>
					);
				})}
			</AnimatePresence>

			{/* Reference arrows (dashed) — from outside the SVG frame representing the stack */}
			{arrows.map(({ fromId, toId, color }) => {
				const target = heapById[toId];
				if (!target) return null;
				const tx = target.x * W;
				const ty = target.y * H;
				// Arrow enters from the left edge
				const sx = 0;
				const sy = ty;
				return (
					<motion.g
						key={`${fromId}-${toId}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.4 }}
					>
						<line
							x1={sx}
							y1={sy}
							x2={tx - R - 4}
							y2={ty}
							stroke={color}
							strokeWidth={1.5}
							strokeDasharray="4 3"
							markerEnd={`url(#arrow-${fromId}-${toId})`}
						/>
						<defs>
							<marker
								id={`arrow-${fromId}-${toId}`}
								markerWidth="6"
								markerHeight="6"
								refX="3"
								refY="3"
								orient="auto"
							>
								<path d="M0,0 L6,3 L0,6 Z" fill={color} />
							</marker>
						</defs>
					</motion.g>
				);
			})}

			<text
				x={W / 2}
				y={H - 6}
				textAnchor="middle"
				fontSize={9}
				fill="#52525b"
				fontFamily="monospace"
			>
				HEAP
			</text>
		</svg>
	);
}

// ─── Stack Panel ──────────────────────────────────────────────────────────────

function StackPanel({ stack }: { stack: StackFrame[] }) {
	return (
		<div className="flex flex-col gap-2 min-h-70 justify-end">
			<AnimatePresence initial={false}>
				{stack.map((frame) => (
					<motion.div
						key={frame.id}
						initial={{ opacity: 0, y: -20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -20, scale: 0.95 }}
						transition={{ duration: 0.3 }}
						className="rounded-lg border p-3"
						style={{
							borderColor: frame.color,
							backgroundColor: `${frame.color}11`,
						}}
					>
						<div
							className="text-xs font-bold font-mono mb-1.5"
							style={{ color: frame.color }}
						>
							{frame.label}
						</div>
						<div className="space-y-0.5">
							{frame.values.map((v) => (
								<div
									key={v.label}
									className="flex justify-between text-xs font-mono"
								>
									<span className="text-zinc-400">{v.label}</span>
									<span
										className="font-semibold"
										style={{
											color: v.kind === "ref" ? frame.color : "#d4d4d8",
										}}
									>
										{v.value}
									</span>
								</div>
							))}
						</div>
					</motion.div>
				))}
			</AnimatePresence>
			{stack.length === 0 && (
				<div className="text-center text-zinc-600 text-xs font-mono py-8">
					(empty)
				</div>
			)}
			<div className="text-center text-zinc-600 text-xs font-mono border-t border-zinc-700 pt-1">
				STACK BOTTOM
			</div>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StackHeapExplorerDemo() {
	const [step, setStep] = useState(0);
	const current = STEPS[step];

	return (
		<DemoSection
			title="Demo 1: Stack vs. Heap Explorer"
			description="Step through a function call sequence and watch how primitives live on the stack frame while objects live on the heap — referenced by pointers."
		>
			{/* Stack vs Heap intro */}
			<div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4">
					<div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">
						Stack
					</div>
					<ul className="text-xs text-zinc-400 space-y-1 leading-relaxed">
						<li>Fixed-size memory region per thread</li>
						<li>LIFO — frames push/pop with function calls</li>
						<li>
							Stores primitives (numbers, booleans) and pointers to heap objects
						</li>
						<li>Auto-freed when a frame is popped — no GC needed</li>
					</ul>
				</div>
				<div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4">
					<div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
						Heap
					</div>
					<ul className="text-xs text-zinc-400 space-y-1 leading-relaxed">
						<li>Dynamic, unbounded memory region</li>
						<li>
							Stores objects, arrays, and Strings{" "}
							<a
								href="https://v8.dev/blog/pointer-compression"
								target="_blank"
								rel="noopener"
								className="underline text-blue-400"
							>
								(even "primitive" strings in V8)
							</a>
						</li>
						<li>Objects outlive the frame that created them</li>
						<li>Managed by the Garbage Collector (GC) via reachability</li>
					</ul>
				</div>
			</div>

			{/* Code + description */}
			<div className="mb-6 flex flex-col lg:flex-row gap-4">
				<div className="flex-1 min-w-0">
					<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
						Source Code
					</div>
					<ShikiCode
						code={CODE}
						language="javascript"
						highlightLine={current.highlightLine}
					/>
				</div>
				<div className="lg:w-80 flex flex-col gap-3">
					<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
						Key Insight
					</div>
					<div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/80 leading-relaxed">
						⚠️ In V8, <strong>strings are heap-allocated</strong> even though
						they behave as primitives. The stack holds a{" "}
						<em>value reference</em> (tagged pointer). Numbers (Smi) and
						booleans fit directly in the stack frame as immediate values.
					</div>
					<motion.div
						key={step}
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-sm text-violet-300 leading-relaxed flex-1"
					>
						{current.description}
					</motion.div>
				</div>
			</div>

			{/* Visualization panels */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
				<div>
					<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
						Call Stack (top is newest)
					</div>
					<StackPanel stack={current.stack} />
				</div>
				<div>
					<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
						Heap — dashed lines are reference arrows from stack
					</div>
					<HeapPanel heap={current.heap} stack={current.stack} />
				</div>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={() => setStep((s) => Math.max(0, s - 1))}
					disabled={step === 0}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					← Back
				</button>
				<button
					type="button"
					onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
					disabled={step === STEPS.length - 1}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					Next →
				</button>
				<button
					type="button"
					onClick={() => setStep(0)}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors"
				>
					↺ Reset
				</button>
				<span className="text-xs text-zinc-600 ml-auto">
					Step {step + 1} / {STEPS.length}
				</span>
			</div>
		</DemoSection>
	);
}
