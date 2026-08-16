import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

const STANDARD_RESPONSE = "The largest prime number less than 100 is 97.";
const REASONING_PROCESS = [
	"<think>",
	"Let's find the largest prime under 100.",
	"Check numbers downwards from 99.",
	"99 is divisible by 3 and 11.",
	"98 is even.",
	"97 is not divisible by 2, 3, 5, 7.",
	"It must be prime.",
	"</think>",
	"The largest prime number less than 100 is 97.",
];

export function ReasoningModelsDemo() {
	const [active, setActive] = useState<"standard" | "reasoning">("standard");
	const [text, setText] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);

	useEffect(() => {
		if (isGenerating) {
			setText("");
			let i = 0;

			const content =
				active === "standard" ? [STANDARD_RESPONSE] : REASONING_PROCESS;

			const interval = setInterval(
				() => {
					if (i < content.length) {
						setText((prev) => prev + (prev ? "\n" : "") + content[i]);
						i++;
					} else {
						clearInterval(interval);
						setIsGenerating(false);
					}
				},
				active === "standard" ? 800 : 600,
			);

			return () => clearInterval(interval);
		}
	}, [active, isGenerating]);

	return (
		<DemoSection
			title="Reasoning Models (o1 / DeepSeek-R1)"
			description="Unlike standard models that generate tokens directly, reasoning models utilize a native 'think' process before returning the final answer."
		>
			<div className="space-y-6">
				<div className="flex gap-4 justify-center">
					<button
						type="button"
						onClick={() => {
							setActive("standard");
							setIsGenerating(true);
						}}
						disabled={isGenerating}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border disabled:opacity-50 ${
							active === "standard"
								? "bg-blue-500/20 text-blue-300 border-blue-500/30"
								: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
						}`}
					>
						Standard Model
					</button>
					<button
						type="button"
						onClick={() => {
							setActive("reasoning");
							setIsGenerating(true);
						}}
						disabled={isGenerating}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border disabled:opacity-50 ${
							active === "reasoning"
								? "bg-amber-500/20 text-amber-300 border-amber-500/30"
								: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
						}`}
					>
						Reasoning Model
					</button>
				</div>

				<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 min-h-[300px]">
					<div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-md mb-4">
						<p className="text-xs text-zinc-400 mb-1 font-semibold">
							User Prompt
						</p>
						<p className="text-sm text-zinc-200">
							What is the largest prime number less than 100?
						</p>
					</div>

					<div className="p-3 bg-black/40 rounded-md border border-zinc-800 min-h-[160px] font-mono text-sm">
						<p className="text-xs text-emerald-400 mb-2 font-semibold uppercase tracking-wider">
							Output Stream
						</p>
						<div className="text-zinc-300 whitespace-pre-wrap">
							{text.split("\n").map((line) => {
								const isThinkTag = line === "<think>" || line === "</think>";
								const isThought =
									!isThinkTag &&
									active === "reasoning" &&
									line !== "<think>" &&
									line !== "</think>" &&
									line !== REASONING_PROCESS.at(-1);

								return (
									<motion.span
										key={`${line}-${isThought ? "thought" : "answer"}`}
										initial={{ opacity: 0, x: -5 }}
										animate={{ opacity: 1, x: 0 }}
										className={`block ${isThinkTag ? "text-amber-500 font-bold" : ""} ${isThought ? "text-amber-200/70 border-l-2 border-amber-500/30 pl-2 my-1" : ""}`}
									>
										{line}
									</motion.span>
								);
							})}
							{isGenerating && (
								<span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse mt-1" />
							)}
						</div>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
