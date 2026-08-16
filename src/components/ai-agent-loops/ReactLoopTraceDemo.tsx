import { motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type StepType = "thought" | "action" | "observation" | "final";
interface TraceStep {
	id: string;
	type: StepType;
	text: string;
}

const TRACE: TraceStep[] = [
	{
		id: "thought-weather",
		type: "thought",
		text: "I need to find the weather in Paris.",
	},
	{
		id: "action-weather",
		type: "action",
		text: 'weather_tool({ "location": "Paris, France" })',
	},
	{ id: "observation-weather", type: "observation", text: "22°C, Sunny" },
	{
		id: "thought-email",
		type: "thought",
		text: "I have the weather; now I should email it.",
	},
	{
		id: "action-email",
		type: "action",
		text: 'email_tool({ "to": "user@example.com" })',
	},
	{
		id: "observation-email",
		type: "observation",
		text: "Email sent successfully",
	},
	{ id: "final", type: "final", text: "The task is complete." },
];

export function ReactLoopTraceDemo() {
	const [step, setStep] = useState(0);
	const visibleTrace = TRACE.slice(0, step);
	const context = visibleTrace
		.map((item) => `${item.type}: ${item.text}`)
		.join("\n");

	return (
		<DemoSection
			title="Demo 1: ReAct Loop Trace"
			description="ReAct alternates between reasoning about the next move, calling a tool, and feeding the observation back into the next model turn."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="text-xs text-zinc-500">
						Step {step} of {TRACE.length}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							disabled={step === 0}
							onClick={() => setStep((value) => value - 1)}
							className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 disabled:opacity-40"
						>
							Previous
						</button>
						<button
							type="button"
							disabled={step === TRACE.length}
							onClick={() => setStep((value) => value + 1)}
							className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:opacity-40"
						>
							Next step
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
						<div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
							Agent trace
						</div>
						{TRACE.map((item, index) => (
							<TraceRow
								key={item.id}
								item={item}
								active={index < step}
								current={index === step - 1}
							/>
						))}
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							Context after observation
						</div>
						<ShikiCode
							code={context || "Waiting for the first model turn…"}
							language="text"
							showLineNumbers={false}
							className="min-h-48"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<Metric label="Model turns" value={Math.ceil(step / 2).toString()} />
					<Metric
						label="Tool calls"
						value={TRACE.slice(0, step)
							.filter((item) => item.type === "action")
							.length.toString()}
					/>
					<Metric
						label="Observations"
						value={TRACE.slice(0, step)
							.filter((item) => item.type === "observation")
							.length.toString()}
					/>
					<Metric
						label="Terminated"
						value={step === TRACE.length ? "Yes" : "No"}
					/>
				</div>

				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<span className="font-medium text-cyan-300">Loop invariant:</span> the
					model never receives a tool result by imagination; the application
					executes the tool and appends its observation before the next turn.
				</div>
			</div>
		</DemoSection>
	);
}

function TraceRow({
	item,
	active,
	current,
}: {
	item: TraceStep;
	active: boolean;
	current: boolean;
}) {
	const color = match(item.type)
		.with("thought", () => "text-violet-300")
		.with("action", () => "text-amber-300")
		.with("observation", () => "text-zinc-300")
		.with("final", () => "text-emerald-300")
		.exhaustive();
	return (
		<motion.div
			animate={{ opacity: active ? 1 : 0.3 }}
			className={`rounded-lg border p-2.5 text-xs ${current ? "border-cyan-500/40 bg-cyan-500/10" : "border-zinc-800 bg-zinc-900/60"}`}
		>
			<div
				className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${color}`}
			>
				{item.type}
			</div>
			<div className="font-mono text-zinc-300">{item.text}</div>
		</motion.div>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className="font-mono text-lg font-semibold text-zinc-200">
				{value}
			</div>
		</div>
	);
}
