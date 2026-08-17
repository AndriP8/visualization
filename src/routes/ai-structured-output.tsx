import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ConstrainedMaskingDemo } from "../components/ai-structured-output/ConstrainedMaskingDemo";
import { NaivePromptingFailureDemo } from "../components/ai-structured-output/NaivePromptingFailureDemo";
import { RetryCostDemo } from "../components/ai-structured-output/RetryCostDemo";
import { SchemaToGrammarDemo } from "../components/ai-structured-output/SchemaToGrammarDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-structured-output")({
	component: StructuredOutputPage,
});

function StructuredOutputPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Structured Output"
				subtitle="Asking a model for JSON in the prompt fails in predictable ways — missing braces, hallucinated keys, wrong types. Constrained decoding eliminates these failures by restricting which tokens are legal at each decode step."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								There are three levels of guarantee for structured output, and
								most engineers conflate them.{" "}
								<span className="text-violet-300 font-medium">
									Prompt-only JSON
								</span>{" "}
								(“return your answer as JSON”) is plain text generation —
								failures are silent and unbounded.{" "}
								<span className="text-violet-300 font-medium">JSON mode</span>{" "}
								(OpenAI <code>response_format: json_object</code>, similar on
								other providers) guarantees the output is parseable JSON, but
								says nothing about field names, types, or required keys.
							</p>
							<p>
								<span className="text-indigo-300 font-medium">
									Constrained decoding
								</span>{" "}
								is the only level that mathematically guarantees the output
								matches a schema. A JSON Schema is compiled to a grammar; a
								parser walks the grammar in lockstep with the decoder; at every
								step, tokens that cannot continue a valid parse have their
								probabilities set to zero before sampling. Implementations
								differ —{" "}
								<span className="font-mono text-zinc-200">llama.cpp GBNF</span>,{" "}
								<span className="font-mono text-zinc-200">Outlines</span>,{" "}
								<span className="font-mono text-zinc-200">XGrammar</span>, and
								OpenAI’s Structured Outputs — but the shape is the same.
							</p>
							<p className="text-zinc-400">
								The demos below show what naive prompting actually breaks on,
								how a schema becomes a grammar plus a stack-based parser, what
								the per-token mask looks like during decode, and what retry-loop
								cost the constrained approach removes.
							</p>
						</div>
					),
				}}
			/>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<NaivePromptingFailureDemo />
				<SchemaToGrammarDemo />
				<ConstrainedMaskingDemo />
				<RetryCostDemo />
			</motion.div>
		</div>
	);
}
