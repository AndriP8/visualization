import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Protocol } from "./types";

interface Strategy {
	preloadFont: boolean;
	prefetchNextPage: boolean;
	dnsPrefetchCDN: boolean;
}

type Phase = "idle" | "loading" | "lcp-measured" | "navigated";

interface PreloadPrefetchDemoProps {
	protocol: Protocol;
}

export default function PreloadPrefetchDemo({
	protocol: _protocol,
}: PreloadPrefetchDemoProps) {
	const [strategy, setStrategy] = useState<Strategy>({
		preloadFont: false,
		prefetchNextPage: false,
		dnsPrefetchCDN: false,
	});

	const [phase, setPhase] = useState<Phase>("idle");
	const [navProbability, setNavProbability] = useState(50);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimeouts = useCallback(() => {
		for (const timeout of timeoutsRef.current) {
			clearTimeout(timeout);
		}
		timeoutsRef.current = [];
	}, []);

	useEffect(() => {
		return () => clearTimeouts();
	}, [clearTimeouts]);

	const metrics = useMemo(() => {
		const baseLCP = 2400;
		const lcpImprovement = strategy.preloadFont ? 800 : 0;
		const lcp = baseLCP - lcpImprovement;

		const wastedBytes = strategy.prefetchNextPage ? 80 : 0;

		return { lcp, wastedBytes };
	}, [strategy]);

	const expectedValue = useMemo(() => {
		if (!strategy.prefetchNextPage) return 0;

		const timeSaved = 300;
		const wastedBytes = 80;
		const bandwidth = 10;
		const wasteCost = (wastedBytes / bandwidth) * 1000;

		const ev =
			(navProbability / 100) * timeSaved -
			(1 - navProbability / 100) * wasteCost;
		return Math.round(ev);
	}, [strategy.prefetchNextPage, navProbability]);

	const toggleStrategy = (key: keyof Strategy) => {
		setStrategy((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const simulate = useCallback(() => {
		clearTimeouts();
		setPhase("loading");

		const timeout1 = setTimeout(() => {
			setPhase("lcp-measured");
		}, 1500);
		timeoutsRef.current.push(timeout1);

		if (strategy.prefetchNextPage && navProbability > 50) {
			const timeout2 = setTimeout(() => {
				setPhase("navigated");
			}, 3000);
			timeoutsRef.current.push(timeout2);
		}
	}, [clearTimeouts, strategy.prefetchNextPage, navProbability]);

	const reset = useCallback(() => {
		clearTimeouts();
		setPhase("idle");
	}, [clearTimeouts]);

	return (
		<div className="space-y-6">
			<div className="grid lg:grid-cols-2 gap-6">
				{/* Left: Page Wireframe + Controls */}
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-zinc-400">
						E-commerce Product Page
					</h3>

					{/* Wireframe */}
					<div className="p-6 bg-zinc-900 rounded border border-zinc-800 space-y-4">
						<div className="h-12 bg-zinc-800 rounded flex items-center justify-center">
							<span className="text-xs text-zinc-500">Header (logo + nav)</span>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="h-48 bg-zinc-800 rounded flex items-center justify-center">
								<span className="text-xs text-zinc-500">Product Image</span>
							</div>
							<div className="space-y-3">
								<div className="h-8 bg-zinc-800 rounded flex items-center px-3">
									<span className="text-xs text-zinc-500">Product Title</span>
								</div>
								<div className="h-6 bg-zinc-800 rounded flex items-center px-3">
									<span className="text-xs text-zinc-500">Price</span>
								</div>
								<div className="h-16 bg-zinc-800 rounded flex items-center px-3">
									<span className="text-xs text-zinc-500">Description</span>
								</div>
								<div className="h-10 bg-violet-500/20 border border-violet-500/50 rounded flex items-center justify-center">
									<span className="text-xs text-violet-300 font-medium">
										Add to Cart
									</span>
								</div>
							</div>
						</div>
						<div className="h-8 bg-zinc-800 rounded flex items-center justify-center">
							<span className="text-xs text-zinc-500">Next Product Link</span>
						</div>
					</div>

					{/* Strategy Controls */}
					<div className="space-y-3">
						<h4 className="text-sm font-medium text-zinc-400">
							Resource Hints
						</h4>
						<button
							type="button"
							onClick={() => toggleStrategy("preloadFont")}
							className={`w-full p-3 rounded border text-left transition-colors ${
								strategy.preloadFont
									? "bg-rose-500/20 border-rose-500/50"
									: "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm font-medium text-white">
									Preload Font
								</span>
								<span
									className={`text-xs ${strategy.preloadFont ? "text-rose-300" : "text-zinc-500"}`}
								>
									{strategy.preloadFont ? "✓ Enabled" : "Disabled"}
								</span>
							</div>
							<code className="text-xs text-zinc-400 font-mono">
								{'<link rel="preload" as="font" href="/font.woff2">'}
							</code>
						</button>

						<button
							type="button"
							onClick={() => toggleStrategy("prefetchNextPage")}
							className={`w-full p-3 rounded border text-left transition-colors ${
								strategy.prefetchNextPage
									? "bg-cyan-500/20 border-cyan-500/50"
									: "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm font-medium text-white">
									Prefetch Next Page
								</span>
								<span
									className={`text-xs ${strategy.prefetchNextPage ? "text-cyan-300" : "text-zinc-500"}`}
								>
									{strategy.prefetchNextPage ? "✓ Enabled" : "Disabled"}
								</span>
							</div>
							<code className="text-xs text-zinc-400 font-mono">
								{'<link rel="prefetch" href="/product/2">'}
							</code>
						</button>

						<button
							type="button"
							onClick={() => toggleStrategy("dnsPrefetchCDN")}
							className={`w-full p-3 rounded border text-left transition-colors ${
								strategy.dnsPrefetchCDN
									? "bg-amber-500/20 border-amber-500/50"
									: "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm font-medium text-white">
									DNS Prefetch CDN
								</span>
								<span
									className={`text-xs ${strategy.dnsPrefetchCDN ? "text-amber-300" : "text-zinc-500"}`}
								>
									{strategy.dnsPrefetchCDN ? "✓ Enabled" : "Disabled"}
								</span>
							</div>
							<code className="text-xs text-zinc-400 font-mono">
								{'<link rel="dns-prefetch" href="https://cdn.example.com">'}
							</code>
						</button>
					</div>
				</div>

				{/* Right: Metrics Panel */}
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-zinc-400">Metrics</h3>

					{/* LCP Metric */}
					<div className="p-4 bg-zinc-900 rounded border border-zinc-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-zinc-400">
								Largest Contentful Paint (LCP)
							</span>
							{strategy.preloadFont && (
								<span className="text-xs text-green-400 font-medium">
									-800ms
								</span>
							)}
						</div>
						<motion.div
							key={metrics.lcp}
							initial={{ scale: 1.1 }}
							animate={{ scale: 1 }}
							className={`text-3xl font-bold ${metrics.lcp <= 2000 ? "text-green-400" : "text-amber-400"}`}
						>
							{metrics.lcp}ms
						</motion.div>
						<div className="mt-2 text-xs text-zinc-500">
							{metrics.lcp <= 2000
								? "✓ Good (under 2.5s)"
								: "⚠ Needs improvement"}
						</div>
					</div>

					{/* Wasted Bandwidth */}
					<div className="p-4 bg-zinc-900 rounded border border-zinc-800">
						<div className="text-sm text-zinc-400 mb-2">
							Wasted Bandwidth (if no navigation)
						</div>
						<motion.div
							key={metrics.wastedBytes}
							initial={{ scale: 1.1 }}
							animate={{ scale: 1 }}
							className={`text-3xl font-bold ${metrics.wastedBytes === 0 ? "text-green-400" : "text-rose-400"}`}
						>
							{metrics.wastedBytes}KB
						</motion.div>
					</div>

					{/* Navigation Probability Slider */}
					<div className="p-4 bg-zinc-900 rounded border border-zinc-800 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm text-zinc-400">
								Navigation Probability
							</span>
							<span className="text-sm font-medium text-white">
								{navProbability}%
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={navProbability}
							onChange={(e) => setNavProbability(Number(e.target.value))}
							className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
						/>
						<div className="text-xs text-zinc-500">
							Likelihood user clicks "Next Product"
						</div>
					</div>

					{/* Expected Value Calculation */}
					{strategy.prefetchNextPage && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className={`p-4 rounded border ${
								expectedValue > 0
									? "bg-green-500/20 border-green-500/50"
									: "bg-rose-500/20 border-rose-500/50"
							}`}
						>
							<div className="text-sm text-zinc-400 mb-2">
								Expected Value (Prefetch)
							</div>
							<motion.div
								key={expectedValue}
								initial={{ scale: 1.1 }}
								animate={{ scale: 1 }}
								className={`text-3xl font-bold ${expectedValue > 0 ? "text-green-400" : "text-rose-400"}`}
							>
								{expectedValue > 0 ? "+" : ""}
								{expectedValue}ms
							</motion.div>
							<div className="mt-2 text-xs text-zinc-400 space-y-1">
								<div>
									If user navigates ({navProbability}% chance): save 300ms
								</div>
								<div>
									If user doesn't ({100 - navProbability}% chance): waste 80KB
									bandwidth ≈ 64ms cost
								</div>
								<div className="pt-1 border-t border-zinc-700 font-medium text-zinc-300">
									Expected value = ({navProbability}% × 300ms) − (
									{100 - navProbability}% × 64ms) = {expectedValue}ms
								</div>
								<div className="pt-1 font-medium">
									{expectedValue > 0 ? (
										<span className="text-green-400">
											✓ Prefetch improves perceived performance
										</span>
									) : (
										<span className="text-rose-400">
											⚠ Prefetch wastes user bandwidth
										</span>
									)}
								</div>
							</div>
						</motion.div>
					)}

					{/* Simulation Controls */}
					<div className="flex gap-2">
						<button
							type="button"
							onClick={simulate}
							className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-md text-sm font-medium hover:bg-violet-600 transition-colors"
						>
							Simulate Load
						</button>
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 bg-zinc-700 text-white rounded-md text-sm font-medium hover:bg-zinc-600 transition-colors"
						>
							Reset
						</button>
					</div>

					{/* Phase Indicator */}
					{phase !== "idle" && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="p-3 bg-zinc-900 rounded border border-zinc-800"
						>
							<div className="flex items-center gap-2">
								{phase === "loading" && (
									<>
										<div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
										<span className="text-sm text-zinc-400">
											Loading page...
										</span>
									</>
								)}
								{phase === "lcp-measured" && (
									<>
										<div className="w-2 h-2 bg-green-400 rounded-full" />
										<span className="text-sm text-zinc-400">
											LCP: {metrics.lcp}ms
										</span>
									</>
								)}
								{phase === "navigated" && (
									<>
										<div className="w-2 h-2 bg-cyan-400 rounded-full" />
										<span className="text-sm text-zinc-400">
											User navigated to next page (+300ms saved!)
										</span>
									</>
								)}
							</div>
						</motion.div>
					)}
				</div>
			</div>
		</div>
	);
}
