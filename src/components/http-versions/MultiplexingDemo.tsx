import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

interface Stream {
	id: number;
	label: string;
	color: string;
	bgColor: string;
	borderColor: string;
	duration: number; // seconds
}

const STREAMS: Stream[] = [
	{
		id: 1,
		label: "HTML",
		color: "text-accent-blue",
		bgColor: "bg-blue-500",
		borderColor: "border-blue-500/40",
		duration: 0.6,
	},
	{
		id: 2,
		label: "CSS (slow)",
		color: "text-accent-orange",
		bgColor: "bg-orange-500",
		borderColor: "border-orange-500/40",
		duration: 3.5,
	},
	{
		id: 3,
		label: "img1",
		color: "text-accent-emerald",
		bgColor: "bg-emerald-500",
		borderColor: "border-emerald-500/40",
		duration: 0.5,
	},
	{
		id: 4,
		label: "img2",
		color: "text-accent-violet",
		bgColor: "bg-violet-500",
		borderColor: "border-violet-500/40",
		duration: 0.7,
	},
	{
		id: 5,
		label: "img3",
		color: "text-accent-rose",
		bgColor: "bg-rose-500",
		borderColor: "border-rose-500/40",
		duration: 0.8,
	},
	{
		id: 6,
		label: "img4",
		color: "text-accent-amber",
		bgColor: "bg-amber-500",
		borderColor: "border-amber-500/40",
		duration: 0.6,
	},
];

// Frame packets for the pipe visualization
interface Frame {
	id: number;
	streamId: number;
	color: string;
}

const TOTAL_TIME = 3.5; // all in parallel, equals the slowest
const ANIM_DURATION = 3200; // ms

function generateFrames(): Frame[] {
	const frames: Frame[] = [];
	let id = 0;
	// Interleave frames from different streams
	for (let round = 0; round < 4; round++) {
		for (const s of STREAMS) {
			frames.push({ id: id++, streamId: s.id, color: s.bgColor });
		}
	}
	return frames;
}

export function MultiplexingDemo() {
	const [animating, setAnimating] = useState(false);
	const [progress, setProgress] = useState(0);
	const [frames, setFrames] = useState<Frame[]>([]);
	const animFrameRef = useRef<number | null>(null);
	const startTimeRef = useRef<number>(0);

	const startAnimation = useCallback(() => {
		setProgress(0);
		setFrames(generateFrames());
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
		setFrames([]);
	}, []);

	useEffect(() => {
		return () => {
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
		};
	}, []);

	const currentTime = progress * TOTAL_TIME;

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Visualization */}
				<div className="space-y-3">
					{/* Stream lanes */}
					<div className="rounded-xl bg-surface-primary border border-border-secondary p-4 space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
								HTTP/2 — Single TCP Connection
							</span>
							<span className="text-xs font-mono text-accent-cyan-soft">
								{animating || progress > 0
									? `${currentTime.toFixed(1)}s`
									: `total: ${TOTAL_TIME}s`}
							</span>
						</div>

						{/* Streams waterfall */}
						<div className="space-y-2">
							{STREAMS.map((stream) => {
								const widthPct = (stream.duration / TOTAL_TIME) * 100;
								const isCompleted = currentTime >= stream.duration;
								const isInProgress =
									currentTime > 0 && currentTime < stream.duration;
								const fillPct = isCompleted
									? widthPct
									: isInProgress
										? (currentTime / stream.duration) * widthPct
										: 0;

								return (
									<div key={stream.id} className="flex items-center gap-2">
										<span
											className={`text-xs w-20 font-mono shrink-0 ${stream.color}`}
										>
											S{stream.id}: {stream.label}
										</span>
										<div className="flex-1 h-5 bg-surface-secondary rounded relative overflow-hidden">
											{/* Ghost */}
											<div
												className={`absolute top-0 left-0 h-full rounded opacity-20 ${stream.bgColor}`}
												style={{ width: `${widthPct}%` }}
											/>
											{/* Fill */}
											{(animating || progress > 0) && (
												<motion.div
													className={`absolute top-0 left-0 h-full rounded ${stream.bgColor}`}
													animate={{ width: `${fillPct}%` }}
													transition={{ duration: 0.05 }}
												/>
											)}
											{/* Completed tick */}
											{isCompleted && progress > 0 && (
												<span className="absolute right-1 top-0.5 text-[10px]">
													✓
												</span>
											)}
										</div>
									</div>
								);
							})}
						</div>

						{/* Progress bar */}
						{(animating || progress > 0) && (
							<div className="relative h-1 bg-surface-secondary rounded-full">
								<motion.div
									className="absolute top-0 left-0 h-full bg-cyan-400 rounded-full"
									animate={{ width: `${progress * 100}%` }}
									transition={{ duration: 0.05 }}
								/>
							</div>
						)}

						{/* Frame pipe visualization */}
						<div className="space-y-2">
							<p className="text-xs text-text-muted">
								TCP pipe (frames interleaved):
							</p>
							<div className="h-8 bg-surface-secondary rounded-lg overflow-hidden relative flex items-center px-2 gap-0.5">
								{animating &&
									frames
										.filter((frame) => {
											const stream = STREAMS.find(
												(s) => s.id === frame.streamId,
											);
											if (!stream) return false;
											return progress < stream.duration / TOTAL_TIME;
										})
										.map((frame, i) => (
											<motion.div
												key={frame.id}
												className={`h-5 w-5 rounded shrink-0 ${frame.color} opacity-80`}
												initial={{ x: 300, opacity: 0 }}
												animate={{ x: 0, opacity: 0.9 }}
												transition={{
													delay: i * 0.08,
													duration: 0.3,
													type: "spring",
													stiffness: 300,
													damping: 25,
												}}
											/>
										))}
								{!animating && frames.length === 0 && (
									<span className="text-xs text-text-faint">
										Click Animate to see interleaved frames
									</span>
								)}
							</div>
						</div>

						{/* Completion */}
						<AnimatePresence>
							{progress >= 1 && (
								<motion.div
									initial={{ opacity: 0, y: 4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									className="text-xs px-3 py-2 rounded-lg border bg-cyan-500/10 text-accent-cyan border-cyan-500/20"
								>
									Done in {TOTAL_TIME}s — only the slowest stream determines
									total time. CSS didn't block anything.
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<button
						type="button"
						onClick={animating ? stopAnimation : startAnimation}
						className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
							animating
								? "bg-surface-tertiary text-text-secondary"
								: "bg-violet-600 hover:bg-violet-500 text-text-primary"
						}`}
					>
						{animating ? "Stop" : progress > 0 ? "Replay" : "Animate"}
					</button>
				</div>

				{/* Explanation */}
				<div className="space-y-4">
					<div className="space-y-2">
						<h4 className="text-sm font-semibold text-text-secondary">
							HTTP/2 Multiplexing
						</h4>
						<p className="text-sm text-text-tertiary">
							HTTP/2 splits each request/response into binary frames and
							interleaves them over a single TCP connection. Each stream is
							independent — a slow CSS file has no effect on the image
							downloads.
						</p>
					</div>

					<ShikiCode
						language="javascript"
						code={`// HTTP/2 multiplexing (browser handles automatically)
// All requests sent immediately over ONE connection

fetch('/style.css');   // Stream 1
fetch('/script.js');   // Stream 2
fetch('/image1.jpg');  // Stream 3
fetch('/image2.jpg');  // Stream 4

// TCP wire carries interleaved frames:
// [S1:frame][S2:frame][S3:frame][S1:frame]...
//
// Slow CSS on S1 doesn't delay S2, S3, S4
// All responses arrive independently`}
						showLineNumbers={false}
						className="text-xs"
					/>

					<div className="space-y-2">
						<p className="text-xs font-semibold text-text-secondary">
							Key HTTP/2 concepts
						</p>
						<div className="space-y-2">
							{[
								{
									term: "Stream",
									def: "A logical bidirectional channel within the connection. Each request/response pair gets one stream.",
									color: "text-accent-cyan-soft",
								},
								{
									term: "Frame",
									def: "The smallest unit of communication — headers, data, priority, etc. Frames from different streams can be interleaved.",
									color: "text-accent-violet-soft",
								},
								{
									term: "Binary protocol",
									def: "HTTP/2 uses binary framing instead of text. Faster to parse, less ambiguous.",
									color: "text-accent-emerald-soft",
								},
							].map(({ term, def, color }) => (
								<div
									key={term}
									className="p-2.5 rounded-lg bg-surface-secondary/50 border border-border-secondary"
								>
									<span className={`text-xs font-semibold ${color}`}>
										{term}:{" "}
									</span>
									<span className="text-xs text-text-tertiary">{def}</span>
								</div>
							))}
						</div>
					</div>

					<div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
						<p className="text-xs text-accent-amber">
							<span className="font-semibold">Note:</span> HTTP/2 solves HOL
							blocking at the HTTP layer. TCP-level HOL blocking still exists —
							a lost packet stalls all streams. HTTP/3 (QUIC) solves this too.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
