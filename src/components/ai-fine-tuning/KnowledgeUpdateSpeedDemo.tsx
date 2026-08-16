import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

type Method = "rag" | "fine-tuning";
type UpdateState = "idle" | "processing" | "complete";

export function KnowledgeUpdateSpeedDemo() {
	const [method, setMethod] = useState<Method>("rag");
	const [status, setStatus] = useState<UpdateState>("idle");
	const timerRef = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(timerRef.current), []);

	const reset = (nextMethod: Method) => {
		window.clearTimeout(timerRef.current);
		setMethod(nextMethod);
		setStatus("idle");
	};

	const update = () => {
		window.clearTimeout(timerRef.current);
		setStatus("processing");
		timerRef.current = window.setTimeout(
			() => setStatus("complete"),
			method === "rag" ? 650 : 1800,
		);
	};

	const details = match({ method, status })
		.with({ method: "rag", status: "processing" }, () => [
			"Chunk document",
			"Embed new fact",
			"Upsert vector index",
		])
		.with({ method: "fine-tuning", status: "processing" }, () => [
			"Prepare examples",
			"Train adapter weights",
			"Publish model version",
		])
		.with({ status: "complete" }, () => [
			"Knowledge is available",
			"Query the updated system",
			"No further work",
		])
		.otherwise(() => [
			"New fact is not indexed",
			"Existing model still answers",
			"Trigger an update to compare",
		]);

	return (
		<DemoSection
			title="Demo 1: Knowledge Update Speed"
			description="RAG changes the retrieval index at runtime; fine-tuning changes model parameters through a training pipeline. The time-to-update difference is the key trade-off for changing facts."
		>
			<div className="space-y-5">
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{(["rag", "fine-tuning"] as const).map((option) => (
						<button
							key={option}
							type="button"
							onClick={() => reset(option)}
							className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
								method === option
									? option === "rag"
										? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
										: "border-amber-500/60 bg-amber-500/10 text-amber-200"
									: "border-zinc-700 text-zinc-400 hover:border-zinc-500"
							}`}
						>
							<div className="font-medium">
								{option === "rag" ? "Update via RAG" : "Update via fine-tuning"}
							</div>
							<div className="mt-0.5 text-[11px] text-zinc-500">
								{option === "rag"
									? "Change the index; keep weights fixed."
									: "Train and publish a new model version."}
							</div>
						</button>
					))}
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							New fact
						</div>
						<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 font-mono text-sm text-zinc-200">
							The CEO of Acme is Jane Doe.
						</div>
						<button
							type="button"
							onClick={update}
							disabled={status !== "idle"}
							className="mt-4 w-full rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-300 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
						>
							{status === "processing"
								? "Updating…"
								: status === "complete"
									? "Update complete"
									: "Trigger update"}
						</button>
						<div className="mt-4 space-y-2">
							{details.map((detail, index) => (
								<motion.div
									key={detail}
									initial={{ opacity: 0.35 }}
									animate={{
										opacity:
											status === "processing" || status === "complete"
												? 1
												: 0.45,
									}}
									className="flex items-center gap-2 text-xs text-zinc-400"
								>
									<span
										className={`h-1.5 w-1.5 rounded-full ${index === 0 && status === "processing" ? "bg-cyan-400 animate-pulse" : status === "complete" ? "bg-emerald-400" : "bg-zinc-700"}`}
									/>
									{detail}
								</motion.div>
							))}
						</div>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							Query after update
						</div>
						<motion.div
							key={status}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							className={`min-h-28 rounded-lg border p-4 font-mono text-sm ${status === "complete" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-zinc-800 bg-zinc-950 text-zinc-500"}`}
						>
							{status === "complete"
								? "The CEO of Acme is Jane Doe."
								: "The system still returns the previous answer."}
						</motion.div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<Metric
						label="Update path"
						value={method === "rag" ? "Index" : "Weights"}
					/>
					<Metric
						label="Freshness"
						value={status === "complete" ? "Current" : "Stale"}
					/>
					<Metric
						label="Update time"
						value={method === "rag" ? "~0.6s" : "~1.8s"}
					/>
					<Metric
						label="Runtime context"
						value={method === "rag" ? "+1 chunk" : "None"}
					/>
				</div>

				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<span className="font-medium text-cyan-300">Read the result:</span>{" "}
					RAG is naturally suited to facts that change. Fine-tuning is better
					suited to stable behavior, style, or task-specific patterns.
				</div>
			</div>
		</DemoSection>
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
