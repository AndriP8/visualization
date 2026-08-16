import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type PromptStyle = "ungrounded" | "grounded";

const USER_QUERY =
	"How long do I have to ask for a refund, and what's the fee?";

const CONTEXT = [
	"Customers may request a refund within 30 days of purchase.",
	"Refunds are issued to the original payment method within 5 business days.",
];

const UNGROUNDED_PROMPT = `Here is some relevant information:
${CONTEXT.map((c) => `- ${c}`).join("\n")}

Answer the user's question: ${USER_QUERY}`;

const GROUNDED_PROMPT = `Answer the user's question using ONLY the context provided.
If the context doesn't contain the answer, reply exactly: "I don't know based on the provided context."
Do not use outside knowledge. Do not infer or speculate.

<context>
${CONTEXT.map((c) => `- ${c}`).join("\n")}
</context>

Question: ${USER_QUERY}`;

const OUTPUTS: Record<PromptStyle, { text: string; verdict: string }> = {
	ungrounded: {
		text: "You have 30 days to request a refund. There is typically no fee for standard refunds, though restocking fees may apply for some physical items.",
		verdict:
			"The 30-day claim is grounded. The fee claim is invented — nothing in the context mentions fees. The model filled the gap with plausible-sounding training-data knowledge. This is hallucination, even though retrieval was perfect.",
	},
	grounded: {
		text: "You have 30 days from your purchase date to request a refund. I don't know what the fee is based on the provided context.",
		verdict:
			"Model answered what the context supports and explicitly refused the rest. Same retrieval, same model — only the prompt enforces the refusal behavior.",
	},
};

export function GroundingDemo() {
	const [style, setStyle] = useState<PromptStyle>("ungrounded");
	const output = OUTPUTS[style];

	return (
		<DemoSection
			title="Demo 4: Grounding — RAG Doesn't Prevent Hallucination"
			description="Retrieving the right context is necessary but not sufficient. If the prompt doesn't instruct the model to stay inside the context, it will pad gaps with training-data knowledge — confidently."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{(["ungrounded", "grounded"] as const).map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => setStyle(s)}
							className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
								style === s
									? "border-violet-500/60 bg-violet-500/10 text-violet-200"
									: "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
							}`}
						>
							{s === "ungrounded" ? "Ungrounded prompt" : "Grounded prompt"}
						</button>
					))}
				</div>

				<div className="grid lg:grid-cols-2 gap-4">
					<div>
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Prompt
						</p>
						<motion.div
							key={style}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							<ShikiCode
								language="text"
								code={
									style === "ungrounded" ? UNGROUNDED_PROMPT : GROUNDED_PROMPT
								}
								className="text-[11px]"
							/>
						</motion.div>
					</div>

					<div className="space-y-3">
						<div
							className={`rounded-lg border p-4 ${
								style === "grounded"
									? "border-emerald-500/40 bg-emerald-500/5"
									: "border-rose-500/40 bg-rose-500/5"
							}`}
						>
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								LLM output (same model, same context)
							</p>
							<motion.p
								key={style}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className={`text-sm ${
									style === "grounded" ? "text-emerald-200" : "text-rose-200"
								}`}
							>
								{output.text}
							</motion.p>
						</div>

						<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								What changed
							</p>
							<motion.p
								key={`${style}-v`}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="text-xs text-zinc-300 leading-relaxed"
							>
								{output.verdict}
							</motion.p>
						</div>
					</div>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-violet-300 font-medium">The takeaway:</span> "R"
					gives the model facts. "AG" still hallucinates unless the prompt sets
					boundaries: explicit refusal instruction, structural markers (
					<span className="font-mono text-zinc-300">&lt;context&gt;</span>{" "}
					tags), and ideally a citation requirement. RAG is a system, not a
					substitute for prompt discipline.
				</div>
			</div>
		</DemoSection>
	);
}
