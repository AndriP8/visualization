import { motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type PromptMode = "zero-shot" | "few-shot";

const PROMPT = `Extract entities from the text and return JSON.

Text: Apple unveiled the new M4 iPad Pro today.`;

export function ZeroShotDemo() {
	const [mode, setMode] = useState<PromptMode>("zero-shot");

	const result = match(mode)
		.with("zero-shot", () => ({
			output: `Sure! I found two entities in your text. The organization is Apple, and the product is the M4 iPad Pro.`,
			format: "Narrative",
			formatScore: 42,
			instructions: "The model must infer the desired response shape.",
		}))
		.with("few-shot", () => ({
			output: `{
  "org": "Apple",
  "product": "M4 iPad Pro"
}`,
			format: "JSON",
			formatScore: 96,
			instructions: "Examples demonstrate both the fields and the exact shape.",
		}))
		.exhaustive();

	return (
		<DemoSection
			title="Demo 1: Zero-Shot vs. Few-Shot"
			description="Examples do not update the model weights; they temporarily show the model what a successful input/output pattern looks like."
		>
			<div className="space-y-5">
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{(["zero-shot", "few-shot"] as const).map((option) => (
						<button
							key={option}
							type="button"
							onClick={() => setMode(option)}
							className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
								mode === option
									? "border-violet-500/60 bg-violet-500/10 text-violet-200"
									: "border-zinc-700 text-zinc-400 hover:border-zinc-500"
							}`}
						>
							<div className="font-medium">
								{option === "zero-shot" ? "Zero-shot" : "Few-shot"}
							</div>
							<div className="mt-0.5 text-[11px] text-zinc-500">
								{option === "zero-shot"
									? "Instruction only; format is inferred."
									: "Instruction plus demonstrations."}
							</div>
						</button>
					))}
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							Prompt sent to the model
						</div>
						{mode === "few-shot" && (
							<div className="mb-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-200">
								<div className="mb-1 text-[10px] uppercase tracking-wider text-cyan-400">
									2 demonstrations added
								</div>
								Input → structured JSON output. The model copies the pattern at
								inference time.
							</div>
						)}
						<ShikiCode code={PROMPT} language="text" showLineNumbers={false} />
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							Observed response
						</div>
						<motion.div
							key={mode}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							className={`min-h-28 whitespace-pre-wrap rounded-lg border p-4 font-mono text-sm ${
								mode === "few-shot"
									? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
									: "border-amber-500/20 bg-amber-500/10 text-amber-200"
							}`}
						>
							{result.output}
						</motion.div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					<Metric label="Output shape" value={result.format} />
					<Metric
						label="Format score"
						value={`${result.formatScore}%`}
						tone={result.formatScore > 80 ? "good" : "warn"}
					/>
					<Metric label="Weights changed" value="No" />
				</div>

				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<span className="font-medium text-violet-300">What changed:</span>{" "}
					{result.instructions} Few-shot prompting spends context tokens to
					improve behavior for this request only.
				</div>
			</div>
		</DemoSection>
	);
}

function Metric({
	label,
	value,
	tone = "neutral",
}: {
	label: string;
	value: string;
	tone?: "neutral" | "good" | "warn";
}) {
	const color = match(tone)
		.with("good", () => "text-emerald-300")
		.with("warn", () => "text-amber-300")
		.with("neutral", () => "text-zinc-200")
		.exhaustive();

	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className={`font-mono text-lg font-semibold ${color}`}>{value}</div>
		</div>
	);
}
