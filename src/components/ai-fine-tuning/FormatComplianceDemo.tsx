import { motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Model = "base" | "fine-tuned";

const SCHEMA = `{
  "name": string,
  "vitals": { "hr": number, "bp": string },
  "notes": string[]
}`;

export function FormatComplianceDemo() {
	const [model, setModel] = useState<Model>("base");
	const output = match(model)
		.with("base", () => ({
			code: `{"name":"John Doe","vitals":{"hr":"85","bp":"120/80"},"notes":"mild headache"}`,
			status: "Schema mismatch",
			score: "61%",
		}))
		.with("fine-tuned", () => ({
			code: `{
  "name": "John Doe",
  "vitals": { "hr": 85, "bp": "120/80" },
  "notes": ["mild headache"]
}`,
			status: "Schema compliant",
			score: "98%",
		}))
		.exhaustive();

	return (
		<DemoSection
			title="Demo 2: Format Compliance"
			description="Fine-tuning can make a repeated output shape more native to the model, reducing instruction overhead. It does not replace schema validation or constrained decoding."
		>
			<div className="space-y-5">
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{(["base", "fine-tuned"] as const).map((option) => (
						<button
							key={option}
							type="button"
							onClick={() => setModel(option)}
							className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
								model === option
									? "border-violet-500/60 bg-violet-500/10 text-violet-200"
									: "border-zinc-700 text-zinc-400 hover:border-zinc-500"
							}`}
						>
							<div className="font-medium">
								{option === "base" ? "Base model" : "Fine-tuned model"}
							</div>
							<div className="mt-0.5 text-[11px] text-zinc-500">
								{option === "base"
									? "Must infer the schema from the prompt."
									: "Has seen this response pattern during training."}
							</div>
						</button>
					))}
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							Target schema
						</div>
						<ShikiCode code={SCHEMA} language="json" showLineNumbers={false} />
						<p className="mt-3 text-xs text-zinc-500">
							Text: Patient John Doe, HR 85, BP 120/80. Complains of mild
							headache.
						</p>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							Observed output
						</div>
						<motion.div
							key={model}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							className={`min-h-28 rounded-lg border p-4 font-mono text-sm ${model === "fine-tuned" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-rose-500/20 bg-rose-500/10 text-rose-300"}`}
						>
							{output.code}
						</motion.div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					<Metric
						label="Compliance"
						value={output.status}
						tone={model === "fine-tuned" ? "good" : "bad"}
					/>
					<Metric
						label="Pass rate"
						value={output.score}
						tone={model === "fine-tuned" ? "good" : "bad"}
					/>
					<Metric label="Runtime schema check" value="Still required" />
				</div>

				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<span className="font-medium text-violet-300">Boundary:</span>{" "}
					training can improve the probability of a format, but validation and
					constrained decoding are what enforce a contract.
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
	tone?: "neutral" | "good" | "bad";
}) {
	const color =
		tone === "good"
			? "text-emerald-300"
			: tone === "bad"
				? "text-rose-300"
				: "text-zinc-200";
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className={`font-mono text-lg font-semibold ${color}`}>{value}</div>
		</div>
	);
}
