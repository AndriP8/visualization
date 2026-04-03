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
					<h3 className="text-sm font-medium text-text-tertiary">
						E-commerce Product Page
					</h3>

					{/* Wireframe */}
					<div className="p-6 bg-surface-primary rounded border border-border-primary space-y-4">
						<div className="h-12 bg-surface-secondary rounded flex items-center justify-center">
							<span className="text-xs text-text-muted">
								Header (logo + nav)
							</span>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="h-48 bg-surface-secondary rounded flex items-center justify-center">
								<span className="text-xs text-text-muted">Product Image</span>
							</div>
							<div className="space-y-3">
								<div className="h-8 bg-surface-secondary rounded flex items-center px-3">
									<span className="text-xs text-text-muted">Product Title</span>
								</div>
								<div className="h-6 bg-surface-secondary rounded flex items-center px-3">
									<span className="text-xs text-text-muted">Price</span>
								</div>
								<div className="h-16 bg-surface-secondary rounded flex items-center px-3">
									<span className="text-xs text-text-muted">Description</span>
								</div>
								<div className="h-10 bg-violet-500/20 border border-violet-500/50 rounded flex items-center justify-center">
									<span className="text-xs text-accent-violet font-medium">
										Add to Cart
									</span>
								</div>
							</div>
						</div>
						<div className="h-8 bg-surface-secondary rounded flex items-center justify-center">
							<span className="text-xs text-text-muted">Next Product Link</span>
						</div>
					</div>

					{/* Strategy Controls */}
					<div className="space-y-3">
						<h4 className="text-sm font-medium text-text-tertiary">
							Resource Hints
						</h4>
						<button
							type="button"
							onClick={() => toggleStrategy("preloadFont")}
							className={`w-full p-3 rounded border text-left transition-colors ${
								strategy.preloadFont
									? "bg-rose-500/20 border-rose-500/50"
									: "bg-surface-primary border-border-primary hover:border-border-secondary"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm font-medium text-text-primary">
									Preload Font
								</span>
								<span
									className={`text-xs ${strategy.preloadFont ? "text-accent-rose" : "text-text-muted"}`}
								>
									{strategy.preloadFont ? "✓ Enabled" : "Disabled"}
								</span>
							</div>
							<code className="text-xs text-text-tertiary font-mono">
								{'<link rel="preload" as="font" href="/font.woff2">'}
							</code>
						</button>

						<button
							type="button"
							onClick={() => toggleStrategy("prefetchNextPage")}
							className={`w-full p-3 rounded border text-left transition-colors ${
								strategy.prefetchNextPage
									? "bg-cyan-500/20 border-cyan-500/50"
									: "bg-surface-primary border-border-primary hover:border-border-secondary"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm font-medium text-text-primary">
									Prefetch Next Page
								</span>
								<span
									className={`text-xs ${strategy.prefetchNextPage ? "text-accent-cyan" : "text-text-muted"}`}
								>
									{strategy.prefetchNextPage ? "✓ Enabled" : "Disabled"}
								</span>
							</div>
							<code className="text-xs text-text-tertiary font-mono">
								{'<link rel="prefetch" href="/product/2">'}
							</code>
						</button>

						<button
							type="button"
							onClick={() => toggleStrategy("dnsPrefetchCDN")}
							className={`w-full p-3 rounded border text-left transition-colors ${
								strategy.dnsPrefetchCDN
									? "bg-amber-500/20 border-amber-500/50"
									: "bg-surface-primary border-border-primary hover:border-border-secondary"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm font-medium text-text-primary">
									DNS Prefetch CDN
								</span>
								<span
									className={`text-xs ${strategy.dnsPrefetchCDN ? "text-accent-amber" : "text-text-muted"}`}
								>
									{strategy.dnsPrefetchCDN ? "✓ Enabled" : "Disabled"}
								</span>
							</div>
							<code className="text-xs text-text-tertiary font-mono">
								{'<link rel="dns-prefetch" href="https://cdn.example.com">'}
							</code>
						</button>
					</div>
				</div>

				{/* Right: Metrics Panel */}
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-text-tertiary">Metrics</h3>

					{/* LCP Metric */}
					<div className="p-4 bg-surface-primary rounded border border-border-primary">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-text-tertiary">
								Largest Contentful Paint (LCP)
							</span>
							{strategy.preloadFont && (
								<span className="text-xs text-accent-green-soft font-medium">
									-800ms
								</span>
							)}
						</div>
						<motion.div
							key={metrics.lcp}
							initial={{ scale: 1.1 }}
							animate={{ scale: 1 }}
							className={`text-3xl font-bold ${metrics.lcp <= 2000 ? "text-accent-green-soft" : "text-accent-amber-soft"}`}
						>
							{metrics.lcp}ms
						</motion.div>
						<div className="mt-2 text-xs text-text-muted">
							{metrics.lcp <= 2000
								? "✓ Good (under 2.5s)"
								: "⚠ Needs improvement"}
						</div>
					</div>

					{/* Wasted Bandwidth */}
					<div className="p-4 bg-surface-primary rounded border border-border-primary">
						<div className="text-sm text-text-tertiary mb-2">
							Wasted Bandwidth (if no navigation)
						</div>
						<motion.div
							key={metrics.wastedBytes}
							initial={{ scale: 1.1 }}
							animate={{ scale: 1 }}
							className={`text-3xl font-bold ${metrics.wastedBytes === 0 ? "text-accent-green-soft" : "text-accent-rose-soft"}`}
						>
							{metrics.wastedBytes}KB
						</motion.div>
					</div>

					{/* Navigation Probability Slider */}
					<div className="p-4 bg-surface-primary rounded border border-border-primary space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm text-text-tertiary">
								Navigation Probability
							</span>
							<span className="text-sm font-medium text-text-primary">
								{navProbability}%
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={navProbability}
							onChange={(e) => setNavProbability(Number(e.target.value))}
							className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-violet-500"
						/>
						<div className="text-xs text-text-muted">
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
							<div className="text-sm text-text-tertiary mb-2">
								Expected Value (Prefetch)
							</div>
							<motion.div
								key={expectedValue}
								initial={{ scale: 1.1 }}
								animate={{ scale: 1 }}
								className={`text-3xl font-bold ${expectedValue > 0 ? "text-accent-green-soft" : "text-accent-rose-soft"}`}
							>
								{expectedValue > 0 ? "+" : ""}
								{expectedValue}ms
							</motion.div>
							<div className="mt-2 text-xs text-text-tertiary space-y-1">
								<div>
									If user navigates ({navProbability}% chance): save 300ms
								</div>
								<div>
									If user doesn't ({100 - navProbability}% chance): waste 80KB
									bandwidth ≈ 64ms cost
								</div>
								<div className="pt-1 border-t border-border-secondary font-medium text-text-secondary">
									Expected value = ({navProbability}% × 300ms) − (
									{100 - navProbability}% × 64ms) = {expectedValue}ms
								</div>
								<div className="pt-1 font-medium">
									{expectedValue > 0 ? (
										<span className="text-accent-green-soft">
											✓ Prefetch improves perceived performance
										</span>
									) : (
										<span className="text-accent-rose-soft">
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
							className="flex-1 px-4 py-2 bg-violet-500 text-text-primary rounded-md text-sm font-medium hover:bg-violet-600 transition-colors"
						>
							Simulate Load
						</button>
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 bg-surface-tertiary text-text-primary rounded-md text-sm font-medium hover:bg-surface-tertiary transition-colors"
						>
							Reset
						</button>
					</div>

					{/* Phase Indicator */}
					{phase !== "idle" && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="p-3 bg-surface-primary rounded border border-border-primary"
						>
							<div className="flex items-center gap-2">
								{phase === "loading" && (
									<>
										<div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
										<span className="text-sm text-text-tertiary">
											Loading page...
										</span>
									</>
								)}
								{phase === "lcp-measured" && (
									<>
										<div className="w-2 h-2 bg-green-400 rounded-full" />
										<span className="text-sm text-text-tertiary">
											LCP: {metrics.lcp}ms
										</span>
									</>
								)}
								{phase === "navigated" && (
									<>
										<div className="w-2 h-2 bg-cyan-400 rounded-full" />
										<span className="text-sm text-text-tertiary">
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
