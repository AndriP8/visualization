import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const TOTAL_BLOCKS = 12;
const TARGET_BLOCK = 8; // Where the data actually lives

export function ExecutionEngineDemo() {
	const [activeScan, setActiveScan] = useState<"seq" | "index" | null>(null);
	const [currentStep, setCurrentStep] = useState(-1);
	const [isPlaying, setIsPlaying] = useState(false);

	// Cache state for visual representation
	const [cachedBlocks, setCachedBlocks] = useState<number[]>([]);

	// Setup animation loop
	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;

		if (isPlaying && activeScan) {
			const maxSteps = activeScan === "seq" ? TARGET_BLOCK + 1 : 4; // Index scan takes 4 logical steps (Root -> Leaf -> Block -> Yield)

			if (currentStep < maxSteps) {
				timeout = setTimeout(
					() => {
						setCurrentStep((prev) => prev + 1);
					},
					activeScan === "seq" ? 500 : 350,
				); // Index scan is faster per step (350ms) vs seq scan (500ms)
			} else {
				setIsPlaying(false);
				// Add target to cache if not already there
				setCachedBlocks((prev) =>
					prev.includes(TARGET_BLOCK) ? prev : [...prev, TARGET_BLOCK],
				);
			}
		}

		return () => clearTimeout(timeout);
	}, [isPlaying, activeScan, currentStep]);

	const handlePlay = (type: "seq" | "index") => {
		if (isPlaying) return;
		setActiveScan(type);
		setCurrentStep(0);
		setIsPlaying(true);
	};

	const handleReset = () => {
		setIsPlaying(false);
		setActiveScan(null);
		setCurrentStep(-1);
		setCachedBlocks([]); // Clear cache on reset
	};

	// Helper to determine block state during Seq Scan
	const getSeqBlockState = (index: number) => {
		if (activeScan !== "seq") return "idle";
		if (currentStep < 0) return "idle";
		if (currentStep === index) return "reading";
		if (index === TARGET_BLOCK && currentStep > TARGET_BLOCK) return "found";
		if (index < currentStep) return "scanned";
		return "idle";
	};

	// Helper to determine target block state during Index Scan
	const getIndexBlockState = (index: number) => {
		if (activeScan !== "index") return "idle";
		if (index !== TARGET_BLOCK) return "idle";
		if (currentStep === 2) return "reading";
		if (currentStep > 2) return "found";
		return "idle";
	};

	return (
		<div className="space-y-6">
			<div className="bg-surface-primary border border-border-primary rounded-xl p-5 flex flex-col md:flex-row gap-6 items-center justify-between">
				<div>
					<h4 className="text-text-primary font-semibold flex items-center gap-2">
						<span>🏃</span> Execution Strategies
					</h4>
					<p className="text-sm text-text-tertiary mt-1 max-w-lg">
						The Executor implements the Volcano (Iterator) Model. A parent node
						calls <code>Next()</code> on its children. Watch how{" "}
						<strong>Seq Scan</strong> linearly fetches pages vs{" "}
						<strong>Index Scan</strong> hopping via a B-Tree directly to the
						target page.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => handlePlay("seq")}
						disabled={isPlaying}
						className="px-4 py-2 bg-surface-secondary hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed border border-border-secondary rounded-lg text-sm font-medium transition-colors text-text-primary"
					>
						▶ Play Seq Scan
					</button>
					<button
						type="button"
						onClick={() => handlePlay("index")}
						disabled={isPlaying}
						className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500 rounded-lg text-sm font-medium transition-colors text-text-primary"
					>
						▶ Play Index Scan
					</button>
					<button
						type="button"
						onClick={handleReset}
						disabled={isPlaying}
						className="px-4 py-2 bg-surface-primary hover:bg-red-500/10 hover:text-accent-red-soft disabled:opacity-50 disabled:cursor-not-allowed border border-border-primary rounded-lg text-sm transition-colors text-text-tertiary"
					>
						Reset
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-100">
				{/* Block Storage / Disk View */}
				<div className="bg-surface-primary border border-border-primary p-6 rounded-xl flex flex-col">
					<div className="flex justify-between items-center mb-6 border-b border-border-primary pb-4">
						<h5 className="font-semibold text-text-secondary">
							Disk Pages (Storage)
						</h5>
						<div className="flex gap-4 text-xs font-mono">
							<span className="flex items-center gap-1">
								<span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500 block" />{" "}
								Cache Hit
							</span>
							<span className="flex items-center gap-1">
								<span className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500 block" />{" "}
								Cache Miss (I/O)
							</span>
						</div>
					</div>

					<div className="flex-1 grid grid-cols-4 gap-3 content-start">
						{Array.from({ length: TOTAL_BLOCKS }).map((_, i) => {
							const seqState = getSeqBlockState(i);
							const idxState = getIndexBlockState(i);

							const isActive = seqState === "reading" || idxState === "reading";
							const isFound = seqState === "found" || idxState === "found";
							const isScanned = seqState === "scanned";
							const isCached = cachedBlocks.includes(i);

							let bgClass = "bg-surface-base border-border-primary";
							let labelClass = "text-text-faint";

							if (isActive) {
								bgClass = isCached
									? "bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
									: "bg-orange-500/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]";
								labelClass = isCached
									? "text-accent-emerald-soft"
									: "text-accent-orange-soft";
							} else if (isFound) {
								bgClass = "bg-violet-500/20 border-violet-500";
								labelClass = "text-accent-violet";
							} else if (isScanned) {
								bgClass =
									"bg-surface-secondary border-border-secondary opacity-50";
								labelClass = "text-text-muted";
							} else if (isCached) {
								bgClass = "bg-surface-primary border-emerald-500/30";
							}

							return (
								<motion.div
									key={`page-${i}-${isCached ? "hit" : "miss"}`}
									layout
									className={`
										relative h-16 rounded-lg border flex items-center justify-center transition-all duration-300
										${bgClass}
									`}
								>
									<span className={`font-mono text-sm font-bold ${labelClass}`}>
										Page {i}
									</span>

									{isActive && (
										<motion.div
											initial={{ scale: 0, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											className={`absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded border ${isCached ? "bg-emerald-950 text-accent-emerald-soft border-emerald-500" : "bg-orange-950 text-accent-orange-soft border-orange-500"}`}
										>
											{isCached ? "HIT" : "MISS"}
										</motion.div>
									)}

									{i === TARGET_BLOCK && isFound && (
										<motion.div
											initial={{ scale: 0, y: 10 }}
											animate={{ scale: 1, y: 0 }}
											className="absolute -bottom-6 bg-violet-500 text-text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap shadow-md z-10"
										>
											Target Row
										</motion.div>
									)}
								</motion.div>
							);
						})}
					</div>
				</div>

				{/* Abstract Representation View */}
				<div className="bg-surface-primary border border-border-primary p-6 rounded-xl flex flex-col relative overflow-hidden">
					<h5 className="font-semibold text-text-secondary mb-6 border-b border-border-primary pb-4">
						Execution View
					</h5>

					<div className="flex-1 flex items-center justify-center">
						<AnimatePresence mode="wait">
							{activeScan === null && (
								<motion.div
									key="empty"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="text-text-muted text-center"
								>
									Play a scan strategy to visualize
								</motion.div>
							)}

							{activeScan === "seq" && (
								<motion.div
									key="seq"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									className="flex flex-col items-center gap-8 w-full"
								>
									<div className="bg-surface-secondary/50 border border-border-secondary px-6 py-3 rounded-xl flex flex-col items-center">
										<span className="font-bold text-text-primary mb-2">
											Seq Scan Node
										</span>
										<div className="text-xs text-text-tertiary bg-surface-base p-2 rounded border border-border-primary font-mono">
											for loop: get_next_page()
										</div>
									</div>

									<div className="w-0.5 h-16 bg-surface-tertiary relative">
										<motion.div
											className="absolute top-0 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
											animate={{ y: [0, 64, 0] }}
											transition={{
												duration: 0.8,
												repeat:
													currentStep < TARGET_BLOCK + 1
														? Number.POSITIVE_INFINITY
														: 0,
											}}
										/>
									</div>

									<div className="text-center">
										<div className="text-xs text-text-muted mb-1">
											Current Action:
										</div>
										<div
											className={`font-mono px-3 py-1 rounded bg-surface-base border border-border-primary ${currentStep > TARGET_BLOCK ? "text-accent-violet-soft" : "text-accent-cyan-soft"}`}
										>
											{currentStep < 0
												? "Ready"
												: currentStep <= TARGET_BLOCK
													? `Reading Page ${currentStep}...`
													: "Yielding Result Tuple ↑"}
										</div>
									</div>
								</motion.div>
							)}

							{activeScan === "index" && (
								<motion.div
									key="index"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									className="flex flex-col items-center gap-6 w-full"
								>
									<div className="bg-violet-500/10 border border-violet-500/30 px-6 py-3 rounded-xl flex flex-col items-center w-full max-w-xs transition-colors">
										<span className="font-bold text-accent-violet mb-2">
											Index Scan Node
										</span>
										<div className="text-xs text-text-tertiary bg-surface-base p-2 rounded border border-border-primary font-mono w-full text-center">
											Condition: <code>age = 25</code>
										</div>
									</div>

									{/* B-Tree: top-down tree layout */}
									<div className="flex flex-col items-center w-full">
										{/* Root Node */}
										<div
											className={`transition-all duration-300 ${currentStep === 0 ? "scale-110" : "scale-100"}`}
										>
											<div
												className={`px-4 py-2 border rounded-lg text-xs font-mono ${currentStep === 0 ? "bg-cyan-500/20 border-cyan-500 text-accent-cyan" : currentStep > 0 ? "bg-surface-secondary border-border-tertiary text-text-tertiary" : "bg-surface-secondary border-border-secondary text-text-faint"}`}
											>
												Root Node
											</div>
										</div>

										{/* Root → fork connector */}
										<div className="relative flex flex-col items-center w-40">
											<div className="w-0.5 h-4 bg-surface-tertiary" />
											<div className="w-full h-px bg-surface-tertiary" />
											<div className="flex justify-between w-full">
												<div className="w-px h-4 bg-surface-tertiary" />
												<div className="w-px h-4 bg-surface-tertiary" />
											</div>
										</div>

										{/* Leaf Nodes row */}
										<div className="flex items-start gap-4">
											{/* Sibling leaf (dimmed) */}
											<div className="flex flex-col items-center opacity-20">
												<div className="px-3 py-1.5 border rounded-lg text-xs font-mono bg-surface-secondary border-border-secondary text-text-muted">
													Leaf Node
												</div>
												<div className="w-px h-8 bg-surface-secondary" />
												<div className="px-3 py-1.5 border rounded-lg text-xs font-mono bg-surface-secondary border-border-secondary text-text-muted">
													Page ...
												</div>
											</div>

											{/* Target leaf */}
											<div
												className={`flex flex-col items-center transition-all duration-300 ${currentStep === 1 ? "scale-110" : "scale-100"}`}
											>
												<div
													className={`px-3 py-1.5 border rounded-lg text-xs font-mono ${currentStep === 1 ? "bg-cyan-500/20 border-cyan-500 text-accent-cyan" : currentStep > 1 ? "bg-surface-secondary border-border-tertiary text-text-tertiary" : "bg-surface-secondary border-border-secondary text-text-faint"}`}
												>
													Leaf Node
												</div>

												{/* Leaf → Page connector */}
												{currentStep >= 2 ? (
													<motion.div
														initial={{ scaleY: 0, opacity: 0 }}
														animate={{ scaleY: 1, opacity: 1 }}
														style={{ originY: 0 }}
														className="w-px h-8 bg-linear-to-b from-cyan-500 to-violet-500"
													/>
												) : (
													<div className="w-px h-8 bg-surface-secondary" />
												)}

												{/* Page block */}
												<motion.div
													animate={
														currentStep >= 2 ? { scale: [1, 1.08, 1] } : {}
													}
													transition={{ duration: 0.4 }}
													className={`px-3 py-1.5 border rounded-lg text-xs font-mono transition-all duration-300 ${currentStep === 2 ? "bg-orange-500/20 border-orange-500 text-accent-orange" : currentStep >= 3 ? "bg-violet-500/20 border-violet-500 text-accent-violet" : "bg-surface-secondary border-border-secondary text-text-faint"}`}
												>
													Page {TARGET_BLOCK}
												</motion.div>
											</div>
										</div>
									</div>

									<div className="text-center mt-2">
										<div className="text-xs text-text-muted mb-1">
											Current Action:
										</div>
										<div
											className={`font-mono px-3 py-1 rounded bg-surface-base border border-border-primary h-8 flex items-center justify-center min-w-50 ${currentStep >= 3 ? "text-accent-violet-soft font-bold" : "text-accent-cyan-soft"}`}
										>
											{currentStep === 0
												? "B-Tree: Reading Root..."
												: currentStep === 1
													? "B-Tree: Reading Leaf..."
													: currentStep === 2
														? `Fetching Page ${TARGET_BLOCK}...`
														: currentStep === 3
															? "Yielding Result Tuple ↑"
															: "Done"}
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</div>
	);
}
