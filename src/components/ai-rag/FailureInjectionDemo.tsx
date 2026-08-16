import { motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

type FailureMode = "none" | "badChunking" | "lowRecall" | "contextBloat";

const USER_QUERY = "How long do I have to ask for a refund?";

type Variant = {
	chunks: string[];
	output: string;
	outputTone: "good" | "bad";
	diagnosis: string;
};

const VARIANTS: Record<FailureMode, Variant> = {
	none: {
		chunks: [
			"Customers may request a refund within 30 days of purchase.",
			"Refunds are issued to the original payment method within 5 business days.",
			"Prorated refunds are not offered for partial months.",
		],
		output: "You have 30 days from your purchase date to request a refund.",
		outputTone: "good",
		diagnosis:
			"Healthy retrieval: focused chunks, the relevant fact is present, prompt fits comfortably.",
	},
	badChunking: {
		chunks: [
			"…some details. Customers may request a refund",
			"within 30 days of purchase. Refunds are issued to",
			"the original payment method within 5 business days.",
		],
		output:
			"Refunds are processed to the original payment method, typically within a few business days.",
		outputTone: "bad",
		diagnosis:
			"Fixed-size chunker split the key sentence across two chunks. Neither chunk alone answers the question, so the model latches onto the nearest complete fact (payment method) instead.",
	},
	lowRecall: {
		chunks: [
			"Subscription cancellations take effect at the end of the current billing cycle.",
			"Account deletion permanently removes saved payment methods.",
			"Refund eligibility excludes digital downloads after first access.",
		],
		output:
			"Based on the provided context, refund timing isn't specified. Digital downloads are excluded once accessed.",
		outputTone: "bad",
		diagnosis:
			"ANN search missed the relevant chunk — possibly low `ef` parameter, stale index, or the query embedding sits in the wrong neighborhood. The model now answers from irrelevant context.",
	},
	contextBloat: {
		chunks: [
			"[1500-token marketing intro about company history…]",
			"[800-token list of supported payment processors…]",
			"Customers may request a refund within 30 days of purchase.",
			"[1200-token unrelated FAQ about shipping…]",
		],
		output:
			"Refund details vary — please check your account settings for specifics on your purchase.",
		outputTone: "bad",
		diagnosis:
			'Top-k was set too high and chunks were too long. The relevant fact is buried mid-context — see the "lost in the middle" effect. Attention dilutes across irrelevant content.',
	},
};

const MODES: { key: FailureMode; label: string }[] = [
	{ key: "none", label: "Healthy" },
	{ key: "badChunking", label: "Bad chunking" },
	{ key: "lowRecall", label: "Low recall" },
	{ key: "contextBloat", label: "Context bloat" },
];

export function FailureInjectionDemo() {
	const [mode, setMode] = useState<FailureMode>("none");
	const variant = VARIANTS[mode];

	return (
		<DemoSection
			title="Demo 3: Failure Injection"
			description="Each RAG stage has its own failure signature. Toggle a failure mode to see which symptom it produces in the final output — the symptoms look similar but the root causes are different."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{MODES.map((m) => (
						<button
							key={m.key}
							type="button"
							onClick={() => setMode(m.key)}
							className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
								mode === m.key
									? "border-violet-500/60 bg-violet-500/10 text-violet-200"
									: "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
							}`}
						>
							{m.label}
						</button>
					))}
				</div>

				<div className="grid lg:grid-cols-2 gap-4">
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Query
						</p>
						<p className="text-sm text-zinc-200 mb-4">"{USER_QUERY}"</p>
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Retrieved context
						</p>
						<motion.div
							key={mode}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="space-y-1.5"
						>
							{variant.chunks.map((c) => (
								<div
									key={`${mode}-${c}`}
									className="text-xs rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-zinc-300 font-mono"
								>
									{c}
								</div>
							))}
						</motion.div>
					</div>

					<div className="space-y-3">
						<div
							className={`rounded-lg border p-4 ${match(variant.outputTone)
								.with("good", () => "border-emerald-500/40 bg-emerald-500/5")
								.with("bad", () => "border-rose-500/40 bg-rose-500/5")
								.exhaustive()}`}
						>
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								LLM output
							</p>
							<motion.p
								key={mode}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className={`text-sm ${match(variant.outputTone)
									.with("good", () => "text-emerald-200")
									.with("bad", () => "text-rose-200")
									.exhaustive()}`}
							>
								{variant.output}
							</motion.p>
						</div>

						<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								Diagnosis
							</p>
							<motion.p
								key={`${mode}-diag`}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="text-xs text-zinc-300 leading-relaxed"
							>
								{variant.diagnosis}
							</motion.p>
						</div>
					</div>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-violet-300 font-medium">Why this matters:</span>{" "}
					All three failure modes produce outputs that <em>look</em> like LLM
					hallucination — but the LLM is doing its job. The bug is upstream.
					Fixing it means inspecting what was retrieved, not tuning the prompt.
				</div>
			</div>
		</DemoSection>
	);
}
