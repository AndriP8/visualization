import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import type { ActiveRegion, ExecutionStep } from "./types";

interface Snippet {
	name: string;
	code: string;
	lines: string[];
	steps: ExecutionStep[];
}

const SNIPPET_1: Snippet = {
	name: "Sync + Async Mix",
	code: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
	lines: [
		"console.log('1');",
		"setTimeout(() => console.log('2'), 0);",
		"Promise.resolve().then(() => console.log('3'));",
		"console.log('4');",
	],
	steps: [
		{
			callStack: [],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: [],
			activeRegion: null,
			description: "Program starts. All queues are empty.",
		},
		{
			callStack: [{ id: "log1", label: "console.log('1')", color: "#6366f1" }],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: ["1"],
			activeRegion: "callstack",
			description:
				"console.log('1') executes synchronously on the call stack. Output: 1",
			highlightLine: 0,
		},
		{
			callStack: [
				{ id: "setTimeout", label: "setTimeout(cb, 0)", color: "#f59e0b" },
			],
			webApis: [{ id: "timer1", label: "Timer (0ms)", remaining: "0ms" }],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: ["1"],
			activeRegion: "webapis",
			description:
				"setTimeout() is called — the timer is registered with Web APIs. The callback will be queued when the timer fires.",
			highlightLine: 1,
		},
		{
			callStack: [
				{
					id: "promise",
					label: "Promise.resolve().then(cb)",
					color: "#22d3ee",
				},
			],
			webApis: [],
			microtaskQueue: [
				{ id: "micro1", label: "() => log('3')", type: "microtask" },
			],
			macrotaskQueue: [
				{ id: "macro1", label: "() => log('2')", type: "macrotask" },
			],
			output: ["1"],
			activeRegion: "microtask",
			description:
				"Promise.resolve().then(cb) — the promise is already resolved, so the callback goes directly to the Microtask Queue. Meanwhile, the timer has fired and its callback moves to the Macrotask Queue.",
			highlightLine: 2,
		},
		{
			callStack: [{ id: "log4", label: "console.log('4')", color: "#6366f1" }],
			webApis: [],
			microtaskQueue: [
				{ id: "micro1", label: "() => log('3')", type: "microtask" },
			],
			macrotaskQueue: [
				{ id: "macro1", label: "() => log('2')", type: "macrotask" },
			],
			output: ["1", "4"],
			activeRegion: "callstack",
			description:
				"console.log('4') executes synchronously. Output: 4. The synchronous code is done.",
			highlightLine: 3,
		},
		{
			callStack: [
				{ id: "micro1-exec", label: "() => log('3')", color: "#22d3ee" },
			],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [
				{ id: "macro1", label: "() => log('2')", type: "macrotask" },
			],
			output: ["1", "4", "3"],
			activeRegion: "microtask",
			description:
				"Call stack is empty → Event Loop drains ALL microtasks first. The Promise callback runs. Output: 3",
		},
		{
			callStack: [
				{ id: "macro1-exec", label: "() => log('2')", color: "#f59e0b" },
			],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: ["1", "4", "3", "2"],
			activeRegion: "macrotask",
			description:
				"Microtask queue is empty → Event Loop picks ONE macrotask. The setTimeout callback runs. Output: 2",
		},
		{
			callStack: [],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: ["1", "4", "3", "2"],
			activeRegion: null,
			description:
				"Done! Final output: 1, 4, 3, 2. Key insight: microtasks (Promise.then) always run before macrotasks (setTimeout) when the call stack empties.",
		},
	],
};

const SNIPPET_2: Snippet = {
	name: "Nested Microtasks",
	code: `console.log('start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve()
  .then(() => {
    console.log('promise 1');
    return Promise.resolve();
  })
  .then(() => console.log('promise 2'));
console.log('end');`,
	lines: [
		"console.log('start');",
		"setTimeout(() => console.log('timeout'), 0);",
		"Promise.resolve()",
		"  .then(() => {",
		"    console.log('promise 1');",
		"    return Promise.resolve();",
		"  })",
		"  .then(() => console.log('promise 2'));",
		"console.log('end');",
	],
	steps: [
		{
			callStack: [],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: [],
			activeRegion: null,
			description: "Program starts.",
		},
		{
			callStack: [{ id: "logStart", label: "log('start')", color: "#6366f1" }],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: ["start"],
			activeRegion: "callstack",
			description: "console.log('start') runs synchronously. Output: start",
			highlightLine: 0,
		},
		{
			callStack: [{ id: "st", label: "setTimeout(cb, 0)", color: "#f59e0b" }],
			webApis: [{ id: "t1", label: "Timer (0ms)" }],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: ["start"],
			activeRegion: "webapis",
			description: "setTimeout registers a timer with Web APIs.",
			highlightLine: 1,
		},
		{
			callStack: [
				{
					id: "promiseSetup",
					label: "Promise.then(cb1).then(cb2)",
					color: "#22d3ee",
				},
			],
			webApis: [],
			microtaskQueue: [
				{ id: "m1", label: "cb1 (promise 1)", type: "microtask" },
			],
			macrotaskQueue: [
				{ id: "ma1", label: "() => log('timeout')", type: "macrotask" },
			],
			output: ["start"],
			activeRegion: "microtask",
			description:
				"The first .then() callback is queued as a microtask. The second .then() waits for the first. Timer callback moves to macrotask queue.",
			highlightLine: 2,
		},
		{
			callStack: [{ id: "logEnd", label: "log('end')", color: "#6366f1" }],
			webApis: [],
			microtaskQueue: [
				{ id: "m1", label: "cb1 (promise 1)", type: "microtask" },
			],
			macrotaskQueue: [
				{ id: "ma1", label: "() => log('timeout')", type: "macrotask" },
			],
			output: ["start", "end"],
			activeRegion: "callstack",
			description: "console.log('end') runs synchronously. Output: end",
			highlightLine: 8,
		},
		{
			callStack: [
				{ id: "m1-exec", label: "cb1 → log('promise 1')", color: "#22d3ee" },
			],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [
				{ id: "ma1", label: "() => log('timeout')", type: "macrotask" },
			],
			output: ["start", "end", "promise 1"],
			activeRegion: "microtask",
			description:
				"Stack empty → drain microtasks. cb1 runs, logs 'promise 1', and returns a new Promise — which queues cb2 as another microtask.",
		},
		{
			callStack: [
				{ id: "m2-exec", label: "cb2 → log('promise 2')", color: "#22d3ee" },
			],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [
				{ id: "ma1", label: "() => log('timeout')", type: "macrotask" },
			],
			output: ["start", "end", "promise 1", "promise 2"],
			activeRegion: "microtask",
			description:
				"Still draining microtasks! cb2 runs. Output: promise 2. This shows microtasks can spawn more microtasks and they ALL run before any macrotask.",
		},
		{
			callStack: [
				{ id: "ma1-exec", label: "() => log('timeout')", color: "#f59e0b" },
			],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: ["start", "end", "promise 1", "promise 2", "timeout"],
			activeRegion: "macrotask",
			description:
				"Microtask queue empty → pick one macrotask. setTimeout callback runs. Output: timeout",
		},
		{
			callStack: [],
			webApis: [],
			microtaskQueue: [],
			macrotaskQueue: [],
			output: ["start", "end", "promise 1", "promise 2", "timeout"],
			activeRegion: null,
			description:
				"Done! Output: start, end, promise 1, promise 2, timeout. Nested microtasks all drain before macrotasks get a turn.",
		},
	],
};

const SNIPPETS = [SNIPPET_1, SNIPPET_2];

const REGION_COLORS: Record<string, string> = {
	callstack: "#8b5cf6",
	webapis: "#f59e0b",
	microtask: "#22d3ee",
	macrotask: "#f97316",
	raf: "#34d399",
	render: "#ec4899",
};

function RegionBox({
	title,
	color,
	isActive,
	items,
	emptyText,
}: {
	title: string;
	color: string;
	isActive: boolean;
	items: { id: string; label: string }[];
	emptyText: string;
}) {
	return (
		<motion.div
			className="rounded-lg border p-3 min-h-25 transition-all"
			animate={{
				borderColor: isActive ? color : "#27272a",
				boxShadow: isActive ? `0 0 20px ${color}33` : "0 0 0px transparent",
			}}
			style={{ backgroundColor: `${color}08` }}
		>
			<div
				className="text-xs font-semibold uppercase tracking-wider mb-2"
				style={{ color }}
			>
				{title}
			</div>
			<AnimatePresence mode="popLayout">
				{items.length === 0 ? (
					<motion.div
						key="empty"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="text-xs text-zinc-600 font-mono"
					>
						{emptyText}
					</motion.div>
				) : (
					items.map((item) => (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, x: -10, scale: 0.9 }}
							animate={{ opacity: 1, x: 0, scale: 1 }}
							exit={{ opacity: 0, x: 10, scale: 0.9 }}
							transition={{ duration: 0.25 }}
							className="px-2 py-1.5 mb-1 rounded text-xs font-mono border"
							style={{
								borderColor: `${color}44`,
								backgroundColor: `${color}15`,
								color,
							}}
						>
							{item.label}
						</motion.div>
					))
				)}
			</AnimatePresence>
		</motion.div>
	);
}

const LOOP_LOGIC_STEPS = [
	{
		label: "Is call stack empty?",
		active: (r: ActiveRegion) => r === "callstack",
	},
	{
		label: "→ Drain ALL microtasks",
		active: (r: ActiveRegion) => r === "microtask",
	},
	{
		label: "→ Pick ONE macrotask",
		active: (r: ActiveRegion) => r === "macrotask",
	},
	{ label: "→ Repeat", active: (_r: ActiveRegion) => false },
];

export function EventLoopSimDemo() {
	const [snippetIndex, setSnippetIndex] = useState(0);
	const [step, setStep] = useState(0);

	const snippet = SNIPPETS[snippetIndex];
	const current = snippet.steps[step];

	const next = () => {
		if (step < snippet.steps.length - 1) setStep(step + 1);
	};
	const prev = () => {
		if (step > 0) setStep(step - 1);
	};
	const reset = () => setStep(0);

	return (
		<DemoSection
			title="Demo 2: Event Loop Simulation"
			description="Step through real code and see how the Call Stack, Web APIs, Microtask Queue, and Macrotask Queue interact."
		>
			{/* Snippet picker */}
			<div className="flex gap-2 mb-5">
				{SNIPPETS.map((s, i) => (
					<button
						key={s.name}
						type="button"
						onClick={() => {
							setSnippetIndex(i);
							setStep(0);
						}}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
							i === snippetIndex
								? "bg-violet-500/20 text-violet-300 border-violet-500/30"
								: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
						}`}
					>
						{s.name}
					</button>
				))}
			</div>

			<div className="flex flex-col xl:flex-row gap-6">
				{/* Left: Code + Output */}
				<div className="xl:w-1/3 space-y-4">
					<div>
						<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
							Code
						</div>
						<ShikiCode
							code={snippet.code}
							language="javascript"
							highlightLine={current.highlightLine}
						/>
					</div>

					<div>
						<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
							Console Output
						</div>
						<div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 min-h-15">
							<AnimatePresence>
								{current.output.map((out) => (
									<motion.div
										key={out}
										initial={{ opacity: 0, x: -5 }}
										animate={{ opacity: 1, x: 0 }}
										className="text-xs font-mono text-emerald-400"
									>
										<span className="text-zinc-600 mr-2">{">"}</span>
										{out}
									</motion.div>
								))}
							</AnimatePresence>
							{current.output.length === 0 && (
								<span className="text-xs text-zinc-600 font-mono">
									(no output yet)
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Right: Visual regions */}
				<div className="xl:w-2/3 grid grid-cols-2 gap-3">
					<RegionBox
						title="Call Stack"
						color={REGION_COLORS.callstack}
						isActive={current.activeRegion === "callstack"}
						items={[...current.callStack].reverse()}
						emptyText="(empty)"
					/>
					<RegionBox
						title="Web APIs"
						color={REGION_COLORS.webapis}
						isActive={current.activeRegion === "webapis"}
						items={current.webApis}
						emptyText="(idle)"
					/>
					<RegionBox
						title="Microtask Queue"
						color={REGION_COLORS.microtask}
						isActive={current.activeRegion === "microtask"}
						items={current.microtaskQueue}
						emptyText="(empty)"
					/>
					<RegionBox
						title="Macrotask Queue"
						color={REGION_COLORS.macrotask}
						isActive={current.activeRegion === "macrotask"}
						items={current.macrotaskQueue}
						emptyText="(empty)"
					/>
				</div>
			</div>

			{/* Event Loop Decision Logic */}
			<div className="mt-5 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
				<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
					Event Loop Decision
				</div>
				<div className="flex flex-wrap gap-2 items-center">
					{LOOP_LOGIC_STEPS.map((ls) => (
						<span
							key={ls.label}
							className={`px-2 py-1 rounded text-xs font-mono transition-all ${
								ls.active(current.activeRegion)
									? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 scale-105"
									: "text-zinc-500 border border-zinc-800"
							}`}
						>
							{ls.label}
						</span>
					))}
				</div>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-3 mt-5">
				<button
					type="button"
					onClick={prev}
					disabled={step <= 0}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					← Back
				</button>
				<button
					type="button"
					onClick={next}
					disabled={step >= snippet.steps.length - 1}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					Next →
				</button>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors"
				>
					↺ Reset
				</button>
				<span className="text-xs text-zinc-600 ml-auto">
					Step {step + 1} / {snippet.steps.length}
				</span>
			</div>

			{/* Description */}
			<motion.div
				key={`${snippetIndex}-${step}`}
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				className="mt-4 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-sm text-violet-300"
			>
				{current.description}
			</motion.div>
		</DemoSection>
	);
}
