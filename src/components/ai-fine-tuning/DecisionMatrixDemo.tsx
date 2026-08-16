import { motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

export function DecisionMatrixDemo() {
	const [dataChanges, setDataChanges] = useState(false);
	const [needsFormat, setNeedsFormat] = useState(false);

	const recommendation = match({ dataChanges, needsFormat })
		.with({ dataChanges: true, needsFormat: true }, () => ({
			name: "Hybrid",
			color: "text-emerald-300",
			reason:
				"Fine-tune the behavior and retrieve the latest facts at runtime.",
		}))
		.with({ dataChanges: true, needsFormat: false }, () => ({
			name: "RAG",
			color: "text-cyan-300",
			reason:
				"Retrieve current, permissioned facts without retraining the model.",
		}))
		.with({ dataChanges: false, needsFormat: true }, () => ({
			name: "Fine-tuning",
			color: "text-violet-300",
			reason: "Teach a stable response pattern, style, or specialized task.",
		}))
		.otherwise(() => ({
			name: "Base model",
			color: "text-zinc-200",
			reason:
				"Start with prompting; add complexity only when the evals show a gap.",
		}));

	return (
		<DemoSection
			title="Demo 3: Choose the Right Adaptation"
			description="Answer two product questions and see whether the problem is primarily about changing knowledge, learned behavior, or both."
		>
			<div className="space-y-5">
				<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
					<ChoiceCard
						active={dataChanges}
						label="Does the knowledge change frequently?"
						detail="Live documentation, inventory, user records"
						onClick={() => setDataChanges((value) => !value)}
						accent="cyan"
					/>
					<ChoiceCard
						active={needsFormat}
						label="Do you need stable style or format?"
						detail="Brand voice, JSON shape, domain workflow"
						onClick={() => setNeedsFormat((value) => !value)}
						accent="violet"
					/>
				</div>

				<motion.div
					key={recommendation.name}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-center"
				>
					<div className="text-[10px] uppercase tracking-wider text-zinc-500">
						Recommendation
					</div>
					<div
						className={`mt-2 font-mono text-2xl font-semibold ${recommendation.color}`}
					>
						{recommendation.name}
					</div>
					<p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
						{recommendation.reason}
					</p>
				</motion.div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<Metric label="Changing facts" value={dataChanges ? "Yes" : "No"} />
					<Metric label="Stable behavior" value={needsFormat ? "Yes" : "No"} />
					<Metric label="Index needed" value={dataChanges ? "Yes" : "No"} />
					<Metric
						label="Training needed"
						value={needsFormat ? "Maybe" : "No"}
					/>
				</div>

				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<span className="font-medium text-emerald-300">Rule of thumb:</span>{" "}
					use RAG for what the model should know now, fine-tuning for how it
					should behave, and both when the application needs both properties.
				</div>
			</div>
		</DemoSection>
	);
}

function ChoiceCard({
	active,
	label,
	detail,
	onClick,
	accent,
}: {
	active: boolean;
	label: string;
	detail: string;
	onClick: () => void;
	accent: "cyan" | "violet";
}) {
	const classes = active
		? accent === "cyan"
			? "border-cyan-500/60 bg-cyan-500/10"
			: "border-violet-500/60 bg-violet-500/10"
		: "border-zinc-700 bg-zinc-900";
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-lg border p-4 text-left transition-colors hover:border-zinc-500 ${classes}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="text-sm font-medium text-zinc-200">{label}</div>
					<div className="mt-1 text-xs text-zinc-500">{detail}</div>
				</div>
				<span
					className={`mt-1 h-4 w-4 rounded border ${active ? (accent === "cyan" ? "border-cyan-400 bg-cyan-400" : "border-violet-400 bg-violet-400") : "border-zinc-600"}`}
				/>
			</div>
		</button>
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
