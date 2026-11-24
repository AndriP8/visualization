import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface TraceStep {
	kind: "call" | "return";
	fn: string;
	note: string;
}

const TRACE: TraceStep[] = [
	{ kind: "call", fn: "main", note: "script starts → main() frame pushed" },
	{ kind: "call", fn: "greet", note: "main calls greet → frame pushed" },
	{
		kind: "call",
		fn: "formatName",
		note: "greet calls formatName → frame pushed",
	},
	{
		kind: "return",
		fn: "formatName",
		note: 'formatName returns → frame popped, "Ada" flows back to greet',
	},
	{
		kind: "return",
		fn: "greet",
		note: 'greet returns → frame popped, "Hello, Ada!" flows back to main',
	},
	{ kind: "call", fn: "bye", note: "main calls bye → frame pushed" },
	{ kind: "return", fn: "bye", note: "bye returns → frame popped" },
	{
		kind: "return",
		fn: "main",
		note: "main returns → frame popped, stack empty, script done",
	},
];

const STEP_MS = 700;

export function CallStackDemo() {
	const [stepIndex, setStepIndex] = useState(-1);
	const [frames, setFrames] = useState<string[]>([]);
	const [running, setRunning] = useState(false);

	const atEnd = stepIndex === TRACE.length - 1;

	function applyStep(index: number) {
		const step = TRACE[index];
		setFrames((items) =>
			step.kind === "call" ? [...items, step.fn] : items.slice(0, -1),
		);
		setStepIndex(index);
	}

	useEffect(() => {
		if (!running) return;
		if (atEnd) {
			setRunning(false);
			return;
		}
		const step = TRACE[stepIndex + 1];
		const id = setTimeout(() => {
			setFrames((items) =>
				step.kind === "call" ? [...items, step.fn] : items.slice(0, -1),
			);
			setStepIndex(stepIndex + 1);
		}, STEP_MS);
		return () => clearTimeout(id);
	}, [running, stepIndex, atEnd]);

	function reset() {
		setRunning(false);
		setStepIndex(-1);
		setFrames([]);
	}

	return (
		<DemoSection
			title="Where you meet stacks: the call stack"
			description="Every function call pushes a frame onto the call stack, and every return pops that frame off. That is why deep recursion can overflow the stack — the real stack overflow. Undo history works the same way: each action is pushed, and undo pops the most recent one."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						disabled={running}
						onClick={() => {
							if (atEnd) reset();
							setRunning(true);
						}}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300 transition-colors hover:bg-purple-600/30 disabled:opacity-50"
					>
						Run script
					</button>
					<button
						type="button"
						disabled={running || atEnd}
						onClick={() => applyStep(stepIndex + 1)}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/60 disabled:opacity-50"
					>
						Step
					</button>
					<button
						type="button"
						onClick={reset}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/60"
					>
						Reset
					</button>
					<span className="text-xs text-zinc-500">
						Step {stepIndex + 1} of {TRACE.length}
					</span>
				</div>
				<output
					aria-live="polite"
					className="block min-h-5 text-sm text-amber-300"
				>
					{stepIndex === -1 ? "Ready to run." : TRACE[stepIndex].note}
				</output>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<p className="mb-3 text-sm font-medium text-zinc-200">Call stack</p>
					<p className="mb-2 text-xs text-zinc-500">
						top → next frame to return
					</p>
					<div className="flex min-h-16 flex-col-reverse items-start gap-2">
						{frames.length ? (
							<AnimatePresence>
								{frames.map((fn, index) => (
									<motion.span
										// biome-ignore lint/suspicious/noArrayIndexKey: these frame chips have no per-item state
										key={`${fn}-${index}`}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.6 }}
										className={`rounded-md border px-3 py-2 font-mono text-sm ${index === frames.length - 1 ? "border-amber-500/40 bg-amber-500/15 text-amber-200" : "border-purple-500/30 bg-purple-500/10 text-purple-200"}`}
									>
										{fn}()
									</motion.span>
								))}
							</AnimatePresence>
						) : (
							<span className="text-sm text-zinc-600">Empty</span>
						)}
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
