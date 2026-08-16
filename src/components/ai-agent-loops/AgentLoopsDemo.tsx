import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Step = "init" | "thought1" | "action1" | "obs1" | "thought2" | "action2";

const STEPS: Step[] = [
	"init",
	"thought1",
	"action1",
	"obs1",
	"thought2",
	"action2",
];

export function AgentLoopsDemo() {
	const [stepIdx, setStepIdx] = useState(0);

	const contextStr = match(stepIdx)
		.with(0, () => `User: What is the weather in Tokyo?`)
		.with(
			1,
			() =>
				`User: What is the weather in Tokyo?\nThought: I should use the weather tool.`,
		)
		.with(
			2,
			() =>
				`User: What is the weather in Tokyo?\nThought: I should use the weather tool.\nAction: get_weather("Tokyo")`,
		)
		.with(
			3,
			() =>
				`User: What is the weather in Tokyo?\nThought: I should use the weather tool.\nAction: get_weather("Tokyo")\nObservation: Sunny, 25C`,
		)
		.with(
			4,
			() =>
				`User: What is the weather in Tokyo?\nThought: I should use the weather tool.\nAction: get_weather("Tokyo")\nObservation: Sunny, 25C\nThought: Now I can answer the user.`,
		)
		.with(
			5,
			() =>
				`User: What is the weather in Tokyo?\nThought: I should use the weather tool.\nAction: get_weather("Tokyo")\nObservation: Sunny, 25C\nThought: Now I can answer the user.\nAction: send_response("It is sunny and 25C in Tokyo.")`,
		)
		.otherwise(() => "");

	return (
		<DemoSection
			title="Agent Loops (ReAct)"
			description="Agents run in a loop of Reason (Thought), Act (Action), and Observe (Observation) until the task is complete."
		>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div className="space-y-6">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
							disabled={stepIdx === 0}
							className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-md disabled:opacity-50 text-sm cursor-pointer hover:bg-zinc-700"
						>
							Prev
						</button>
						<button
							type="button"
							onClick={() =>
								setStepIdx(Math.min(STEPS.length - 1, stepIdx + 1))
							}
							disabled={stepIdx === STEPS.length - 1}
							className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-md disabled:opacity-50 text-sm cursor-pointer"
						>
							Next Step
						</button>
					</div>

					<div className="relative border-l-2 border-zinc-800 ml-4 pl-6 py-2 space-y-8">
						<StepItem
							active={stepIdx >= 1}
							label="Thought 1"
							desc="I should use the weather tool."
							color="text-amber-400"
						/>
						<StepItem
							active={stepIdx >= 2}
							label="Action 1"
							desc="get_weather('Tokyo')"
							color="text-blue-400"
						/>
						<StepItem
							active={stepIdx >= 3}
							label="Observation 1"
							desc="Sunny, 25C"
							color="text-emerald-400"
						/>
						<StepItem
							active={stepIdx >= 4}
							label="Thought 2"
							desc="Now I can answer the user."
							color="text-amber-400"
						/>
						<StepItem
							active={stepIdx >= 5}
							label="Action 2"
							desc="send_response(...)"
							color="text-blue-400"
						/>
					</div>
				</div>

				<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 h-full">
					<h4 className="text-sm font-medium text-zinc-400 mb-4">
						LLM Context Window
					</h4>
					<div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 h-[300px]">
						<ShikiCode language="text" code={contextStr} className="text-sm" />
					</div>
				</div>
			</div>
		</DemoSection>
	);
}

function StepItem({
	active,
	label,
	desc,
	color,
}: {
	active: boolean;
	label: string;
	desc: string;
	color: string;
}) {
	return (
		<div
			className={`relative transition-opacity duration-300 ${active ? "opacity-100" : "opacity-30"}`}
		>
			<div
				className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full ${active ? "bg-zinc-400" : "bg-zinc-800"}`}
			/>
			<p className={`text-xs font-bold uppercase tracking-wider mb-1 ${color}`}>
				{label}
			</p>
			<p className="text-sm text-zinc-300">{desc}</p>
		</div>
	);
}
