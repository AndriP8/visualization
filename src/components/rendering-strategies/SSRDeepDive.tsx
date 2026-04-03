import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface SSRStep {
	id: string;
	label: string;
	description: string;
	location: "browser" | "network" | "server";
	color: string;
	duration: number; // Relative duration for animation
}

const SSR_STEPS: SSRStep[] = [
	{
		id: "request",
		label: "1. Browser Request",
		description: "User navigates to URL, browser sends HTTP GET request",
		location: "browser",
		color: "#64748b",
		duration: 0.3,
	},
	{
		id: "network-to-server",
		label: "2. Network Transit",
		description: "Request travels through internet to origin server",
		location: "network",
		color: "#64748b",
		duration: 0.4,
	},
	{
		id: "server-receives",
		label: "3. Server Receives",
		description: "Server accepts connection, parses request headers",
		location: "server",
		color: "#3b82f6",
		duration: 0.2,
	},
	{
		id: "data-fetch",
		label: "4. Data Fetching",
		description: "Server queries database, calls APIs, fetches data for page",
		location: "server",
		color: "#f59e0b",
		duration: 0.5,
	},
	{
		id: "react-render",
		label: "5. React Render",
		description: "Server executes React components, builds virtual tree",
		location: "server",
		color: "#f59e0b",
		duration: 0.4,
	},
	{
		id: "html-serialize",
		label: "6. HTML Serialization",
		description: "renderToString() converts React tree to HTML string",
		location: "server",
		color: "#f59e0b",
		duration: 0.3,
	},
	{
		id: "response-sent",
		label: "7. Response Sent",
		description: "Server sends complete HTML + HTTP headers to browser",
		location: "server",
		color: "#3b82f6",
		duration: 0.2,
	},
	{
		id: "network-to-browser",
		label: "8. Network Transit",
		description: "HTML travels back through internet",
		location: "network",
		color: "#64748b",
		duration: 0.4,
	},
	{
		id: "browser-receives",
		label: "9. Browser Parses HTML",
		description: "Browser receives HTML, starts parsing DOM (FCP here!)",
		location: "browser",
		color: "#10b981",
		duration: 0.3,
	},
	{
		id: "js-download",
		label: "10. JS Bundle Download",
		description: "Browser fetches React bundles referenced in <script> tags",
		location: "browser",
		color: "#f59e0b",
		duration: 0.5,
	},
	{
		id: "hydration",
		label: "11. Hydration",
		description: "React attaches event handlers to server-rendered HTML",
		location: "browser",
		color: "#f59e0b",
		duration: 0.4,
	},
	{
		id: "interactive",
		label: "12. Interactive (TTI)",
		description: "Page fully interactive, all events wired up",
		location: "browser",
		color: "#8b5cf6",
		duration: 0.2,
	},
];

export function SSRDeepDive() {
	const [currentStep, setCurrentStep] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);

	const handlePlay = () => {
		setIsPlaying(true);
		setCurrentStep(0);
		playAnimation(0);
	};

	const playAnimation = (step: number) => {
		if (step >= SSR_STEPS.length) {
			setIsPlaying(false);
			return;
		}

		setCurrentStep(step);
		setTimeout(() => playAnimation(step + 1), SSR_STEPS[step].duration * 1000);
	};

	const handleReset = () => {
		setIsPlaying(false);
		setCurrentStep(0);
	};

	const handleStepClick = (index: number) => {
		if (!isPlaying) {
			setCurrentStep(index);
		}
	};

	return (
		<DemoSection
			title="SSR Deep Dive: Request Flow Internals"
			description="Step-by-step animation of how a server-side rendered page flows from request to interactive."
		>
			{/* Controls */}
			<div className="flex gap-3 mb-6">
				<button
					type="button"
					onClick={handlePlay}
					disabled={isPlaying}
					className="px-4 py-2 rounded-lg bg-violet-500 text-text-primary text-sm font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isPlaying ? "Playing..." : "▶️ Play Animation"}
				</button>
				<button
					type="button"
					onClick={handleReset}
					className="px-4 py-2 rounded-lg bg-surface-secondary text-text-secondary text-sm font-medium hover:bg-surface-tertiary transition-colors border border-border-secondary"
				>
					Reset
				</button>
			</div>

			{/* Architecture Visualization */}
			<div className="grid grid-cols-3 gap-4 mb-6 min-h-[400px]">
				{/* Browser Column */}
				<div className="p-4 rounded-xl border border-border-secondary bg-surface-secondary/30">
					<div className="text-center mb-4">
						<div className="text-3xl mb-2">💻</div>
						<h4 className="text-sm font-semibold text-text-primary">Browser</h4>
						<p className="text-xs text-text-muted">Client-side</p>
					</div>
					<div className="space-y-2">
						{SSR_STEPS.filter((s) => s.location === "browser").map((step) => {
							const globalIndex = SSR_STEPS.indexOf(step);
							const isActive = currentStep === globalIndex;
							const isPast = currentStep > globalIndex;

							return (
								<motion.div
									key={step.id}
									initial={{ opacity: 0, x: -20 }}
									animate={{
										opacity: isPast || isActive ? 1 : 0.3,
										x: 0,
										scale: isActive ? 1.05 : 1,
									}}
									className={`p-3 rounded-lg border-2 cursor-pointer ${
										isActive
											? "border-violet-500 bg-violet-500/10"
											: "border-border-secondary bg-surface-primary/50"
									}`}
									style={{
										borderColor: isActive ? step.color : undefined,
									}}
									onClick={() => handleStepClick(globalIndex)}
								>
									<div className="text-xs font-semibold text-text-primary mb-1">
										{step.label}
									</div>
									<div className="text-[10px] text-text-tertiary">
										{step.description}
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>

				{/* Network Column */}
				<div className="p-4 rounded-xl border border-border-secondary bg-surface-secondary/30 flex flex-col justify-center">
					<div className="text-center mb-4">
						<div className="text-3xl mb-2">🌐</div>
						<h4 className="text-sm font-semibold text-text-primary">Network</h4>
						<p className="text-xs text-text-muted">Internet transit</p>
					</div>
					<div className="space-y-2">
						{SSR_STEPS.filter((s) => s.location === "network").map((step) => {
							const globalIndex = SSR_STEPS.indexOf(step);
							const isActive = currentStep === globalIndex;
							const isPast = currentStep > globalIndex;

							return (
								<motion.div
									key={step.id}
									initial={{ opacity: 0 }}
									animate={{
										opacity: isPast || isActive ? 1 : 0.3,
									}}
									className={`p-3 rounded-lg border-2 cursor-pointer ${
										isActive
											? "border-text-muted bg-text-muted/10"
											: "border-border-secondary bg-surface-primary/50"
									}`}
									onClick={() => handleStepClick(globalIndex)}
								>
									<div className="text-xs font-semibold text-text-primary mb-1">
										{step.label}
									</div>
									{isActive && (
										<motion.div
											className="mt-2 h-1 bg-text-tertiary rounded-full"
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: step.duration }}
										/>
									)}
								</motion.div>
							);
						})}
					</div>
				</div>

				{/* Server Column */}
				<div className="p-4 rounded-xl border border-border-secondary bg-surface-secondary/30">
					<div className="text-center mb-4">
						<div className="text-3xl mb-2">🖥️</div>
						<h4 className="text-sm font-semibold text-text-primary">Server</h4>
						<p className="text-xs text-text-muted">Origin backend</p>
					</div>
					<div className="space-y-2">
						{SSR_STEPS.filter((s) => s.location === "server").map((step) => {
							const globalIndex = SSR_STEPS.indexOf(step);
							const isActive = currentStep === globalIndex;
							const isPast = currentStep > globalIndex;

							return (
								<motion.div
									key={step.id}
									initial={{ opacity: 0, x: 20 }}
									animate={{
										opacity: isPast || isActive ? 1 : 0.3,
										x: 0,
										scale: isActive ? 1.05 : 1,
									}}
									className={`p-3 rounded-lg border-2 cursor-pointer ${
										isActive
											? "border-blue-500 bg-blue-500/10"
											: "border-border-secondary bg-surface-primary/50"
									}`}
									style={{
										borderColor: isActive ? step.color : undefined,
									}}
									onClick={() => handleStepClick(globalIndex)}
								>
									<div className="text-xs font-semibold text-text-primary mb-1">
										{step.label}
									</div>
									<div className="text-[10px] text-text-tertiary">
										{step.description}
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Timeline Progress */}
			<div className="relative h-16 bg-surface-secondary/50 rounded-lg border border-border-secondary/50 p-2">
				<div className="relative h-full">
					{SSR_STEPS.map((step, idx) => {
						const position = (idx / (SSR_STEPS.length - 1)) * 100;
						const isActive = currentStep === idx;
						const isPast = currentStep > idx;

						return (
							<motion.div
								key={step.id}
								className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
								style={{ left: `${position}%` }}
								onClick={() => handleStepClick(idx)}
							>
								<motion.div
									className={`w-3 h-3 rounded-full border-2 ${
										isActive ? "scale-150" : isPast ? "scale-100" : "scale-75"
									}`}
									style={{
										backgroundColor:
											isPast || isActive ? step.color : "var(--svg-border)",
										borderColor: step.color,
									}}
									animate={{
										scale: isActive ? 1.5 : isPast ? 1 : 0.75,
									}}
								/>
							</motion.div>
						);
					})}
					{/* Progress Line */}
					<div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-surface-tertiary">
						<motion.div
							className="h-full bg-violet-500"
							style={{
								width: `${(currentStep / (SSR_STEPS.length - 1)) * 100}%`,
							}}
							transition={{ duration: 0.3 }}
						/>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
