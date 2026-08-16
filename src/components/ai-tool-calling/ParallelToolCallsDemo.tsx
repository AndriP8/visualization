import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Phase =
	| "idle"
	| "model-emits"
	| "app-fans-out"
	| "tools-running"
	| "tools-done"
	| "batching"
	| "model-final"
	| "done";

const TOOL_CALLS = [
	{
		id: "tu_A1",
		name: "get_weather",
		input: { city: "Tokyo" },
		result: '{ "temp_c": 22, "condition": "clear" }',
	},
	{
		id: "tu_A2",
		name: "get_weather",
		input: { city: "Paris" },
		result: '{ "temp_c": 15, "condition": "rainy" }',
	},
];

const PHASE_ORDER: Phase[] = [
	"idle",
	"model-emits",
	"app-fans-out",
	"tools-running",
	"tools-done",
	"batching",
	"model-final",
	"done",
];

const PHASE_DELAYS: Partial<Record<Phase, number>> = {
	"model-emits": 600,
	"app-fans-out": 700,
	"tools-running": 800,
	"tools-done": 1200,
	batching: 700,
	"model-final": 900,
	done: 400,
};

export function ParallelToolCallsDemo() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [running, setRunning] = useState(false);

	function run() {
		if (running) return;
		setPhase("idle");
		setRunning(true);

		let i = 1; // start at model-emits
		function next() {
			const p = PHASE_ORDER[i];
			setPhase(p);
			i++;
			if (i < PHASE_ORDER.length) {
				setTimeout(next, PHASE_DELAYS[p] ?? 700);
			} else {
				setRunning(false);
			}
		}
		setTimeout(next, 300);
	}

	function reset() {
		setPhase("idle");
		setRunning(false);
	}

	const atLeast = (p: Phase) =>
		PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);
	const done = phase === "done";

	return (
		<DemoSection
			title="Demo 3: Parallel Tool Calls"
			description="When the model emits multiple tool_use blocks in a single assistant turn, the application can run them concurrently (Promise.all). All results must come back as a single user-role message containing one tool_result per tool_use_id — not as separate turns."
		>
			<div className="space-y-5">
				{/* Diagram */}
				<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
					{/* Model output */}
					<AnimatePresence>
						{atLeast("model-emits") && (
							<motion.div
								initial={{ opacity: 0, y: -8 }}
								animate={{ opacity: 1, y: 0 }}
								className="rounded border border-amber-700/50 bg-amber-900/20 p-3"
							>
								<p className="text-xs font-semibold text-amber-300 mb-2">
									Model (assistant turn) — emits 2 tool_use blocks
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{TOOL_CALLS.map((tc) => (
										<div
											key={tc.id}
											className="bg-zinc-900 border border-zinc-700 rounded p-2 text-[11px] font-mono text-zinc-300"
										>
											<div className="text-amber-400 mb-1">
												type: "tool_use"
											</div>
											<div>
												id: <span className="text-sky-300">"{tc.id}"</span>
											</div>
											<div>name: "{tc.name}"</div>
											<div>
												input: {"{"} city: "{tc.input.city}" {"}"}
											</div>
										</div>
									))}
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Fan-out arrows */}
					<AnimatePresence>
						{atLeast("app-fans-out") && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="flex items-center justify-center gap-2 text-xs text-violet-400"
							>
								<span className="bg-violet-900/30 border border-violet-700/40 rounded px-3 py-1">
									App runtime — Promise.all([...]) — runs tools in parallel
								</span>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Tools running */}
					<AnimatePresence>
						{atLeast("tools-running") && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								className="grid grid-cols-1 sm:grid-cols-2 gap-2"
							>
								{TOOL_CALLS.map((tc, idx) => (
									<motion.div
										key={tc.id}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: idx * 0.15 }}
										className="rounded border border-violet-700/40 bg-violet-900/20 p-2 text-xs"
									>
										<p className="text-violet-300 font-semibold mb-1">
											get_weather("{tc.input.city}")
										</p>
										{atLeast("tools-done") ? (
											<motion.p
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												className="font-mono text-emerald-300 text-[11px]"
											>
												→ {tc.result}
											</motion.p>
										) : (
											<p className="text-zinc-500 animate-pulse">running…</p>
										)}
									</motion.div>
								))}
							</motion.div>
						)}
					</AnimatePresence>

					{/* Batching note */}
					<AnimatePresence>
						{atLeast("batching") && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="flex items-center justify-center gap-2 text-xs text-sky-400"
							>
								<span className="bg-sky-900/20 border border-sky-700/40 rounded px-3 py-1">
									App collects BOTH results → single user-role message with 2
									tool_result blocks
								</span>
							</motion.div>
						)}
					</AnimatePresence>

					{/* tool_result message */}
					<AnimatePresence>
						{atLeast("model-final") && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								className="rounded border border-sky-700/50 bg-sky-900/20 p-3"
							>
								<p className="text-xs font-semibold text-sky-300 mb-2">
									User-role message — one message, two tool_result blocks (IDs
									matched)
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{TOOL_CALLS.map((tc) => (
										<div
											key={tc.id}
											className="bg-zinc-900 border border-zinc-700 rounded p-2 text-[11px] font-mono text-zinc-300"
										>
											<div className="text-sky-400 mb-1">
												type: "tool_result"
											</div>
											<div>
												tool_use_id:{" "}
												<span className="text-sky-300">"{tc.id}"</span>
											</div>
											<div className="text-emerald-300 mt-1">{tc.result}</div>
										</div>
									))}
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Final model response */}
					<AnimatePresence>
						{atLeast("done") && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								className="rounded border border-emerald-700/50 bg-emerald-900/20 p-3"
							>
								<p className="text-xs font-semibold text-emerald-300 mb-1">
									Model (final) — no tool_use → loop exits
								</p>
								<p className="text-sm text-zinc-200">
									"Tokyo is 22°C and clear. Paris is 15°C and rainy."
								</p>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={run}
						disabled={running}
						className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
					>
						{running ? "Animating…" : done ? "Replay" : "Animate"}
					</button>
					{phase !== "idle" && !running && (
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm transition-colors"
						>
							Reset
						</button>
					)}
				</div>

				{/* Key correctness points */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
						<span className="text-violet-300 font-medium">
							Parallelism is in the app:
						</span>{" "}
						The model just emits multiple{" "}
						<span className="font-mono text-zinc-300">tool_use</span> blocks. It
						has no knowledge of concurrency. Whether you run them in parallel or
						sequentially is entirely your application's decision.
					</div>
					<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
						<span className="text-sky-300 font-medium">
							One message, all results:
						</span>{" "}
						All <span className="font-mono text-zinc-300">tool_result</span>{" "}
						blocks for a given turn must be bundled into a single user-role
						message. Splitting them into multiple turns violates the API
						contract and causes an error.
					</div>
				</div>

				<div>
					<p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
						Parallel execution in the app
					</p>
					<ShikiCode
						language="typescript"
						code={`// Model returned 2 tool_use blocks in one assistant turn
const toolResults = await Promise.all(
  toolUseBlocks.map(async (block) => {
    const output = await executeTool(block.name, block.input);
    return {
      type: "tool_result" as const,
      tool_use_id: block.id,   // must match the tool_use id exactly
      content: JSON.stringify(output),
    };
  })
);

// Send ALL results back as a SINGLE user-role message
messages.push({ role: "user", content: toolResults });
// ↑ Not two separate messages — that's an API error`}
					/>
				</div>
			</div>
		</DemoSection>
	);
}
