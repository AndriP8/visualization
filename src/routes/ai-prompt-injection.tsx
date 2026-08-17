import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CodeVsDataComparisonDemo } from "../components/ai-prompt-injection/CodeVsDataComparisonDemo";
import { ContextConfusionDemo } from "../components/ai-prompt-injection/ContextConfusionDemo";
import { DualLlmDefenseDemo } from "../components/ai-prompt-injection/DualLlmDefenseDemo";
import { ExfiltrationChainDemo } from "../components/ai-prompt-injection/ExfiltrationChainDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-prompt-injection")({
	component: PromptInjectionPage,
});

function PromptInjectionPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Prompt Injection"
				subtitle="Prompt injection exploits the model's inability to distinguish instructions from data. Attacker-controlled content in the context window can hijack the model's behavior — silently, without any code execution."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Unlike traditional software architectures where execution code
								and user arguments are strictly separated (e.g. prepared SQL
								statements), LLMs operate on a single{" "}
								<span className="text-indigo-300 font-medium">
									unified context window
								</span>
								. Instructions and data are processed together as tokens through
								the same attention weights.
							</p>
							<p>
								In{" "}
								<span className="text-violet-300 font-medium">
									Direct Injection (Jailbreaking)
								</span>
								, a user attempts to bypass safety filters by crafting
								instructions that demand system overrides. In{" "}
								<span className="text-rose-300 font-medium">
									Indirect Injection
								</span>
								, an attacker embeds malicious instructions inside external data
								sources (like websites, emails, or PDF documents) that are
								retrieved by a RAG pipeline or ingested by an agent loop.
							</p>
							<p className="text-zinc-400">
								The demos below walk through direct attention hijacking, the
								indirect exfiltration kill chain (image beacons and tool abuse),
								defense architectures (XML delimiters vs. Simon Willison's
								Dual-LLM pattern), and why prompt injection cannot be solved
								with simple delimiters alone.
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
				<ContextConfusionDemo />
				<ExfiltrationChainDemo />
				<DualLlmDefenseDemo />
				<CodeVsDataComparisonDemo />
			</motion.div>
		</div>
	);
}
