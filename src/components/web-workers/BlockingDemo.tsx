import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

export function BlockingDemo() {
	const [mainThreadRunning, setMainThreadRunning] = useState(false);
	const [workerThreadRunning, setWorkerThreadRunning] = useState(false);
	const [mainThreadResult, setMainThreadResult] = useState<number | null>(null);
	const [workerThreadResult, setWorkerThreadResult] = useState<number | null>(
		null,
	);
	const [mainThreadFPS, setMainThreadFPS] = useState(60);
	const [workerThreadFPS, setWorkerThreadFPS] = useState(60);
	const [dragPosition, setDragPosition] = useState({ main: 0, worker: 0 });

	const workerRef = useRef<Worker | null>(null);
	const blobUrlRef = useRef<string | null>(null);

	// FPS monitoring with smoothing
	const fpsRef = useRef({
		lastTime: 0,
		samples: [] as number[],
	});

	const createWorker = useCallback(() => {
		const workerCode = `
			function fibonacci(n) {
				if (n <= 1) return n;
				return fibonacci(n - 1) + fibonacci(n - 2);
			}

			self.onmessage = (e) => {
				const result = fibonacci(e.data);
				self.postMessage(result);
			};
		`;

		if (!blobUrlRef.current) {
			const blob = new Blob([workerCode], { type: "application/javascript" });
			blobUrlRef.current = URL.createObjectURL(blob);
		}

		const worker = new Worker(blobUrlRef.current);
		worker.onmessage = (e) => {
			setWorkerThreadResult(e.data);
			setWorkerThreadRunning(false);
		};
		return worker;
	}, []);

	useEffect(() => {
		workerRef.current = createWorker();

		return () => {
			workerRef.current?.terminate();
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current);
			}
		};
	}, [createWorker]);

	// FPS monitoring - single loop updates both counters
	useEffect(() => {
		let animationFrameId: number;

		const measureFPS = (timestamp: number) => {
			if (fpsRef.current.lastTime) {
				const delta = timestamp - fpsRef.current.lastTime;
				const currentFPS = 1000 / delta;

				// Add to rolling window (0.5s average)
				fpsRef.current.samples.push(currentFPS);
				if (fpsRef.current.samples.length > 30) {
					fpsRef.current.samples.shift();
				}

				// Calculate smoothed FPS, capped at 60
				const avgFPS = Math.min(
					60,
					Math.round(
						fpsRef.current.samples.reduce((a, b) => a + b, 0) /
							fpsRef.current.samples.length,
					),
				);

				// Both counters reflect actual UI responsiveness
				setMainThreadFPS(avgFPS);
				setWorkerThreadFPS(avgFPS);
			}

			fpsRef.current.lastTime = timestamp;
			animationFrameId = requestAnimationFrame(measureFPS);
		};

		animationFrameId = requestAnimationFrame(measureFPS);
		return () => cancelAnimationFrame(animationFrameId);
	}, []);

	const fibonacci = (n: number): number => {
		if (n <= 1) return n;
		return fibonacci(n - 1) + fibonacci(n - 2);
	};

	const runMainThread = () => {
		setMainThreadRunning(true);
		setMainThreadResult(null);

		// Use setTimeout to allow UI to update first
		setTimeout(() => {
			const result = fibonacci(40);
			setMainThreadResult(result);
			setMainThreadRunning(false);
		}, 10);
	};

	const runWorkerThread = () => {
		setWorkerThreadRunning(true);
		setWorkerThreadResult(null);
		workerRef.current?.postMessage(40);
	};

	const cancelWorkerThread = () => {
		workerRef.current?.terminate();
		workerRef.current = createWorker();
		setWorkerThreadRunning(false);
	};

	return (
		<div className="space-y-8">
			{/* Side-by-side comparison */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Main Thread */}
				<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-violet-300">
								❌ Main Thread
							</h3>
							<p className="text-xs text-zinc-500">Blocks UI rendering</p>
						</div>
						<div className="text-right">
							<div className="text-2xl font-mono font-bold text-white">
								{mainThreadFPS}
							</div>
							<div
								className={`text-xs ${mainThreadFPS > 50 ? "text-emerald-400" : "text-red-400"}`}
							>
								FPS
							</div>
						</div>
					</div>

					{/* Interactive elements */}
					<div className="space-y-4 mb-6">
						<motion.div
							className="h-12 bg-violet-500/20 border border-violet-500 rounded flex items-center justify-center cursor-move"
							drag="x"
							dragConstraints={{ left: 0, right: 200 }}
							onDrag={(_, info) =>
								setDragPosition((prev) => ({ ...prev, main: info.offset.x }))
							}
							whileDrag={{ scale: 1.05 }}
						>
							<span className="text-xs text-violet-300">
								Drag me ({Math.round(dragPosition.main)}px)
							</span>
						</motion.div>

						<motion.div
							className="h-2 bg-zinc-800 rounded-full overflow-hidden"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							<motion.div
								className="h-full bg-violet-500"
								animate={{
									x: ["-100%", "100%"],
								}}
								transition={{
									duration: 2,
									repeat: Number.POSITIVE_INFINITY,
									ease: "linear",
								}}
							/>
						</motion.div>
					</div>

					<div className="space-y-3">
						<button
							type="button"
							onClick={runMainThread}
							disabled={mainThreadRunning}
							className="w-full px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:pointer-events-none rounded text-sm font-medium transition-colors"
						>
							{mainThreadRunning ? "Computing..." : "Calculate Fibonacci(40)"}
						</button>

						{mainThreadResult !== null && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-3 bg-violet-500/10 border border-violet-500/30 rounded text-sm"
							>
								<div className="font-mono text-violet-300">
									Result: {mainThreadResult.toLocaleString()}
								</div>
							</motion.div>
						)}
					</div>
				</div>

				{/* Worker Thread */}
				<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-emerald-300">
								✅ Web Worker
							</h3>
							<p className="text-xs text-zinc-500">UI stays responsive</p>
						</div>
						<div className="text-right">
							<div className="text-2xl font-mono font-bold text-white">
								{workerThreadFPS}
							</div>
							<div
								className={`text-xs ${workerThreadFPS > 50 ? "text-emerald-400" : "text-red-400"}`}
							>
								FPS
							</div>
						</div>
					</div>

					{/* Interactive elements */}
					<div className="space-y-4 mb-6">
						<motion.div
							className="h-12 bg-emerald-500/20 border border-emerald-500 rounded flex items-center justify-center cursor-move"
							drag="x"
							dragConstraints={{ left: 0, right: 200 }}
							onDrag={(_, info) =>
								setDragPosition((prev) => ({ ...prev, worker: info.offset.x }))
							}
							whileDrag={{ scale: 1.05 }}
						>
							<span className="text-xs text-emerald-300">
								Drag me ({Math.round(dragPosition.worker)}px)
							</span>
						</motion.div>

						<motion.div
							className="h-2 bg-zinc-800 rounded-full overflow-hidden"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							<motion.div
								className="h-full bg-emerald-500"
								animate={{
									x: ["-100%", "100%"],
								}}
								transition={{
									duration: 2,
									repeat: Number.POSITIVE_INFINITY,
									ease: "linear",
								}}
							/>
						</motion.div>
					</div>

					<div className="space-y-3">
						<button
							type="button"
							onClick={runWorkerThread}
							disabled={workerThreadRunning}
							className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:pointer-events-none rounded text-sm font-medium transition-colors"
						>
							{workerThreadRunning ? "Computing..." : "Calculate Fibonacci(40)"}
						</button>

						{workerThreadRunning && (
							<button
								type="button"
								onClick={cancelWorkerThread}
								className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded text-sm font-medium transition-colors"
							>
								Cancel
							</button>
						)}

						{workerThreadResult !== null && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-sm"
							>
								<div className="font-mono text-emerald-300">
									Result: {workerThreadResult.toLocaleString()}
								</div>
							</motion.div>
						)}
					</div>
				</div>
			</div>

			{/* Code examples */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h4 className="text-sm font-semibold text-zinc-400 mb-3">
						❌ Main Thread - Blocks UI
					</h4>
					<ShikiCode
						language="javascript"
						code={`// Runs on main thread - BLOCKS UI
function calculateFibonacci(n) {
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) +
         calculateFibonacci(n - 2);
}

button.onclick = () => {
  // UI frozen for ~2s
  const result = calculateFibonacci(40);
  display.textContent = result;
};`}
						className="text-xs"
					/>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-zinc-400 mb-3">
						✅ Web Worker - Non-blocking
					</h4>
					<ShikiCode
						language="javascript"
						code={`// Runs in separate thread - UI responsive
const worker = new Worker('fib-worker.js');

button.onclick = () => {
  // UI stays smooth
  worker.postMessage(40);
};

worker.onmessage = (e) => {
  display.textContent = e.data;
};`}
						className="text-xs"
					/>
				</div>
			</div>

			{/* Performance comparison */}
			<div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
				<h4 className="text-sm font-semibold text-zinc-300 mb-4">
					Performance Comparison
				</h4>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-800">
								<th className="text-left py-2 text-zinc-400 font-medium">
									Metric
								</th>
								<th className="text-left py-2 text-violet-300 font-medium">
									Main Thread
								</th>
								<th className="text-left py-2 text-emerald-300 font-medium">
									Web Worker
								</th>
							</tr>
						</thead>
						<tbody className="text-zinc-400">
							<tr className="border-b border-zinc-800/50">
								<td className="py-3">Task Duration</td>
								<td className="font-mono text-violet-300">~2.3s</td>
								<td className="font-mono text-emerald-300">~2.3s</td>
							</tr>
							<tr className="border-b border-zinc-800/50">
								<td className="py-3">UI Responsiveness</td>
								<td className="text-red-400">❌ Frozen</td>
								<td className="text-emerald-400">✅ Smooth</td>
							</tr>
							<tr className="border-b border-zinc-800/50">
								<td className="py-3">FPS During Task</td>
								<td className="font-mono text-red-400">0 fps</td>
								<td className="font-mono text-emerald-400">60 fps</td>
							</tr>
							<tr>
								<td className="py-3">User Can Interact</td>
								<td className="text-red-400">❌ No</td>
								<td className="text-emerald-400">✅ Yes</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p className="mt-4 text-xs text-zinc-500">
					Task duration is identical — Web Workers don't make code faster, they
					prevent UI blocking.
				</p>
			</div>
		</div>
	);
}
