import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type FailureMode =
	| "infinite-loop"
	| "swallowed-error"
	| "hallucinated-name"
	| "race-condition";

interface Failure {
	id: FailureMode;
	label: string;
	symptom: string;
	bug: string;
	fix: string;
	bugCode: string;
	fixCode: string;
}

const FAILURES: Failure[] = [
	{
		id: "infinite-loop",
		label: "Infinite loop",
		symptom:
			'Tool always returns "unknown" — model keeps retrying the same tool call, never producing a final answer. Iteration count climbs until the safety cap fires.',
		bug: 'Tool silently returns "unknown" for any missing data. Model has no way to make progress — it keeps asking, hoping the answer appears.',
		fix: "Return a clear error message explaining WHY the data isn't available. Let the model decide to answer without that data or ask the user for clarification. Always cap iterations as a backstop.",
		bugCode: `// Bug: ambiguous "unknown" gives model no signal
async function getWeather(city: string) {
  const data = await fetch(\`/api/weather?city=\${city}\`);
  if (!data.ok) return "unknown"; // ← model sees this, tries again
  return data.json();
}`,
		fixCode: `// Fix: return structured error the model can act on
async function getWeather(city: string) {
  const data = await fetch(\`/api/weather?city=\${city}\`);
  if (!data.ok) {
    return { error: true, message: \`No weather data for "\${city}". Available cities: Tokyo, Paris.\` };
  }
  return data.json();
}

// And always cap iterations at the loop level:
if (turn >= MAX_TURNS) throw new Error("Max iterations exceeded");`,
	},
	{
		id: "swallowed-error",
		label: "Swallowed error",
		symptom:
			"Tool throws internally but the app returns an empty string as the tool_result. Model receives no error signal and hallucinates a plausible-looking answer as if the tool had succeeded.",
		bug: "Catching the exception and returning an empty string hides the failure. The model has no reason to doubt it and fills in the gap with its parametric memory.",
		fix: "Return a proper tool_result with is_error: true and a descriptive message. The model can then acknowledge the failure, retry with different parameters, or tell the user the tool is unavailable.",
		bugCode: `// Bug: exception caught and swallowed
async function executeTool(name: string, input: unknown) {
  try {
    return await tools[name](input);
  } catch (e) {
    return ""; // ← model receives empty string, no error signal
  }
}`,
		fixCode: `// Fix: surface the error as a structured tool_result
async function executeTool(name: string, input: unknown) {
  try {
    return { content: JSON.stringify(await tools[name](input)) };
  } catch (e) {
    return {
      is_error: true,
      content: \`Tool "\${name}" failed: \${(e as Error).message}\`,
    };
  }
}`,
	},
	{
		id: "hallucinated-name",
		label: "Hallucinated tool name",
		symptom:
			'Model emits tool_use with name "fetch_temperature" but only "get_weather" is in the tool list. App silently ignores the unknown name — model never gets feedback and retries the same bad call forever.',
		bug: "App doesn't validate tool names. Unknown calls are silently dropped, leaving the model in a dead state with no feedback.",
		fix: "Whitelist tool names. If the model calls an unknown tool, return is_error: true with the list of valid names. The model can then self-correct.",
		bugCode: `// Bug: unknown tool name silently ignored
const result = toolHandlers[block.name]?.(block.input);
// If block.name === "fetch_temperature" and it's not in toolHandlers:
// result is undefined → sent back as empty/missing tool_result → model retries the same bad call`,
		fixCode: `// Fix: explicit whitelist with helpful error
if (!(block.name in toolHandlers)) {
  return {
    type: "tool_result",
    tool_use_id: block.id,
    is_error: true,
    content: \`Unknown tool "\${block.name}". Available: \${Object.keys(toolHandlers).join(", ")}\`,
  };
}`,
	},
	{
		id: "race-condition",
		label: "Race condition",
		symptom:
			"Two parallel tool calls both write to the same shared counter. Interleaved execution produces a non-deterministic final value — sometimes correct, sometimes not, with no error thrown.",
		bug: "Parallel tools that share mutable state run concurrently without coordination. The read-modify-write sequence interleaves across both calls.",
		fix: "Serialize writes to shared state: run stateful tools sequentially, use a mutex, or make them operate on separate keys. Stateless / read-only tools are safe to parallelize freely.",
		bugCode: `// Bug: indiscriminately running all tool calls in parallel with Promise.all
async function executeToolCalls(blocks: ToolUseBlock[]) {
  return Promise.all(
    blocks.map(async (block) => {
      // If multiple stateful tools run concurrently (e.g. 2 counter writes),
      // their read-modify-write cycles interleave and clobber shared state
      const output = await executeTool(block.name, block.input);
      return {
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: JSON.stringify(output),
      };
    })
  );
}`,
		fixCode: `// Fix: serialize stateful tool calls, execute stateless tools in parallel
async function executeToolCalls(blocks: ToolUseBlock[]) {
  const results: ToolResult[] = [];

  // 1. Run stateful tool calls sequentially to prevent race conditions
  const statefulBlocks = blocks.filter((b) => isStateful(b.name));
  for (const block of statefulBlocks) {
    const output = await executeTool(block.name, block.input);
    results.push({
      type: "tool_result",
      tool_use_id: block.id,
      content: JSON.stringify(output),
    });
  }

  // 2. Stateless / read-only tools can safely run in parallel
  const statelessBlocks = blocks.filter((b) => !isStateful(b.name));
  const statelessResults = await Promise.all(
    statelessBlocks.map(async (block) => ({
      type: "tool_result" as const,
      tool_use_id: block.id,
      content: JSON.stringify(await executeTool(block.name, block.input)),
    }))
  );

  return [...results, ...statelessResults];
}`,
	},
];

interface IterationRow {
	n: number;
	toolName: string;
	result: string;
}

function InfiniteLoopViz() {
	const [rows, setRows] = useState<IterationRow[]>([]);
	const [capped, setCapped] = useState(false);
	const [running, setRunning] = useState(false);
	const timer = useRef<ReturnType<typeof setInterval> | null>(null);
	const MAX = 5;

	function start() {
		if (timer.current) clearInterval(timer.current);
		setRows([]);
		setCapped(false);
		setRunning(true);
		let n = 1;
		timer.current = setInterval(() => {
			setRows((prev) => [
				...prev,
				{ n, toolName: "get_weather", result: n <= MAX ? "unknown" : "" },
			]);
			if (n >= MAX) {
				if (timer.current) clearInterval(timer.current);
				setCapped(true);
				setRunning(false);
			}
			n++;
		}, 600);
	}

	function reset() {
		if (timer.current) clearInterval(timer.current);
		setRows([]);
		setCapped(false);
		setRunning(false);
	}

	useEffect(
		() => () => {
			if (timer.current) clearInterval(timer.current);
		},
		[],
	);

	return (
		<div className="space-y-3">
			<div className="rounded border border-zinc-800 bg-zinc-950 p-3 min-h-[8rem]">
				<div className="space-y-1">
					<AnimatePresence initial={false}>
						{rows.map((r) => (
							<motion.div
								key={r.n}
								initial={{ opacity: 0, x: -6 }}
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center gap-3 text-xs font-mono"
							>
								<span className="text-zinc-500 w-16">Turn {r.n}</span>
								<span className="text-amber-300">get_weather("Tokyo")</span>
								<span className="text-zinc-500">→</span>
								<span className="text-red-400">"{r.result}"</span>
								<span className="text-zinc-600 italic">model tries again…</span>
							</motion.div>
						))}
					</AnimatePresence>
					{capped && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-xs text-red-400 font-mono pt-1 border-t border-zinc-800 mt-1"
						>
							Error: Max iterations (5) exceeded — loop aborted
						</motion.div>
					)}
					{rows.length === 0 && (
						<p className="text-zinc-600 italic text-xs">
							Press "Simulate" to run.
						</p>
					)}
				</div>
			</div>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={start}
					disabled={running}
					className="px-3 py-1.5 rounded bg-red-900/50 border border-red-700/50 text-red-300 text-xs disabled:opacity-40 hover:bg-red-900/70 transition-colors"
				>
					{running ? "Simulating…" : "Simulate"}
				</button>
				{rows.length > 0 && !running && (
					<button
						type="button"
						onClick={reset}
						className="px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 text-xs hover:border-zinc-500 transition-colors"
					>
						Reset
					</button>
				)}
			</div>
		</div>
	);
}

export function ToolCallingFailuresDemo() {
	const [active, setActive] = useState<FailureMode>("infinite-loop");
	const failure = FAILURES.find((f) => f.id === active) ?? FAILURES[0];

	return (
		<DemoSection
			title="Demo 4: Failure Modes"
			description="The tool calling loop is application code — its failure modes are engineering problems, not model problems. Each failure below has a distinct signature and a specific fix. Select a failure to see the bug, symptom, and corrected code."
		>
			<div className="space-y-5">
				{/* Failure selector */}
				<div className="flex flex-wrap gap-2">
					{FAILURES.map((f) => (
						<button
							key={f.id}
							type="button"
							onClick={() => setActive(f.id)}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
								active === f.id
									? "bg-red-900/50 border-red-600/60 text-red-200"
									: "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
							}`}
						>
							{f.label}
						</button>
					))}
				</div>

				<AnimatePresence mode="wait">
					<motion.div
						key={active}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.2 }}
						className="space-y-4"
					>
						{/* Symptom */}
						<div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 text-xs text-zinc-300">
							<span className="text-red-300 font-medium">Symptom: </span>
							{failure.symptom}
						</div>

						{/* Live simulation for infinite loop */}
						{active === "infinite-loop" && <InfiniteLoopViz />}

						{/* Bug explanation */}
						<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
							<span className="text-rose-300 font-medium">Root cause: </span>
							{failure.bug}
						</div>

						{/* Bug vs fix code */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<div>
								<p className="text-xs text-red-400 uppercase tracking-wider mb-2">
									Bug
								</p>
								<ShikiCode language="typescript" code={failure.bugCode} />
							</div>
							<div>
								<p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">
									Fix
								</p>
								<ShikiCode language="typescript" code={failure.fixCode} />
							</div>
						</div>

						{/* Fix summary */}
						<div className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-3 text-xs text-zinc-400">
							<span className="text-emerald-300 font-medium">Fix: </span>
							{failure.fix}
						</div>
					</motion.div>
				</AnimatePresence>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-amber-300 font-medium">
						The model is not at fault:
					</span>{" "}
					All four failures above are application-layer bugs. The model behaves
					rationally given the signals it receives — bad signals produce bad
					behavior. Robust tool calling requires treating your loop driver with
					the same discipline as any production API server: validate inputs,
					surface errors, serialize state, and cap iteration.
				</div>
			</div>
		</DemoSection>
	);
}
