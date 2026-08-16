import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const TOKENS = [
	"Cancellation",
	" matters",
	" because",
	" the",
	" server",
	" keeps",
	" generating",
	" — ",
	"and",
	" billing",
	" — ",
	"until",
	" it",
	" sees",
	" the",
	" socket",
	" close",
	".",
	" Closing",
	" the",
	" UI",
	" tab",
	" without",
	" an",
	" AbortController",
	" leaks",
	" tokens",
	".",
];

type ServerState = "idle" | "generating" | "aborted" | "done";

export function AbortCleanupDemo() {
	const [tokens, setTokens] = useState<string[]>([]);
	const [serverState, setServerState] = useState<ServerState>("idle");
	const [serverTokensBilled, setServerTokensBilled] = useState(0);
	const [withAbort, setWithAbort] = useState(true);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const abortedRef = useRef(false);

	function start() {
		setTokens([]);
		setServerTokensBilled(0);
		setServerState("generating");
		abortedRef.current = false;

		let idx = 0;
		intervalRef.current = setInterval(() => {
			// Server always produces tokens (and bills) until it sees the abort.
			if (idx >= TOKENS.length) {
				if (intervalRef.current) clearInterval(intervalRef.current);
				setServerState("done");
				return;
			}

			setServerTokensBilled((n) => n + 1);

			// Client only paints tokens if it hasn't aborted (or isn't aborting at all).
			if (!abortedRef.current) {
				setTokens((prev) => [...prev, TOKENS[idx]]);
			}
			idx++;
		}, 280);
	}

	function clientStop() {
		if (withAbort) {
			// AbortController.signal — closes the underlying fetch, server sees socket close.
			abortedRef.current = true;
			if (intervalRef.current) clearInterval(intervalRef.current);
			setServerState("aborted");
		} else {
			// "Just hide the UI" — client stops rendering, but the fetch keeps running.
			// Server keeps producing tokens until the response naturally finishes.
			abortedRef.current = true; // stop painting on client
			// Note: do NOT clear interval — server is still going.
		}
	}

	function reset() {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setTokens([]);
		setServerTokensBilled(0);
		setServerState("idle");
		abortedRef.current = false;
	}

	useEffect(
		() => () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		},
		[],
	);

	const wastedTokens = abortedRef.current
		? serverTokensBilled - tokens.length
		: 0;

	return (
		<DemoSection
			title="Demo 3: Cancellation & Cleanup"
			description="When the user navigates away or clicks stop, the server has no way to know unless the client closes the underlying connection. AbortController is how you close it. Without it, the server keeps generating — and you keep paying."
		>
			<div className="space-y-5">
				{/* Toggle */}
				<div className="flex gap-2 p-1 rounded-lg border border-zinc-800 bg-zinc-900 w-fit">
					{[
						{ value: true, label: "With AbortController" },
						{ value: false, label: "Just hide the UI" },
					].map((opt) => (
						<button
							key={String(opt.value)}
							type="button"
							onClick={() => {
								reset();
								setWithAbort(opt.value);
							}}
							disabled={serverState === "generating"}
							className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
								withAbort === opt.value
									? "bg-violet-500/20 text-violet-300"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Client */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
						<div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
							<span className="text-xs text-zinc-500 uppercase tracking-wider">
								Client (browser)
							</span>
							<span className="text-[10px] font-mono text-zinc-500">
								rendered: {tokens.length}
							</span>
						</div>
						<div className="p-4 min-h-[10rem]">
							<p className="text-zinc-100 text-sm leading-relaxed">
								{tokens.join("")}
								{serverState === "generating" && !abortedRef.current && (
									<span className="ml-0.5 animate-pulse text-cyan-400">▌</span>
								)}
							</p>
						</div>
					</div>

					{/* Server */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
						<div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
							<span className="text-xs text-zinc-500 uppercase tracking-wider">
								Server (inference worker)
							</span>
							<AnimatePresence mode="wait">
								<motion.span
									key={serverState}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className={`text-[10px] font-mono ${
										serverState === "generating"
											? "text-emerald-400"
											: serverState === "aborted"
												? "text-rose-400"
												: serverState === "done"
													? "text-zinc-500"
													: "text-zinc-500"
									}`}
								>
									{serverState === "generating"
										? "● GENERATING"
										: serverState === "aborted"
											? "✕ ABORTED"
											: serverState === "done"
												? "○ COMPLETED"
												: "○ IDLE"}
								</motion.span>
							</AnimatePresence>
						</div>
						<div className="p-4 space-y-3 min-h-[10rem]">
							<div>
								<p className="text-[10px] text-zinc-500 uppercase tracking-wider">
									Tokens generated (billed)
								</p>
								<p className="text-2xl font-mono text-amber-300 mt-1">
									{serverTokensBilled}
								</p>
							</div>
							{wastedTokens > 0 && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="rounded border border-rose-500/30 bg-rose-500/10 p-2"
								>
									<p className="text-[10px] text-rose-400 uppercase tracking-wider">
										Wasted tokens (paid for, never shown)
									</p>
									<p className="text-lg font-mono text-rose-300 mt-0.5">
										{wastedTokens}
									</p>
								</motion.div>
							)}
						</div>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={start}
						disabled={serverState === "generating"}
						className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
					>
						{serverState === "generating" ? "Streaming…" : "Start stream"}
					</button>
					<button
						type="button"
						onClick={clientStop}
						disabled={serverState !== "generating"}
						className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-30 text-white text-sm font-medium transition-colors"
					>
						{withAbort ? "Abort fetch" : "Hide UI"}
					</button>
					{(serverState === "aborted" || serverState === "done") && (
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
						Correct cancellation
					</p>
					<ShikiCode
						language="typescript"
						showLineNumbers={false}
						code={`const controller = new AbortController();

const res = await fetch("/v1/chat/completions", {
  method: "POST",
  body,
  signal: controller.signal, // ← attach signal to fetch
});

// User clicks stop, or component unmounts:
stopButton.onclick = () => controller.abort();

useEffect(() => {
  return () => controller.abort(); // ← critical: abort on unmount
}, []);`}
					/>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-rose-300 font-medium">The silent leak:</span>{" "}
					Closing a React component that holds the fetch promise does{" "}
					<em>not</em> cancel the request. The server keeps decoding tokens
					until the prompt completes, and your bill reflects every one of them.
					Always wire <span className="font-mono">AbortController</span> into
					the effect cleanup.
				</div>
			</div>
		</DemoSection>
	);
}
