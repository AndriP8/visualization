import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type TransferMethod = "copy" | "transfer";

export function TransferableDemo() {
	const [bufferSize, setBufferSize] = useState(10); // MB
	const [transferMethod, setTransferMethod] = useState<TransferMethod>("copy");
	const [isTransferring, setIsTransferring] = useState(false);
	const [sendDuration, setSendDuration] = useState<number | null>(null);
	const [roundTripDuration, setRoundTripDuration] = useState<number | null>(
		null,
	);
	const [mainThreadOwns, setMainThreadOwns] = useState(true);
	const [workerHasBuffer, setWorkerHasBuffer] = useState(false);
	const [bufferNeutered, setBufferNeutered] = useState(false);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		const workerCode = `
			self.onmessage = (event) => {
				const { buffer, method } = event.data;

				self.postMessage({
					success: true,
					bufferSize: buffer.byteLength,
					method
				});
			};
		`;

		const blob = new Blob([workerCode], { type: "application/javascript" });
		workerRef.current = new Worker(URL.createObjectURL(blob));

		return () => {
			workerRef.current?.terminate();
			workerRef.current = null;
		};
	}, []);

	const handleTransfer = () => {
		if (!workerRef.current) return;
		setIsTransferring(true);
		setSendDuration(null);
		setRoundTripDuration(null);
		setBufferNeutered(false);
		setWorkerHasBuffer(false);

		// Create ArrayBuffer
		const buffer = new ArrayBuffer(bufferSize * 1024 * 1024);
		const view = new Uint8Array(buffer);
		view.fill(42); // Fill with data

		const worker = workerRef.current;
		const minDelay = new Promise((resolve) => setTimeout(resolve, 800));

		const roundTripStart = performance.now();

		worker.onmessage = () => {
			const measuredRoundTrip = performance.now() - roundTripStart;
			minDelay.then(() => {
				setRoundTripDuration(measuredRoundTrip);
				setIsTransferring(false);
				setWorkerHasBuffer(false);
				if (transferMethod !== "transfer") {
					setMainThreadOwns(true);
				}
			});
		};

		if (transferMethod === "copy") {
			// Regular postMessage - copies data; main thread retains ownership
			// Measure just the postMessage call — structured clone blocks the main thread
			const sendStart = performance.now();
			worker.postMessage({ buffer, method: "copy" });
			const sendTime = performance.now() - sendStart;
			setSendDuration(sendTime);
			setWorkerHasBuffer(true);
			setMainThreadOwns(true);
		} else {
			// Transfer ownership - zero-copy, buffer is neutered on main thread
			const sendStart = performance.now();
			worker.postMessage({ buffer, method: "transfer" }, [buffer]);
			const sendTime = performance.now() - sendStart;
			setSendDuration(sendTime);
			setMainThreadOwns(false);
			setBufferNeutered(true);
			setWorkerHasBuffer(true);
		}
	};

	// Performance data for different sizes (send time = main thread blocking)
	const performanceData = [
		{ id: "1mb", size: "1 MB", copy: "1–5ms", transfer: "<0.1ms" },
		{ id: "10mb", size: "10 MB", copy: "5–20ms", transfer: "<0.1ms" },
		{ id: "100mb", size: "100 MB", copy: "50–200ms", transfer: "<0.1ms" },
	];

	return (
		<div className="space-y-8">
			{/* Visual representation */}
			<div className="relative">
				<div className="grid grid-cols-2 gap-12">
					{/* Main Thread */}
					<div className="bg-zinc-900 border border-violet-500 rounded-lg p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
							<h3 className="text-lg font-semibold text-violet-300">
								Main Thread
							</h3>
						</div>

						<AnimatePresence mode="wait">
							{mainThreadOwns && !isTransferring ? (
								<motion.div
									key="has-buffer"
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
									className="relative"
								>
									<div className="w-32 h-32 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/50">
										<div className="text-center">
											<div className="text-2xl font-bold text-white">
												{bufferSize}MB
											</div>
											<div className="text-xs text-violet-200">ArrayBuffer</div>
										</div>
									</div>
									<div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
										<span className="text-xs">✓</span>
									</div>
								</motion.div>
							) : bufferNeutered ? (
								<motion.div
									key="neutered"
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
								>
									<div className="w-32 h-32 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
										<div className="text-center">
											<div className="text-2xl font-bold text-zinc-600">0B</div>
											<div className="text-xs text-zinc-600">Neutered</div>
										</div>
									</div>
								</motion.div>
							) : (
								<motion.div
									key="empty"
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
								>
									<div className="w-32 h-32 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
										<div className="text-xs text-zinc-600">No buffer</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Worker Thread */}
					<div className="bg-zinc-900 border border-emerald-500 rounded-lg p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
							<h3 className="text-lg font-semibold text-emerald-300">
								Worker Thread
							</h3>
						</div>

						<AnimatePresence mode="wait">
							{workerHasBuffer ? (
								<motion.div
									key="received"
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
								>
									<div className="w-32 h-32 bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/50">
										<div className="text-center">
											<div className="text-2xl font-bold text-white">
												{bufferSize}MB
											</div>
											<div className="text-xs text-emerald-200">Processing</div>
										</div>
									</div>
								</motion.div>
							) : (
								<motion.div
									key="waiting"
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
								>
									<div className="w-32 h-32 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
										<div className="text-xs text-zinc-600">Waiting</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				{/* Transfer animation */}
				{isTransferring && (
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						<motion.div
							initial={{ x: -200, opacity: 0 }}
							animate={{ x: 200, opacity: 1 }}
							transition={{ duration: 0.8 }}
						>
							<div className="flex items-center gap-2">
								<div className="text-2xl">
									{transferMethod === "transfer" ? "⚡" : "📦"}
								</div>
								<div className="text-xs text-zinc-400">
									{transferMethod === "transfer" ? "Zero-copy" : "Copying..."}
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</div>

			{/* Controls */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
				<div>
					<label
						htmlFor="buffer-size"
						className="block text-sm text-zinc-400 mb-2"
					>
						Buffer Size: {bufferSize} MB
					</label>
					<input
						id="buffer-size"
						type="range"
						min="1"
						max="100"
						value={bufferSize}
						onChange={(e) => setBufferSize(Number(e.target.value))}
						className="w-full"
						disabled={isTransferring}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<button
						type="button"
						onClick={() => {
							setTransferMethod("copy");
							setMainThreadOwns(true);
							setBufferNeutered(false);
							setWorkerHasBuffer(false);
						}}
						className={`px-4 py-3 rounded-lg border-2 transition-all ${
							transferMethod === "copy"
								? "border-amber-500 bg-amber-500/20 text-amber-300"
								: "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
						}`}
					>
						<div className="text-sm font-semibold">📦 Copy (postMessage)</div>
						<div className="text-xs opacity-70">Serialization overhead</div>
					</button>

					<button
						type="button"
						onClick={() => {
							setTransferMethod("transfer");
							setMainThreadOwns(true);
							setBufferNeutered(false);
							setWorkerHasBuffer(false);
						}}
						className={`px-4 py-3 rounded-lg border-2 transition-all ${
							transferMethod === "transfer"
								? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
								: "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
						}`}
					>
						<div className="text-sm font-semibold">⚡ Transfer (zero-copy)</div>
						<div className="text-xs opacity-70">Ownership moves</div>
					</button>
				</div>

				<button
					type="button"
					onClick={handleTransfer}
					disabled={isTransferring}
					className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg text-sm font-semibold transition-colors"
				>
					{isTransferring ? "Transferring..." : "Transfer to Worker"}
				</button>

				{sendDuration !== null && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className={`p-4 rounded-lg border-2 ${
							transferMethod === "transfer"
								? "bg-emerald-500/10 border-emerald-500/30"
								: "bg-amber-500/10 border-amber-500/30"
						}`}
					>
						<div className="flex items-center justify-between">
							<div className="text-center flex-1">
								<div
									className={`text-3xl font-bold ${
										transferMethod === "transfer"
											? "text-emerald-300"
											: "text-amber-300"
									}`}
								>
									{sendDuration < 0.1
										? "<0.1ms"
										: `${sendDuration.toFixed(2)}ms`}
								</div>
								<div className="text-xs text-zinc-400 mt-1">
									Send time (main thread blocked)
								</div>
							</div>
							{roundTripDuration !== null && (
								<div className="text-center flex-1 border-l border-zinc-700 ml-4 pl-4">
									<div className="text-lg font-semibold text-zinc-400">
										{roundTripDuration.toFixed(2)}ms
									</div>
									<div className="text-xs text-zinc-500 mt-1">Round-trip</div>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</div>

			{/* Performance comparison table */}
			<div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
				<h4 className="text-sm font-semibold text-zinc-300 mb-1">
					Performance Comparison
				</h4>
				<p className="text-xs text-zinc-500 mb-4">
					Send time = main thread blocking during postMessage(). Does not
					include worker processing or response. Transfer is always O(1).
				</p>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-800">
								<th className="text-left py-2 text-zinc-400 font-medium">
									Buffer Size
								</th>
								<th className="text-left py-2 text-amber-300 font-medium">
									Send time (copy)
								</th>
								<th className="text-left py-2 text-emerald-300 font-medium">
									Send time (transfer)
								</th>
							</tr>
						</thead>
						<tbody className="text-zinc-400">
							{performanceData.map((row) => (
								<tr key={row.id} className="border-b border-zinc-800/50">
									<td className="py-3 font-mono">{row.size}</td>
									<td className="font-mono text-amber-300">{row.copy}</td>
									<td className="font-mono text-emerald-300">{row.transfer}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Code examples */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h4 className="text-sm font-semibold text-zinc-400 mb-3">
						❌ Slow: Copy (serialization)
					</h4>
					<ShikiCode
						language="javascript"
						code={`// Create large ArrayBuffer
const buffer = new ArrayBuffer(10 * 1024 * 1024); // 10MB
const view = new Uint8Array(buffer);
view.fill(42);

// Copies entire buffer (slow)
worker.postMessage({ buffer });

// Main thread still owns it
console.log(buffer.byteLength); // 10485760`}
						className="text-xs"
					/>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-zinc-400 mb-3">
						✅ Fast: Transfer ownership
					</h4>
					<ShikiCode
						language="javascript"
						code={`// Create large ArrayBuffer
const buffer = new ArrayBuffer(10 * 1024 * 1024); // 10MB
const view = new Uint8Array(buffer);
view.fill(42);

// Transfer ownership (zero-copy)
worker.postMessage({ buffer }, [buffer]);

// Buffer is neutered!
console.log(buffer.byteLength); // 0`}
						className="text-xs"
					/>
				</div>
			</div>

			{/* Use cases */}
			<div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
				<h4 className="text-sm font-semibold text-zinc-300 mb-4">
					When to Use Transferable Objects
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div className="space-y-2">
						<div className="flex items-start gap-2">
							<span className="text-emerald-400">✅</span>
							<div>
								<div className="font-medium text-zinc-300">
									Image Processing
								</div>
								<div className="text-xs text-zinc-500">
									Canvas → OffscreenCanvas
								</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-emerald-400">✅</span>
							<div>
								<div className="font-medium text-zinc-300">
									Audio Processing
								</div>
								<div className="text-xs text-zinc-500">
									Web Audio API worklets
								</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-emerald-400">✅</span>
							<div>
								<div className="font-medium text-zinc-300">
									Video Encoding/Decoding
								</div>
								<div className="text-xs text-zinc-500">Large frame buffers</div>
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex items-start gap-2">
							<span className="text-emerald-400">✅</span>
							<div>
								<div className="font-medium text-zinc-300">
									Large Dataset Manipulation
								</div>
								<div className="text-xs text-zinc-500">
									Binary data processing
								</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-emerald-400">✅</span>
							<div>
								<div className="font-medium text-zinc-300">File Processing</div>
								<div className="text-xs text-zinc-500">
									Reading/writing binary files
								</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-emerald-400">✅</span>
							<div>
								<div className="font-medium text-zinc-300">WebGL Textures</div>
								<div className="text-xs text-zinc-500">
									GPU buffer transfers
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
