import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

export function FineTuningDemo() {
	const [activeFlow, setActiveFlow] = useState<"none" | "rag" | "ft">("none");

	const triggerFlow = (flow: "rag" | "ft") => {
		setActiveFlow("none");
		setTimeout(() => setActiveFlow(flow), 100);
	};

	return (
		<DemoSection
			title="Fine-Tuning vs RAG"
			description="Compare retrieving knowledge on-the-fly (RAG) versus baking it into the model's weights (Fine-Tuning)."
		>
			<div className="flex gap-4 mb-6 justify-center">
				<button
					type="button"
					onClick={() => triggerFlow("rag")}
					className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md hover:bg-blue-500/30 transition-colors text-sm font-medium cursor-pointer"
				>
					Run RAG Flow
				</button>
				<button
					type="button"
					onClick={() => triggerFlow("ft")}
					className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md hover:bg-amber-500/30 transition-colors text-sm font-medium cursor-pointer"
				>
					Run Fine-Tuning Flow
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* RAG Lane */}
				<div className="space-y-4">
					<h4 className="text-center text-sm font-semibold text-blue-400 uppercase tracking-wider">
						RAG Architecture
					</h4>
					<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col items-center gap-4 relative min-h-[320px]">
						<Node
							active={activeFlow === "rag"}
							delay={0.1}
							label="User Query"
						/>
						<div className="w-0.5 h-6 bg-zinc-800" />
						<Node
							active={activeFlow === "rag"}
							delay={0.4}
							label="Vector Database"
							highlight="blue"
						/>
						<div className="w-0.5 h-6 bg-zinc-800" />
						<Node
							active={activeFlow === "rag"}
							delay={0.7}
							label="Prompt + Context"
						/>
						<div className="w-0.5 h-6 bg-zinc-800" />
						<Node
							active={activeFlow === "rag"}
							delay={1.0}
							label="Base Model"
							highlight="zinc"
						/>
					</div>
				</div>

				{/* FT Lane */}
				<div className="space-y-4">
					<h4 className="text-center text-sm font-semibold text-amber-400 uppercase tracking-wider">
						Fine-Tuning Architecture
					</h4>
					<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col items-center gap-4 relative min-h-[320px]">
						<Node active={activeFlow === "ft"} delay={0.1} label="User Query" />
						<div className="w-0.5 h-6 bg-zinc-800" />
						<div className="h-[52px]" /> {/* Spacer to align */}
						<div className="w-0.5 h-6 bg-transparent" />
						<div className="h-[52px]" /> {/* Spacer to align */}
						<div className="w-0.5 h-6 bg-transparent" />
						<Node
							active={activeFlow === "ft"}
							delay={0.4}
							label="Fine-Tuned Model"
							highlight="amber"
						/>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}

function Node({
	label,
	active,
	delay,
	highlight = "zinc",
}: {
	label: string;
	active: boolean;
	delay: number;
	highlight?: "zinc" | "blue" | "amber";
}) {
	const colors = {
		zinc: "bg-zinc-800 border-zinc-700 text-zinc-300",
		blue: "bg-blue-950 border-blue-800 text-blue-300",
		amber: "bg-amber-950 border-amber-800 text-amber-300",
	};
	const activeColors = {
		zinc: "bg-zinc-700 border-zinc-500",
		blue: "bg-blue-900 border-blue-500",
		amber: "bg-amber-900 border-amber-500",
	};

	return (
		<motion.div
			animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
			transition={{ duration: 0.3, delay: active ? delay : 0 }}
			className={`px-4 py-3 rounded-md border w-full max-w-[200px] text-center text-sm shadow-sm transition-colors duration-300 ${
				active ? activeColors[highlight] : colors[highlight]
			}`}
		>
			<span className="relative z-10">{label}</span>
		</motion.div>
	);
}
