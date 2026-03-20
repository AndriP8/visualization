import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

interface Step {
	highlightLine: number;
	stack: string[];
	microtasks: string[];
	description: string;
	phase: "sync" | "await" | "microtask";
}

const CODE = `async function fetchUser() {
  console.log("2: async fn starts");   // line 1
  const data = await getUser();        // line 2
  console.log("4: after await");       // line 3
  return data;                         // line 4
}

console.log("1: sync start");          // line 6
fetchUser();                           // line 7
console.log("3: sync end");            // line 8`;

const STEPS: Step[] = [
	{
		highlightLine: -1,
		stack: [],
		microtasks: [],
		description: "Program starts. Call stack is empty.",
		phase: "sync",
	},
	{
		highlightLine: 7,
		stack: ["(anonymous)"],
		microtasks: [],
		description: 'Synchronous execution begins. "1: sync start" is logged.',
		phase: "sync",
	},
	{
		highlightLine: 8,
		stack: ["(anonymous)", "fetchUser()"],
		microtasks: [],
		description: "fetchUser() is called and pushed onto the stack.",
		phase: "sync",
	},
	{
		highlightLine: 1,
		stack: ["(anonymous)", "fetchUser()"],
		microtasks: [],
		description: '"2: async fn starts" is logged inside fetchUser().',
		phase: "sync",
	},
	{
		highlightLine: 2,
		stack: ["(anonymous)", "fetchUser()"],
		microtasks: [],
		description:
			"await hit! fetchUser() suspends and yields control back to the caller. getUser() is dispatched to Web API.",
		phase: "await",
	},
	{
		highlightLine: 8,
		stack: ["(anonymous)"],
		microtasks: [],
		description:
			"fetchUser() frame is removed. (anonymous) resumes. Execution continues synchronously.",
		phase: "sync",
	},
	{
		highlightLine: 9,
		stack: ["(anonymous)"],
		microtasks: [],
		description:
			'"3: sync end" is logged. (anonymous) finishes. Call stack is now empty.',
		phase: "sync",
	},
	{
		highlightLine: -1,
		stack: [],
		microtasks: ["fetchUser resume"],
		description:
			"Call stack is empty. getUser() resolves. fetchUser() continuation is queued as a microtask.",
		phase: "microtask",
	},
	{
		highlightLine: 3,
		stack: ["fetchUser() resume"],
		microtasks: [],
		description:
			'Event loop drains microtask queue. fetchUser() resumes. "4: after await" is logged.',
		phase: "microtask",
	},
	{
		highlightLine: 4,
		stack: [],
		microtasks: [],
		description: "fetchUser() returns data. Its Promise resolves. Stack empty.",
		phase: "microtask",
	},
];

const PHASE_COLORS = {
	sync: {
		text: "text-violet-300",
		bg: "bg-violet-500/10",
		border: "border-violet-500/20",
	},
	await: {
		text: "text-amber-300",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
	},
	microtask: {
		text: "text-emerald-300",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
	},
};

export function AsyncAwaitDemo() {
	const [step, setStep] = useState(0);
	const current = STEPS[step];
	const colors = PHASE_COLORS[current.phase];

	return (
		<div className="space-y-4">
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Code panel */}
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

				{/* Runtime state */}
				<div className="flex-1 min-w-0 space-y-3">
					{/* Call Stack */}
					<div>
						<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
							Call Stack
						</div>
						<div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 min-h-20 flex flex-col-reverse gap-1">
							<AnimatePresence>
								{current.stack.length === 0 ? (
									<span className="text-xs text-zinc-600 text-center py-2">
										(empty)
									</span>
								) : (
									current.stack.map((frame) => (
										<motion.div
											key={frame}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -10 }}
											className="px-3 py-1.5 rounded bg-violet-500/10 border border-violet-500/20 text-xs font-mono text-violet-300"
										>
											{frame}
										</motion.div>
									))
								)}
							</AnimatePresence>
						</div>
					</div>

					{/* Microtask Queue */}
					<div>
						<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
							Microtask Queue
						</div>
						<div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 min-h-14 flex flex-col gap-1">
							<AnimatePresence>
								{current.microtasks.length === 0 ? (
									<span className="text-xs text-zinc-600 text-center py-1">
										(empty)
									</span>
								) : (
									current.microtasks.map((task) => (
										<motion.div
											key={task}
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.9 }}
											className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300"
										>
											{task}
										</motion.div>
									))
								)}
							</AnimatePresence>
						</div>
					</div>

					{/* Phase badge */}
					<div
						className={`px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}
					>
						<span
							className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}
						>
							Phase: {current.phase}
						</span>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={() => setStep((s) => Math.max(0, s - 1))}
					disabled={step <= 0}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					← Back
				</button>
				<button
					type="button"
					onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
					disabled={step >= STEPS.length - 1}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

			{/* Description */}
			<motion.div
				key={step}
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				className={`p-3 rounded-lg ${colors.bg} border ${colors.border} text-sm ${colors.text}`}
			>
				{current.description}
			</motion.div>

			{/* Key insight */}
			<div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 space-y-1">
				<p className="text-zinc-200 font-medium">Key insight</p>
				<p>
					<code className="text-emerald-400">await</code> doesn't block the
					thread — it suspends the <em>current async function</em> and queues
					its continuation as a microtask when the awaited value settles.
					Synchronous code after the{" "}
					<code className="text-emerald-400">await</code> call site runs first.
				</p>
			</div>
		</div>
	);
}
