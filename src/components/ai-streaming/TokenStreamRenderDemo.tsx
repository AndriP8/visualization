import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

const RESPONSE_TOKENS = [
	"Server",
	"-",
	"Sent",
	" Events",
	" deliver",
	" tokens",
	" over",
	" a",
	" single",
	" long",
	"-",
	"lived",
	" HTTP",
	" response",
	".",
	" Each",
	" frame",
	" is",
	" a",
	" JSON",
	" delta",
	",",
	" and",
	" the",
	" client",
	" renders",
	" them",
	" incrementally",
	" as",
	" they",
	" arrive",
	".",
];

export function TokenStreamRenderDemo() {
	const [tps, setTps] = useState(30);
	const [tokens, setTokens] = useState<string[]>([]);
	const [running, setRunning] = useState(false);
	const [elapsedMs, setElapsedMs] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef<number>(0);

	function start() {
		setTokens([]);
		setRunning(true);
		setElapsedMs(0);
		startTimeRef.current = performance.now();

		const intervalMs = 1000 / tps;
		let idx = 0;
		intervalRef.current = setInterval(() => {
			if (idx >= RESPONSE_TOKENS.length) {
				if (intervalRef.current) clearInterval(intervalRef.current);
				setRunning(false);
				setElapsedMs(performance.now() - startTimeRef.current);
				return;
			}
			setTokens((prev) => [...prev, RESPONSE_TOKENS[idx]]);
			setElapsedMs(performance.now() - startTimeRef.current);
			idx++;
		}, intervalMs);
	}

	function reset() {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setTokens([]);
		setRunning(false);
		setElapsedMs(0);
	}

	useEffect(
		() => () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		},
		[],
	);

	const progress = (tokens.length / RESPONSE_TOKENS.length) * 100;
	const measuredTps =
		elapsedMs > 0 ? (tokens.length / (elapsedMs / 1000)).toFixed(1) : "0.0";

	return (
		<DemoSection
			title="Demo 2: Progressive Token Rendering"
			description="The reason streaming exists at all: users start reading at the first token instead of waiting for the entire response. Drag the throughput slider to feel the difference between 5 TPS (slow model) and 80 TPS (fast model)."
		>
			<div className="space-y-5">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
						<p className="text-[10px] text-zinc-500 uppercase tracking-wider">
							Target TPS (slider)
						</p>
						<p className="text-xl font-mono text-violet-300 mt-1">{tps}</p>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
						<p className="text-[10px] text-zinc-500 uppercase tracking-wider">
							Measured TPS (live)
						</p>
						<p className="text-xl font-mono text-cyan-300 mt-1">
							{measuredTps}
						</p>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
						<p className="text-[10px] text-zinc-500 uppercase tracking-wider">
							Tokens received
						</p>
						<p className="text-xl font-mono text-emerald-300 mt-1">
							{tokens.length}
							<span className="text-zinc-600 text-sm">
								{" "}
								/ {RESPONSE_TOKENS.length}
							</span>
						</p>
					</div>
				</div>

				<div>
					<label
						htmlFor="tps-slider"
						className="flex items-center justify-between text-xs text-zinc-400 mb-2"
					>
						<span>Tokens per second</span>
						<span className="font-mono text-zinc-500">
							5 (slow) ←→ 80 (fast)
						</span>
					</label>
					<input
						id="tps-slider"
						type="range"
						min={5}
						max={80}
						step={1}
						value={tps}
						onChange={(e) => setTps(Number(e.target.value))}
						disabled={running}
						className="w-full accent-violet-500 disabled:opacity-40"
					/>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 min-h-[10rem]">
					<p className="text-zinc-100 text-sm leading-relaxed">
						{tokens.join("")}
						{running && (
							<span className="ml-0.5 animate-pulse text-cyan-400">▌</span>
						)}
						{!running && tokens.length === 0 && (
							<span className="text-zinc-600 italic">
								Press start to stream the response token-by-token.
							</span>
						)}
					</p>
				</div>

				<div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
					<motion.div
						className="h-full bg-linear-to-r from-violet-500 to-cyan-500"
						animate={{ width: `${progress}%` }}
						transition={{ duration: 0.1 }}
					/>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={start}
						disabled={running}
						className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
					>
						{running ? "Streaming…" : "Start stream"}
					</button>
					{(running || tokens.length > 0) && (
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm transition-colors"
						>
							Reset
						</button>
					)}
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-cyan-300 font-medium">
						Why streaming changes UX:
					</span>{" "}
					Without streaming, a 200-token answer at 30 TPS forces the user to
					wait 6.6s seeing nothing. With streaming, the first token arrives in{" "}
					~33ms after TTFT. Perceived latency drops from{" "}
					<span className="font-mono">total time</span> to{" "}
					<span className="font-mono">TTFT</span>.
				</div>
			</div>
		</DemoSection>
	);
}
