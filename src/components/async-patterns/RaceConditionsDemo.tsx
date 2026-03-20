import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type FixMode = "none" | "abort" | "requestId";

interface Request {
	id: number;
	query: string;
	delay: number;
	startedAt: number;
	resolvedAt?: number;
	stale: boolean;
	cancelled: boolean;
}

const NO_FIX_CODE = `// BUG: stale response overwrites fresh one
async function search(query: string) {
  const data = await fetch(\`/api?q=\${query}\`);
  setResults(data);  // may arrive out of order!
}`;

const ABORT_CODE = `// FIX: AbortController cancels in-flight request
const abortRef = useRef<AbortController | null>(null);

async function search(query: string) {
  abortRef.current?.abort();  // cancel previous
  const ctrl = new AbortController();
  abortRef.current = ctrl;

  const data = await fetch(\`/api?q=\${query}\`, {
    signal: ctrl.signal,
  });
  setResults(data);
}`;

const REQUEST_ID_CODE = `// FIX: Request ID ignores stale responses
const reqIdRef = useRef(0);

async function search(query: string) {
  const id = ++reqIdRef.current;
  const data = await fetch(\`/api?q=\${query}\`);
  if (id !== reqIdRef.current) return;  // stale!
  setResults(data);
}`;

const FIX_LABELS: Record<FixMode, string> = {
	none: "No Fix (broken)",
	abort: "AbortController",
	requestId: "Request ID",
};

export function RaceConditionsDemo() {
	const [mode, setMode] = useState<FixMode>("none");
	const [query, setQuery] = useState("");
	const [requests, setRequests] = useState<Request[]>([]);
	const [displayedResult, setDisplayedResult] = useState<string>("");
	const [latency, setLatency] = useState(800);

	const reqCounter = useRef(0);
	const abortCtrl = useRef<AbortController | null>(null);
	const currentReqId = useRef(0);
	const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

	function fireRequest(q: string) {
		if (!q.trim()) return;

		const id = ++reqCounter.current;
		const jitter = Math.random() * latency;
		const delay = latency * 0.4 + jitter;

		// Apply fix logic
		if (mode === "abort") {
			abortCtrl.current?.abort();
			abortCtrl.current = new AbortController();
		}
		if (mode === "requestId") {
			currentReqId.current = id;
		}

		const req: Request = {
			id,
			query: q,
			delay,
			startedAt: Date.now(),
			stale: false,
			cancelled: false,
		};

		setRequests((prev) => [...prev.slice(-6), req]);

		const timer = setTimeout(() => {
			if (
				mode === "abort" &&
				abortCtrl.current?.signal.aborted &&
				id !== reqCounter.current
			) {
				// Mark as cancelled
				setRequests((prev) =>
					prev.map((r) =>
						r.id === id ? { ...r, cancelled: true, resolvedAt: Date.now() } : r,
					),
				);
				return;
			}

			if (mode === "requestId" && id !== currentReqId.current) {
				setRequests((prev) =>
					prev.map((r) =>
						r.id === id ? { ...r, stale: true, resolvedAt: Date.now() } : r,
					),
				);
				return;
			}

			if (mode === "none") {
				// Simulate stale: if not the latest request, mark stale but STILL update UI (the bug)
				const isStale = id !== reqCounter.current;
				setRequests((prev) =>
					prev.map((r) =>
						r.id === id ? { ...r, stale: isStale, resolvedAt: Date.now() } : r,
					),
				);
				setDisplayedResult(`Results for: "${q}" (req #${id})`);
			} else {
				setRequests((prev) =>
					prev.map((r) => (r.id === id ? { ...r, resolvedAt: Date.now() } : r)),
				);
				setDisplayedResult(`Results for: "${q}" (req #${id})`);
			}
		}, delay);

		timerRefs.current.push(timer);
	}

	function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
		const val = e.target.value;
		setQuery(val);
		fireRequest(val);
	}

	function reset() {
		timerRefs.current.forEach(clearTimeout);
		timerRefs.current = [];
		abortCtrl.current = null;
		reqCounter.current = 0;
		currentReqId.current = 0;
		setRequests([]);
		setDisplayedResult("");
		setQuery("");
	}

	const codeMap: Record<FixMode, string> = {
		none: NO_FIX_CODE,
		abort: ABORT_CODE,
		requestId: REQUEST_ID_CODE,
	};

	return (
		<div className="space-y-5">
			{/* Mode selector */}
			<div className="flex flex-wrap gap-2">
				{(["none", "abort", "requestId"] as FixMode[]).map((m) => (
					<button
						key={m}
						type="button"
						onClick={() => {
							setMode(m);
							reset();
						}}
						className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
							mode === m
								? m === "none"
									? "bg-rose-500/20 text-rose-300 border-rose-500/30"
									: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
								: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
						}`}
					>
						{FIX_LABELS[m]}
					</button>
				))}
			</div>

			{/* Controls */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="flex-1">
					<label
						htmlFor="race-query"
						className="text-xs text-zinc-500 block mb-1.5"
					>
						Search query (type fast to trigger race condition)
					</label>
					<input
						id="race-query"
						type="text"
						value={query}
						onChange={handleInput}
						placeholder="Type here..."
						className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
					/>
				</div>
				<div className="w-40">
					<label
						htmlFor="race-latency"
						className="text-xs text-zinc-500 block mb-1.5"
					>
						Max latency: {latency}ms
					</label>
					<input
						id="race-latency"
						type="range"
						min={200}
						max={2000}
						step={100}
						value={latency}
						onChange={(e) => setLatency(Number(e.target.value))}
						className="w-full accent-cyan-500"
					/>
				</div>
				<button
					type="button"
					onClick={reset}
					className="self-end px-3 py-2 rounded-lg text-sm bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 transition-colors"
				>
					↺ Reset
				</button>
			</div>

			{/* Request timeline */}
			<div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 min-h-[120px]">
				<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
					Request Timeline
				</div>
				<AnimatePresence>
					{requests.length === 0 ? (
						<p className="text-xs text-zinc-600 text-center py-4">
							Type above to fire requests...
						</p>
					) : (
						<div className="space-y-2">
							{requests.map((req) => (
								<motion.div
									key={req.id}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									className="flex items-center gap-3 text-xs"
								>
									<span className="text-zinc-600 w-12 shrink-0">#{req.id}</span>
									<span className="text-zinc-400 w-28 truncate shrink-0 font-mono">
										"{req.query}"
									</span>
									<div className="flex-1 relative h-5 bg-zinc-800 rounded overflow-hidden">
										<motion.div
											className={`absolute inset-y-0 left-0 rounded ${
												req.cancelled
													? "bg-zinc-600"
													: req.stale
														? "bg-rose-500/70"
														: req.resolvedAt
															? "bg-emerald-500/70"
															: "bg-cyan-500/50"
											}`}
											initial={{ width: 0 }}
											animate={{
												width: req.resolvedAt || req.cancelled ? "100%" : "60%",
											}}
											transition={{ duration: req.delay / 1000 }}
										/>
									</div>
									<span
										className={`w-20 shrink-0 text-right ${
											req.cancelled
												? "text-zinc-500"
												: req.stale
													? "text-rose-400"
													: req.resolvedAt
														? "text-emerald-400"
														: "text-cyan-400"
										}`}
									>
										{req.cancelled
											? "cancelled"
											: req.stale
												? "stale!"
												: req.resolvedAt
													? "resolved"
													: "pending..."}
									</span>
								</motion.div>
							))}
						</div>
					)}
				</AnimatePresence>
			</div>

			{/* Displayed result */}
			{displayedResult && (
				<motion.div
					key={displayedResult}
					initial={{ opacity: 0, scale: 0.98 }}
					animate={{ opacity: 1, scale: 1 }}
					className={`p-3 rounded-lg border text-sm font-mono ${
						mode === "none" && requests.some((r) => r.stale && r.resolvedAt)
							? "bg-rose-500/10 border-rose-500/20 text-rose-300"
							: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
					}`}
				>
					Displayed: {displayedResult}
				</motion.div>
			)}

			{/* Code */}
			<ShikiCode code={codeMap[mode]} language="typescript" />
		</div>
	);
}
