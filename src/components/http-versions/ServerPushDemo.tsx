import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Mode = "traditional" | "push" | "early-hints";

interface WaterfallStep {
	id: string;
	label: string;
	actor: "client" | "server";
	start: number; // seconds
	duration: number;
	color: string;
}

const LATENCY_OPTIONS = [50, 100, 200, 400];

function buildTraditionalWaterfall(latency: number): WaterfallStep[] {
	const rtt = latency / 1000; // seconds
	return [
		{
			id: "req-html",
			label: "GET /index.html",
			actor: "client",
			start: 0,
			duration: rtt,
			color: "bg-blue-500",
		},
		{
			id: "res-html",
			label: "← HTML response",
			actor: "server",
			start: rtt,
			duration: rtt * 0.4,
			color: "bg-blue-400",
		},
		{
			id: "req-css",
			label: "GET /style.css",
			actor: "client",
			start: rtt * 1.5,
			duration: rtt,
			color: "bg-orange-500",
		},
		{
			id: "res-css",
			label: "← CSS response",
			actor: "server",
			start: rtt * 2.6,
			duration: rtt * 0.3,
			color: "bg-orange-400",
		},
		{
			id: "req-js",
			label: "GET /app.js",
			actor: "client",
			start: rtt * 3.0,
			duration: rtt,
			color: "bg-violet-500",
		},
		{
			id: "res-js",
			label: "← JS response",
			actor: "server",
			start: rtt * 4.1,
			duration: rtt * 0.4,
			color: "bg-violet-400",
		},
	];
}

function buildPushWaterfall(latency: number): WaterfallStep[] {
	const rtt = latency / 1000;
	return [
		{
			id: "req-html",
			label: "GET /index.html",
			actor: "client",
			start: 0,
			duration: rtt,
			color: "bg-blue-500",
		},
		{
			id: "res-html",
			label: "← HTML + PUSH: /style.css + /app.js",
			actor: "server",
			start: rtt,
			duration: rtt * 0.4,
			color: "bg-blue-400",
		},
		{
			id: "push-css",
			label: "← PUSH /style.css",
			actor: "server",
			start: rtt * 1.1,
			duration: rtt * 0.3,
			color: "bg-orange-500",
		},
		{
			id: "push-js",
			label: "← PUSH /app.js",
			actor: "server",
			start: rtt * 1.2,
			duration: rtt * 0.4,
			color: "bg-violet-500",
		},
	];
}

function buildEarlyHintsWaterfall(latency: number): WaterfallStep[] {
	const rtt = latency / 1000;
	return [
		{
			id: "req-html",
			label: "GET /index.html",
			actor: "client",
			start: 0,
			duration: rtt,
			color: "bg-blue-500",
		},
		{
			id: "103",
			label: "← 103 Early Hints (preload CSS, JS)",
			actor: "server",
			start: rtt * 0.3,
			duration: rtt * 0.1,
			color: "bg-emerald-500",
		},
		{
			id: "fetch-css",
			label: "GET /style.css (preload)",
			actor: "client",
			start: rtt * 0.45,
			duration: rtt,
			color: "bg-orange-400",
		},
		{
			id: "fetch-js",
			label: "GET /app.js (preload)",
			actor: "client",
			start: rtt * 0.45,
			duration: rtt * 1.1,
			color: "bg-violet-400",
		},
		{
			id: "200",
			label: "← 200 HTML response",
			actor: "server",
			start: rtt * 1.1,
			duration: rtt * 0.2,
			color: "bg-blue-400",
		},
	];
}

const ANIM_DURATION = 3000;

export function ServerPushDemo() {
	const [mode, setMode] = useState<Mode>("traditional");
	const [latency, setLatency] = useState(200);
	const [animating, setAnimating] = useState(false);
	const [progress, setProgress] = useState(0);
	const animFrameRef = useRef<number | null>(null);
	const startTimeRef = useRef<number>(0);

	const waterfall =
		mode === "traditional"
			? buildTraditionalWaterfall(latency)
			: mode === "push"
				? buildPushWaterfall(latency)
				: buildEarlyHintsWaterfall(latency);

	const totalTime = Math.max(...waterfall.map((s) => s.start + s.duration));

	const startAnimation = useCallback(() => {
		setProgress(0);
		setAnimating(true);
		startTimeRef.current = performance.now();

		const tick = (now: number) => {
			const elapsed = now - startTimeRef.current;
			const p = Math.min(elapsed / ANIM_DURATION, 1);
			setProgress(p);
			if (p < 1) {
				animFrameRef.current = requestAnimationFrame(tick);
			} else {
				setAnimating(false);
			}
		};
		animFrameRef.current = requestAnimationFrame(tick);
	}, []);

	const stopAnimation = useCallback(() => {
		if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
		setAnimating(false);
		setProgress(0);
	}, []);

	useEffect(() => {
		return () => {
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <To reset animation when mode or latency changes>
	useEffect(() => {
		stopAnimation();
	}, [mode, latency, stopAnimation]);

	const currentTime = progress * totalTime;

	const rttCount = mode === "traditional" ? 3 : mode === "push" ? 1 : 1;
	const totalMs = Math.round(totalTime * 1000);

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex gap-2 flex-wrap">
					{[
						{ id: "traditional" as Mode, label: "Traditional (3 RTTs)" },
						{ id: "push" as Mode, label: "Server Push" },
						{ id: "early-hints" as Mode, label: "103 Early Hints" },
					].map(({ id, label }) => (
						<button
							key={id}
							type="button"
							onClick={() => setMode(id)}
							className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
								mode === id
									? id === "traditional"
										? "bg-orange-500/15 text-orange-300 border-orange-500/40"
										: id === "push"
											? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
											: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
									: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
							}`}
						>
							{label}
						</button>
					))}
				</div>

				<div className="flex items-center gap-2">
					<span className="text-xs text-zinc-400">Latency:</span>
					{LATENCY_OPTIONS.map((ms) => (
						<button
							key={ms}
							type="button"
							onClick={() => setLatency(ms)}
							className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
								latency === ms
									? "bg-zinc-600 text-white border-zinc-500"
									: "bg-zinc-800 text-zinc-400 border-zinc-700"
							}`}
						>
							{ms}ms
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Waterfall */}
				<div className="space-y-3">
					<div className="rounded-xl bg-zinc-900 border border-zinc-700 p-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
								Network Timeline
							</span>
							<span className="text-xs font-mono text-zinc-400">
								{rttCount} RTT{rttCount > 1 ? "s" : ""} — ~{totalMs}ms
							</span>
						</div>

						<div className="space-y-2">
							{waterfall.map((step) => {
								const startPct = (step.start / totalTime) * 100;
								const widthPct = (step.duration / totalTime) * 100;
								const endTime = step.start + step.duration;
								const isCompleted = currentTime >= endTime;
								const isInProgress =
									currentTime >= step.start && currentTime < endTime;
								const fillPct = isCompleted
									? widthPct
									: isInProgress
										? ((currentTime - step.start) / step.duration) * widthPct
										: 0;

								return (
									<div key={step.id} className="flex items-center gap-2">
										<span
											className={`text-xs shrink-0 w-4 ${
												step.actor === "client"
													? "text-zinc-500"
													: "text-zinc-500"
											}`}
										>
											{step.actor === "client" ? "→" : "←"}
										</span>
										<div className="flex-1 space-y-0.5">
											<div className="h-5 bg-zinc-800 rounded relative overflow-hidden">
												{/* Ghost */}
												<div
													className={`absolute top-0 h-full rounded opacity-20 ${step.color}`}
													style={{
														left: `${startPct}%`,
														width: `${widthPct}%`,
													}}
												/>
												{/* Fill */}
												{(animating || progress > 0) && (
													<motion.div
														className={`absolute top-0 h-full rounded ${step.color}`}
														style={{ left: `${startPct}%` }}
														animate={{ width: `${fillPct}%` }}
														transition={{ duration: 0.05 }}
													/>
												)}
												<span className="absolute inset-0 flex items-center px-2 text-[10px] text-white/70 font-mono truncate">
													{step.label}
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* Timeline ruler */}
						<div className="relative h-1 bg-zinc-800 rounded-full">
							{(animating || progress > 0) && (
								<motion.div
									className={`absolute top-0 left-0 h-full rounded-full ${
										mode === "traditional"
											? "bg-orange-400"
											: mode === "push"
												? "bg-cyan-400"
												: "bg-emerald-400"
									}`}
									animate={{ width: `${progress * 100}%` }}
									transition={{ duration: 0.05 }}
								/>
							)}
						</div>

						<AnimatePresence>
							{progress >= 1 && (
								<motion.div
									initial={{ opacity: 0, y: 4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									className={`text-xs px-3 py-2 rounded-lg border ${
										mode === "traditional"
											? "bg-orange-500/10 text-orange-300 border-orange-500/20"
											: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
									}`}
								>
									{mode === "traditional"
										? `3 round trips = ${totalMs}ms at ${latency}ms latency`
										: mode === "push"
											? (() => {
													const trad = buildTraditionalWaterfall(latency);
													const tradTotal =
														trad[trad.length - 1].start +
														trad[trad.length - 1].duration;
													const pct = Math.round(
														((tradTotal - totalTime) / tradTotal) * 100,
													);
													return `1 round trip = ${totalMs}ms — ${pct}% faster than traditional`;
												})()
											: `103 Early Hints: preload starts before server finishes rendering HTML`}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<button
						type="button"
						onClick={animating ? stopAnimation : startAnimation}
						className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
							animating
								? "bg-zinc-700 text-zinc-300"
								: "bg-violet-600 hover:bg-violet-500 text-white"
						}`}
					>
						{animating ? "Stop" : progress > 0 ? "Replay" : "Animate"}
					</button>
				</div>

				{/* Code */}
				<div className="space-y-4">
					{mode === "traditional" && (
						<>
							<div className="space-y-2">
								<h4 className="text-sm font-semibold text-zinc-300">
									Traditional Flow — 3 Round Trips
								</h4>
								<p className="text-sm text-zinc-400">
									Client must parse HTML before it knows to fetch CSS and JS.
									Each discovery requires a new round trip.
								</p>
							</div>
							<ShikiCode
								language="bash"
								code={`# Round trip 1
Client → GET /index.html
Server ← 200 HTML (client parses, finds CSS)

# Round trip 2
Client → GET /style.css
Server ← 200 CSS (client parses, finds background-image)

# Round trip 3
Client → GET /app.js
Server ← 200 JS

# Total: ~${totalMs}ms (3 serial round trips)`}
								showLineNumbers={false}
								className="text-xs"
							/>
						</>
					)}

					{mode === "push" && (
						<>
							<div className="space-y-2">
								<h4 className="text-sm font-semibold text-zinc-300">
									HTTP/2 Server Push
								</h4>
								<p className="text-sm text-zinc-400">
									Server proactively pushes CSS and JS alongside the HTML
									response. Client receives them before parsing.
								</p>
							</div>
							<ShikiCode
								language="javascript"
								code={`// Node.js HTTP/2 server
const http2 = require('http2');

server.on('stream', (stream, headers) => {
  if (headers[':path'] === '/') {
    // Push before client asks
    stream.pushStream(
      { ':path': '/style.css' },
      (err, push) => push.respondWithFile('style.css')
    );
    stream.pushStream(
      { ':path': '/app.js' },
      (err, push) => push.respondWithFile('app.js')
    );
    stream.respondWithFile('index.html');
  }
});`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
								<p className="text-xs text-amber-300">
									<span className="font-semibold">Deprecated:</span> Server Push
									was removed from Chrome in 2022. It could push resources the
									client already had cached, wasting bandwidth. Use 103 Early
									Hints instead.
								</p>
							</div>
						</>
					)}

					{mode === "early-hints" && (
						<>
							<div className="space-y-2">
								<h4 className="text-sm font-semibold text-zinc-300">
									103 Early Hints (Modern Approach)
								</h4>
								<p className="text-sm text-zinc-400">
									Server sends a preliminary 103 response with preload hints
									while still generating the full HTML. Client starts fetching
									immediately.
								</p>
							</div>
							<ShikiCode
								language="bash"
								code={`# Server sends 103 immediately (no body)
HTTP/1.1 103 Early Hints
Link: </style.css>; rel=preload; as=style
Link: </app.js>; rel=preload; as=script

# Client starts fetching CSS and JS now
# Meanwhile server finishes rendering HTML...

# Then server sends final response
HTTP/1.1 200 OK
Content-Type: text/html
...`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
								<p className="text-xs text-emerald-300">
									103 Early Hints works best over HTTP/2 (HTTP/1.1 support
									varies by browser), doesn't cache-bust, and is supported in
									Chrome 103+, Firefox 102+.
								</p>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
