import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { STRATEGY_TRADEOFFS, TRADEOFF_METRICS } from "./data";

const EXPLANATIONS: Record<string, Record<string, string>> = {
	CSR: {
		TTFB: "Server sends empty HTML instantly (just static file)",
		FCP: "Page blank until JS downloads & executes. Slow on 3G.",
		TTI: "Same as FCP - interactive as soon as rendering completes",
		SEO: "Crawlers see empty page. Requires pre-rendering for SEO.",
		Personalization: "All logic client-side, perfect for user-specific UIs",
		Cost: "Cheap: just CDN for static HTML/JS bundles",
		"Build Time": "Fast builds - just bundle JS, no pre-rendering",
	},
	SSR: {
		TTFB: "Slower - server must fetch data & render HTML on each request",
		FCP: "Fast - browser receives full HTML immediately",
		TTI: "Delayed by hydration - page visible but not interactive yet",
		SEO: "Perfect - crawlers see full HTML",
		Personalization: "Excellent - can render per-user on server",
		Cost: "Expensive - needs servers running 24/7 for every request",
		"Build Time": "Fast - no pre-rendering, builds just bundle code",
	},
	SSG: {
		TTFB: "Fastest - CDN serves pre-built HTML from edge",
		FCP: "Fastest - HTML already built, served instantly",
		TTI: "Good - just needs JS to hydrate (no server wait)",
		SEO: "Perfect - HTML pre-built with all content",
		Personalization: "Poor - same static HTML for all users",
		Cost: "Cheapest - just CDN hosting",
		"Build Time": "Slow for large sites - must pre-render every page at build",
	},
	ISR: {
		TTFB: "Fast - serves stale HTML from CDN immediately",
		FCP: "Fast - like SSG, CDN serves cached HTML",
		TTI: "Good - hydration only, no server wait",
		SEO: "Perfect - HTML is pre-built (might be slightly stale)",
		Personalization:
			"Limited - can cache per user segment, but not fully dynamic",
		Cost: "Affordable - CDN + occasional background rebuilds",
		"Build Time": "Fast - only builds pages on-demand, not all upfront",
	},
	"Streaming SSR": {
		TTFB: "Good - shell streams before full content ready",
		FCP: "Fast - shell appears immediately, content fills in",
		TTI: "Good - progressive hydration as chunks arrive",
		SEO: "Perfect - crawlers wait for full HTML stream",
		Personalization: "Excellent - server renders per-request",
		Cost: "Expensive - needs servers for streaming compute",
		"Build Time": "Fast - no pre-rendering required",
	},
};

export function TradeoffMatrix() {
	const [hoveredCell, setHoveredCell] = useState<{
		strategy: string;
		metric: string;
	} | null>(null);

	const getRatingColor = (value: number) => {
		if (value >= 4) return "bg-green-500";
		if (value >= 3) return "bg-yellow-500";
		return "bg-red-500";
	};

	const getRatingWidth = (value: number) => {
		return `${(value / 5) * 100}%`;
	};

	return (
		<DemoSection
			title="Trade-off Matrix"
			description="Every strategy makes different trade-offs. Hover cells to see why each strategy scores the way it does."
		>
			<div className="overflow-x-auto">
				<table className="w-full text-sm border-collapse">
					<thead>
						<tr className="border-b border-border-secondary">
							<th className="text-left p-3 text-text-tertiary font-semibold text-xs uppercase tracking-wider">
								Strategy
							</th>
							{TRADEOFF_METRICS.map((metric) => (
								<th
									key={metric.label}
									className="text-center p-3 text-text-tertiary font-semibold text-xs"
									title={metric.description}
								>
									<div className="flex flex-col items-center gap-1">
										<span>{metric.label}</span>
										<span className="text-[10px] text-text-faint font-normal normal-case">
											{metric.description.split(" - ")[0]}
										</span>
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{STRATEGY_TRADEOFFS.map((strategyData, idx) => (
							<motion.tr
								key={strategyData.strategy}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: idx * 0.1 }}
								className="border-b border-border-primary hover:bg-surface-secondary/30"
							>
								<td className="p-3 font-medium text-text-primary">
									{strategyData.strategy}
								</td>
								{TRADEOFF_METRICS.map((metric) => {
									const metricKey = metric.label.replace(" ", "") as keyof Omit<
										typeof strategyData,
										"strategy"
									>;
									const value = strategyData[metricKey] as number;
									const isHovered =
										hoveredCell?.strategy === strategyData.strategy &&
										hoveredCell?.metric === metric.label;

									// Invert display for Cost and Build Time (lower is better)
									const displayValue =
										metric.label === "Cost" || metric.label === "Build Time"
											? 6 - value
											: value;

									return (
										<td
											key={metric.label}
											className="p-3 relative"
											onMouseEnter={() =>
												setHoveredCell({
													strategy: strategyData.strategy,
													metric: metric.label,
												})
											}
											onMouseLeave={() => setHoveredCell(null)}
										>
											{/* Rating Bar */}
											<div className="relative h-6 bg-surface-secondary rounded-full overflow-hidden">
												<motion.div
													initial={{ width: 0 }}
													animate={{ width: getRatingWidth(displayValue) }}
													transition={{ delay: idx * 0.1, duration: 0.5 }}
													className={`h-full ${getRatingColor(displayValue)}`}
												/>
												<div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-text-primary mix-blend-difference">
													{displayValue}/5
												</div>
											</div>

											{/* Hover Tooltip */}
											{isHovered && (
												<motion.div
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-surface-primary border border-border-secondary text-xs text-text-secondary shadow-xl"
												>
													<div className="font-semibold text-accent-violet mb-1">
														{strategyData.strategy} - {metric.label}
													</div>
													<div>
														{EXPLANATIONS[strategyData.strategy][metric.label]}
													</div>
													{/* Arrow */}
													<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-zinc-700" />
												</motion.div>
											)}
										</td>
									);
								})}
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Legend */}
			<div className="mt-6 flex items-center gap-6 text-xs text-text-tertiary">
				<span className="font-semibold text-text-secondary">Rating:</span>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-green-500" />
					<span>Excellent (4-5)</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-yellow-500" />
					<span>Good (3)</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-red-500" />
					<span>Poor (1-2)</span>
				</div>
			</div>
		</DemoSection>
	);
}
