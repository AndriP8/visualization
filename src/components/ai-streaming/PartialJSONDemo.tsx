import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const FULL_JSON = `{"name":"Ada Lovelace","role":"Engineer","skills":["math","logic"]}`;

const CHUNKS = [
	`{"name":"A`,
	`da Love`,
	`lace","ro`,
	`le":"Engin`,
	`eer","ski`,
	`lls":["m`,
	`ath","lo`,
	`gic"]}`,
];

type Strategy = "naive" | "buffered";

export function PartialJSONDemo() {
	const [strategy, setStrategy] = useState<Strategy>("naive");
	const [buffer, setBuffer] = useState("");
	const [chunkIdx, setChunkIdx] = useState(0);
	const [parseAttempts, setParseAttempts] = useState<
		Array<{ buffer: string; ok: boolean; error?: string }>
	>([]);
	const [running, setRunning] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	function start() {
		setBuffer("");
		setChunkIdx(0);
		setParseAttempts([]);
		setRunning(true);

		let idx = 0;
		let acc = "";
		intervalRef.current = setInterval(() => {
			if (idx >= CHUNKS.length) {
				if (intervalRef.current) clearInterval(intervalRef.current);
				setRunning(false);
				return;
			}
			acc += CHUNKS[idx];
			setBuffer(acc);
			setChunkIdx(idx + 1);

			const target = strategy === "naive" ? CHUNKS[idx] : acc;
			try {
				JSON.parse(target);
				setParseAttempts((prev) => [...prev, { buffer: target, ok: true }]);
			} catch (err) {
				setParseAttempts((prev) => [
					...prev,
					{
						buffer: target,
						ok: false,
						error: (err as Error).message.split("\n")[0],
					},
				]);
			}

			idx++;
		}, 600);
	}

	function reset() {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setBuffer("");
		setChunkIdx(0);
		setParseAttempts([]);
		setRunning(false);
	}

	useEffect(
		() => () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		},
		[],
	);

	const successCount = parseAttempts.filter((p) => p.ok).length;
	const failureCount = parseAttempts.length - successCount;

	return (
		<DemoSection
			title="Demo 4: Partial JSON Accumulation"
			description="Network chunks don't align with JSON token boundaries. A single string value can arrive split across three TCP packets. Parsing each chunk independently is guaranteed to fail — you must accumulate first, parse last."
		>
			<div className="space-y-5">
				{/* Strategy toggle */}
				<div className="flex gap-2 p-1 rounded-lg border border-zinc-800 bg-zinc-900 w-fit">
					{[
						{ value: "naive" as const, label: "Parse each chunk" },
						{ value: "buffered" as const, label: "Accumulate, then parse" },
					].map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => {
								reset();
								setStrategy(opt.value);
							}}
							disabled={running}
							className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
								strategy === opt.value
									? "bg-violet-500/20 text-violet-300"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>

				{/* Chunk arrival stream */}
				<div>
					<p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
						Chunks arriving from the network
					</p>
					<div className="flex flex-wrap gap-2">
						{CHUNKS.map((chunk, i) => (
							<motion.div
								// biome-ignore lint/suspicious/noArrayIndexKey: static array, index is stable
								key={`chunk-${i}`}
								animate={{
									opacity: i < chunkIdx ? 1 : 0.25,
									scale: i === chunkIdx - 1 && running ? 1.05 : 1,
								}}
								transition={{ duration: 0.2 }}
								className={`px-2 py-1 rounded font-mono text-[11px] border ${
									i < chunkIdx
										? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
										: "border-zinc-800 bg-zinc-900 text-zinc-600"
								}`}
							>
								{chunk}
							</motion.div>
						))}
					</div>
				</div>

				{/* Buffer state + parse attempt */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
						<div className="px-3 py-2 border-b border-zinc-800">
							<span className="text-xs text-zinc-500 uppercase tracking-wider">
								{strategy === "naive"
									? "Latest chunk only"
									: "Accumulated buffer"}
							</span>
						</div>
						<div className="p-3 min-h-[6rem] font-mono text-xs text-zinc-300 break-all">
							{strategy === "naive" ? (
								chunkIdx > 0 ? (
									CHUNKS[chunkIdx - 1]
								) : (
									<span className="text-zinc-600 italic">—</span>
								)
							) : (
								buffer || <span className="text-zinc-600 italic">—</span>
							)}
						</div>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
						<div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
							<span className="text-xs text-zinc-500 uppercase tracking-wider">
								JSON.parse() attempts
							</span>
							<div className="flex gap-3 text-[10px] font-mono">
								<span className="text-emerald-400">✓ {successCount}</span>
								<span className="text-rose-400">✕ {failureCount}</span>
							</div>
						</div>
						<div className="p-3 max-h-[10rem] overflow-y-auto space-y-1">
							<AnimatePresence initial={false}>
								{parseAttempts.map((attempt, i) => (
									<motion.div
										// biome-ignore lint/suspicious/noArrayIndexKey: append-only list
										key={`attempt-${i}`}
										initial={{ opacity: 0, x: -6 }}
										animate={{ opacity: 1, x: 0 }}
										className={`text-[11px] font-mono ${
											attempt.ok ? "text-emerald-300" : "text-rose-300"
										}`}
									>
										{attempt.ok ? "✓ parsed" : `✕ ${attempt.error}`}
									</motion.div>
								))}
							</AnimatePresence>
							{parseAttempts.length === 0 && (
								<p className="text-zinc-600 italic text-[11px]">
									No attempts yet.
								</p>
							)}
						</div>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={start}
						disabled={running}
						className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
					>
						{running ? "Streaming…" : "Stream chunks"}
					</button>
					{(running || chunkIdx > 0) && (
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm transition-colors"
						>
							Reset
						</button>
					)}
				</div>

				<div>
					<p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
						Target JSON (after all chunks arrive)
					</p>
					<ShikiCode language="json" showLineNumbers={false} code={FULL_JSON} />
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					{strategy === "naive" ? (
						<>
							<span className="text-rose-300 font-medium">
								Why naive fails:
							</span>{" "}
							TCP doesn't preserve message boundaries.{" "}
							<span className="font-mono">decoder.decode()</span> can return a
							chunk that splits a UTF-8 character, a JSON string, or a key.
							Every individual chunk is a parse error.
						</>
					) : (
						<>
							<span className="text-emerald-300 font-medium">
								Why buffering works:
							</span>{" "}
							Accumulate every chunk into a single buffer, parse only when the
							full document has arrived. For LLM tool calls, libraries like{" "}
							<span className="font-mono">partial-json</span> can parse
							incomplete JSON early — useful for streaming structured output to
							the UI as it generates.
						</>
					)}
				</div>
			</div>
		</DemoSection>
	);
}
