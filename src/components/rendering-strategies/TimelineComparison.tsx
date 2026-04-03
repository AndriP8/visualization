import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { STRATEGY_TIMELINES } from "./data";

export function TimelineComparison() {
	const [slowNetwork, setSlowNetwork] = useState(false);

	// Logarithmic scaling: log(t + 1) to handle t=0
	const scaleTime = (ms: number, isSlow: boolean) => {
		const multiplier = isSlow ? 3 : 1;
		const scaled = Math.log(ms * multiplier + 1) * 50;
		return scaled;
	};

	return (
		<DemoSection
			title="Timeline Comparison"
			description="Compare how each strategy processes a page request. Watch when HTML is generated and when the page becomes interactive."
		>
			{/* Controls */}
			<div className="flex items-center gap-3 mb-6">
				<button
					type="button"
					onClick={() => setSlowNetwork(!slowNetwork)}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						slowNetwork
							? "bg-orange-500/20 text-accent-orange border border-orange-500/30"
							: "bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary"
					}`}
				>
					{slowNetwork ? "🐌 Slow 3G" : "⚡ Fast Network"}
				</button>
				<span className="text-xs text-text-muted">
					{slowNetwork
						? "Exaggerated delays show CSR's blank screen problem"
						: "Normal network conditions"}
				</span>
			</div>

			{/* Timelines */}
			<div className="space-y-6">
				{STRATEGY_TIMELINES.map((timeline, idx) => {
					return (
						<motion.div
							key={timeline.strategy}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: idx * 0.1 }}
							className="relative"
						>
							{/* Strategy Header */}
							<div className="flex items-center gap-3 mb-3">
								<span className="text-2xl">{timeline.icon}</span>
								<div>
									<h4 className="text-sm font-semibold text-text-primary">
										{timeline.strategy}
									</h4>
									<p className="text-xs text-text-muted">
										{timeline.description}
									</p>
								</div>
							</div>

							{/* Timeline Bar */}
							<div className="relative h-12 bg-surface-secondary/50 rounded-lg border border-border-secondary/50 overflow-hidden">
								{/* Events */}
								{timeline.events.map((event, eventIdx) => {
									const position = scaleTime(
										timeline.timings[eventIdx],
										slowNetwork,
									);
									const prevPosition =
										eventIdx > 0
											? scaleTime(timeline.timings[eventIdx - 1], slowNetwork)
											: 0;
									const width = position - prevPosition;

									return (
										<motion.div
											key={event.label}
											initial={{ width: 0, opacity: 0 }}
											animate={{ width, opacity: 1 }}
											transition={{
												delay: eventIdx * 0.2 + idx * 0.05,
												duration: 0.3,
											}}
											className="absolute top-0 h-full group"
											style={{
												left: `${prevPosition}px`,
												backgroundColor: `${event.color}33`,
												borderRight: `2px solid ${event.color}`,
											}}
											title={event.description || event.label}
										>
											{/* Label */}
											<div
												className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
												text-[10px] font-medium whitespace-nowrap px-1.5 py-0.5 rounded
												bg-surface-primary/80 border border-border-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												{event.label}
											</div>
										</motion.div>
									);
								})}
							</div>

							{/* Milestone Labels Below */}
							<div className="relative h-6 mt-1">
								{timeline.events.map((event, eventIdx) => {
									const position = scaleTime(
										timeline.timings[eventIdx],
										slowNetwork,
									);
									const isLastEvent = eventIdx === timeline.events.length - 1;

									return (
										<div
											key={event.label}
											className="absolute text-[10px] text-text-tertiary whitespace-nowrap"
											style={{
												left: `${position}px`,
												transform: isLastEvent
													? "translateX(-100%)"
													: "translateX(-50%)",
											}}
										>
											{event.label}
										</div>
									);
								})}
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* Legend */}
			<div className="mt-6 p-4 rounded-lg bg-surface-secondary/30 border border-border-secondary/50 text-xs text-text-tertiary space-y-2">
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-text-muted" />
					<span>Request/Wait</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-amber-500" />
					<span>Processing (Server or Client)</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-green-500" />
					<span>First Contentful Paint (FCP)</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-violet-500" />
					<span>Time to Interactive (TTI)</span>
				</div>
			</div>

			{/* Key Insights */}
			<div className="mt-4 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20 text-sm text-text-secondary space-y-2">
				<p className="font-semibold text-accent-violet">Key Insights:</p>
				<ul className="list-disc list-inside space-y-1 text-xs">
					<li>
						<strong className="text-accent-red-soft">CSR</strong> - Long blank
						screen until JS executes. Poor on slow networks.
					</li>
					<li>
						<strong className="text-accent-blue-soft">SSR</strong> - Fast FCP
						(user sees content), but TTI delayed by hydration.
					</li>
					<li>
						<strong className="text-accent-green-soft">SSG</strong> - Fastest
						delivery (CDN edge), but content is static.
					</li>
					<li>
						<strong className="text-accent-cyan-soft">ISR</strong> - Best of
						both: fast like SSG, updates in background.
					</li>
					<li>
						<strong className="text-accent-purple-soft">Streaming SSR</strong> -
						Progressive rendering: shell appears instantly, content fills in.
					</li>
				</ul>
			</div>
		</DemoSection>
	);
}
