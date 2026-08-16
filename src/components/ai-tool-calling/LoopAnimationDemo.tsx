import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Role = "user" | "assistant" | "app";

interface Step {
	id: number;
	role: Role;
	label: string;
	sublabel: string;
	content: string;
	isToolUse?: boolean;
	isToolResult?: boolean;
	isFinal?: boolean;
}

const STEPS: Step[] = [
	{
		id: 0,
		role: "user",
		label: "User",
		sublabel: "Initial message",
		content: "What's the weather in Tokyo and what's 19 × 23?",
	},
	{
		id: 1,
		role: "app",
		label: "App runtime",
		sublabel: "Sends full conversation to model API",
		content: `POST /v1/messages\n{ tools: [...], messages: [{role:"user", ...}] }`,
	},
	{
		id: 2,
		role: "assistant",
		label: "Model",
		sublabel: "Turn 1 — emits tool_use (does NOT execute it)",
		content: `{ type: "tool_use", id: "tu_01", name: "get_weather", input: { city: "Tokyo" } }`,
		isToolUse: true,
	},
	{
		id: 3,
		role: "app",
		label: "App runtime",
		sublabel: 'Executes get_weather("Tokyo") locally',
		content: `// App runs the function:\nconst result = await getWeather("Tokyo");\n// → { temp_c: 22, condition: "clear" }`,
	},
	{
		id: 4,
		role: "user",
		label: "App runtime → Model",
		sublabel: "tool_result appended as user-role message, full history resent",
		content: `{ role: "user", content: [{ type: "tool_result", tool_use_id: "tu_01",\n  content: "{ temp_c: 22, condition: \\"clear\\" }" }] }`,
		isToolResult: true,
	},
	{
		id: 5,
		role: "assistant",
		label: "Model",
		sublabel: "Turn 2 — sees weather result, now calls calculator",
		content: `{ type: "tool_use", id: "tu_02", name: "calculator", input: { expr: "19*23" } }`,
		isToolUse: true,
	},
	{
		id: 6,
		role: "app",
		label: "App runtime",
		sublabel: 'Executes calculator("19*23") locally',
		content: `const result = evaluate("19*23");\n// → 437`,
	},
	{
		id: 7,
		role: "user",
		label: "App runtime → Model",
		sublabel: "tool_result appended, full history resent again",
		content: `{ role: "user", content: [{ type: "tool_result", tool_use_id: "tu_02",\n  content: "437" }] }`,
		isToolResult: true,
	},
	{
		id: 8,
		role: "assistant",
		label: "Model",
		sublabel: "Turn 3 — no tool_use block → loop exits",
		content: `"Tokyo is currently 22°C and clear. 19 × 23 = 437."`,
		isFinal: true,
	},
];

function roleColor(
	role: Role,
	isToolUse?: boolean,
	isToolResult?: boolean,
	isFinal?: boolean,
) {
	if (isFinal)
		return {
			bg: "bg-emerald-900/40",
			border: "border-emerald-600/60",
			label: "text-emerald-300",
		};
	if (isToolUse)
		return {
			bg: "bg-amber-900/30",
			border: "border-amber-600/50",
			label: "text-amber-300",
		};
	if (isToolResult)
		return {
			bg: "bg-sky-900/30",
			border: "border-sky-600/50",
			label: "text-sky-300",
		};
	if (role === "user")
		return {
			bg: "bg-zinc-800/60",
			border: "border-zinc-600/50",
			label: "text-zinc-300",
		};
	if (role === "app")
		return {
			bg: "bg-violet-900/30",
			border: "border-violet-600/50",
			label: "text-violet-300",
		};
	return {
		bg: "bg-zinc-800/40",
		border: "border-zinc-700/50",
		label: "text-zinc-400",
	};
}

export function LoopAnimationDemo() {
	const [visibleCount, setVisibleCount] = useState(0);
	const [running, setRunning] = useState(false);

	function run() {
		if (running) return;
		setVisibleCount(0);
		setRunning(true);
		let i = 0;
		const timer = setInterval(() => {
			i++;
			setVisibleCount(i);
			if (i >= STEPS.length) {
				clearInterval(timer);
				setRunning(false);
			}
		}, 900);
	}

	function reset() {
		setVisibleCount(0);
		setRunning(false);
	}

	const visibleSteps = STEPS.slice(0, visibleCount);
	const turn = visibleSteps.filter((s) => s.isToolUse || s.isFinal).length;
	const done = visibleCount >= STEPS.length;

	const turnStepCounts: Record<number, number> = {
		1: 5,
		2: 8,
		3: 9,
	};

	return (
		<DemoSection
			title="Demo 1: Turn-by-Turn Loop"
			description="A complete agentic exchange. The model never executes tools — it emits intent as structured tool_use blocks. The application runs the tools and feeds results back as tool_result messages. The loop terminates when the model's response contains no tool_use block."
		>
			<div className="space-y-5">
				{/* Turn counter */}
				<div className="flex items-center gap-4">
					<div className="flex gap-2">
						{[1, 2, 3].map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => {
									if (!running) {
										setVisibleCount(turnStepCounts[t]);
									}
								}}
								disabled={running}
								className={`px-3 py-1 rounded text-xs font-mono border transition-colors duration-300 ${
									turn >= t
										? "bg-amber-900/40 border-amber-600/50 text-amber-300"
										: "bg-zinc-800 border-zinc-700 text-zinc-600"
								} ${!running ? "cursor-pointer hover:border-amber-500/50" : "cursor-default"}`}
							>
								Turn {t}
								{t === 3 ? " (final)" : ""}
							</button>
						))}
					</div>
				</div>

				{/* Steps */}
				<div className="space-y-2 min-h-[12rem]">
					<AnimatePresence initial={false}>
						{visibleSteps.map((step) => {
							const c = roleColor(
								step.role,
								step.isToolUse,
								step.isToolResult,
								step.isFinal,
							);
							return (
								<motion.div
									key={step.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
									className={`rounded-lg border ${c.bg} ${c.border} p-3`}
								>
									<div className="flex items-start justify-between gap-2 mb-1">
										<span className={`text-xs font-semibold ${c.label}`}>
											{step.label}
										</span>
										<span className="text-[10px] text-zinc-500 text-right max-w-[55%]">
											{step.sublabel}
										</span>
									</div>
									<pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap break-all leading-relaxed">
										{step.content}
									</pre>
								</motion.div>
							);
						})}
					</AnimatePresence>

					{visibleCount === 0 && (
						<p className="text-zinc-600 italic text-sm">
							Press "Run loop" to animate the exchange step by step.
						</p>
					)}
				</div>

				{/* Termination callout */}
				<AnimatePresence>
					{done && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-3 text-xs text-emerald-300"
						>
							<span className="font-medium">Loop exit condition met:</span> the
							assistant message in Turn 3 contained only a{" "}
							<span className="font-mono">text</span> block — no{" "}
							<span className="font-mono">tool_use</span>. The app stops the
							loop and returns the final answer to the user. A per-request{" "}
							<span className="font-mono">max_iterations</span> cap is a safety
							net, not the primary termination signal.
						</motion.div>
					)}
				</AnimatePresence>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={run}
						disabled={running}
						className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
					>
						{running ? "Running…" : done ? "Run again" : "Run loop"}
					</button>
					{visibleCount > 0 && !running && (
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm transition-colors"
						>
							Reset
						</button>
					)}
				</div>

				{/* Key insight */}
				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-amber-300 font-medium">
						Full history resent each turn:
					</span>{" "}
					The Anthropic Messages API is stateless. Every call includes the
					entire conversation — user messages, assistant turns, and tool_result
					messages — from the beginning. This is why context grows with each
					tool call and why{" "}
					<span className="font-mono text-zinc-300">tool_result</span> uses{" "}
					<span className="font-mono text-zinc-300">role: "user"</span> in
					Anthropic's API (it's the next user turn, not a special role).
				</div>

				<div>
					<p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
						Minimal loop driver
					</p>
					<ShikiCode
						language="typescript"
						showLineNumbers={false}
						code={`async function runToolLoop(messages: Message[], tools: Tool[]) {
  const MAX_TURNS = 10; // safety cap — not the exit condition

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await anthropic.messages.create({ model, tools, messages });

    // Append assistant turn to history
    messages.push({ role: "assistant", content: response.content });

    // Exit condition: no tool_use blocks
    const toolUseBlocks = response.content.filter(b => b.type === "tool_use");
    if (toolUseBlocks.length === 0) return response; // final answer

    // Execute each tool and collect results
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: await executeTool(block.name, block.input),
      }))
    );

    // Append ALL results as a single user-role message
    messages.push({ role: "user", content: toolResults });
  }

  throw new Error("Max iterations exceeded");
}`}
					/>
				</div>
			</div>
		</DemoSection>
	);
}
