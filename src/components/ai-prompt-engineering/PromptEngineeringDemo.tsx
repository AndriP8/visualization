import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

export function PromptEngineeringDemo() {
	const [promptMode, setPromptMode] = useState<
		"zero-shot" | "few-shot" | "chain-of-thought" | "system"
	>("zero-shot");

	const outputText = match(promptMode)
		.with(
			"zero-shot",
			() =>
				'{"name": "John", "age": "30"} - wait, is age supposed to be a string or number?',
		)
		.with("few-shot", () => '{"name": "John", "age": 30}')
		.with(
			"chain-of-thought",
			() =>
				'Thinking Process:\n1. Extract name: John\n2. Extract age: 30\n3. Format as JSON with number age.\n\nResult:\n{"name": "John", "age": 30}',
		)
		.with("system", () => '{"name": "John", "age": 30, "error": null}')
		.exhaustive();

	return (
		<DemoSection
			title="Prompt Engineering"
			description="How the structure of your prompt (System instructions, few-shot examples, or zero-shot) shapes the model's output."
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="flex flex-col gap-4">
					<div className="flex gap-2">
						{(
							["zero-shot", "few-shot", "chain-of-thought", "system"] as const
						).map((mode) => (
							<button
								key={mode}
								type="button"
								onClick={() => setPromptMode(mode)}
								className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
									promptMode === mode
										? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
										: "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
								}`}
							>
								{mode}
							</button>
						))}
					</div>
					<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 min-h-[220px]">
						<AnimatePresence mode="popLayout">
							{promptMode === "system" && (
								<motion.div
									key="system"
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md"
								>
									<p className="text-xs text-blue-400 mb-1 font-semibold">
										System
									</p>
									<p className="text-sm text-zinc-300">
										You are a strict JSON extractor. Always return age as a
										number, and include a null error field.
									</p>
								</motion.div>
							)}
							{promptMode === "few-shot" && (
								<motion.div
									key="few-shot"
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md"
								>
									<p className="text-xs text-emerald-400 mb-1 font-semibold">
										Examples
									</p>
									<p className="text-sm text-zinc-300">
										Input: Bob is twenty
										<br />
										Output: {'{ "name": "Bob", "age": 20 }'}
									</p>
								</motion.div>
							)}
							{promptMode === "chain-of-thought" && (
								<motion.div
									key="chain-of-thought"
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md"
								>
									<p className="text-xs text-amber-400 mb-1 font-semibold">
										Instructions
									</p>
									<p className="text-sm text-zinc-300">
										Extract the name and age. Think step-by-step before
										answering.
									</p>
								</motion.div>
							)}
						</AnimatePresence>
						<div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-md">
							<p className="text-xs text-zinc-400 mb-1 font-semibold">User</p>
							<p className="text-sm text-zinc-200">
								Extract: John is 30 years old.
							</p>
						</div>
					</div>
				</div>

				<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col">
					<h4 className="text-sm font-medium text-zinc-400 mb-4">
						Model Output
					</h4>
					<div className="flex-1 flex flex-col justify-center p-4 bg-black/40 rounded-md border border-zinc-800 font-mono text-sm text-emerald-400">
						<motion.span
							key={promptMode}
							initial={{ opacity: 0, filter: "blur(4px)" }}
							animate={{ opacity: 1, filter: "blur(0px)" }}
							className="block whitespace-pre-wrap text-left"
						>
							{outputText}
						</motion.span>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
