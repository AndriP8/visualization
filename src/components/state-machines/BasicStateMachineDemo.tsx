import { motion } from "motion/react";
import { useState } from "react";

type TrafficLightState = "red" | "yellow" | "green";

interface Transition {
	from: TrafficLightState;
	to: TrafficLightState;
	event: string;
}

const TRANSITIONS: Transition[] = [
	{ from: "red", to: "yellow", event: "TIMER" },
	{ from: "yellow", to: "green", event: "TIMER" },
	{ from: "green", to: "red", event: "TIMER" },
];

const STATE_COLORS = {
	red: { bg: "bg-red-500", border: "border-red-400", text: "text-red-300" },
	yellow: {
		bg: "bg-yellow-500",
		border: "border-yellow-400",
		text: "text-yellow-300",
	},
	green: {
		bg: "bg-green-500",
		border: "border-green-400",
		text: "text-green-300",
	},
} as const;

export function BasicStateMachineDemo() {
	const [currentState, setCurrentState] = useState<TrafficLightState>("red");
	const [isTransitioning, setIsTransitioning] = useState(false);

	const transition = () => {
		const nextTransition = TRANSITIONS.find((t) => t.from === currentState);
		if (nextTransition) {
			setIsTransitioning(true);
			setTimeout(() => {
				setCurrentState(nextTransition.to);
				setIsTransitioning(false);
			}, 400);
		}
	};

	const getNextState = () => {
		return TRANSITIONS.find((t) => t.from === currentState)?.to;
	};

	return (
		<div className="space-y-8">
			{/* Visual Traffic Light */}
			<div className="flex justify-center">
				<div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4">
					{(["red", "yellow", "green"] as const).map((state) => (
						<motion.div
							key={state}
							className={`w-20 h-20 rounded-full border-4 ${
								currentState === state
									? `${STATE_COLORS[state].bg} ${STATE_COLORS[state].border} shadow-lg`
									: "bg-zinc-800 border-zinc-700"
							}`}
							animate={{
								opacity: currentState === state ? 1 : 0.3,
								scale: currentState === state ? 1 : 0.9,
								boxShadow:
									currentState === state
										? "0 0 30px rgba(139, 92, 246, 0.5)"
										: "none",
							}}
							transition={{ duration: 0.3 }}
						/>
					))}
				</div>
			</div>

			{/* State Diagram */}
			<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8">
				<div className="flex items-center justify-around relative">
					{/* States as nodes */}
					{(["red", "yellow", "green"] as const).map((state, idx) => (
						<div key={state} className="flex flex-col items-center gap-2">
							<motion.div
								className={`w-24 h-24 rounded-full border-2 flex items-center justify-center font-semibold ${
									currentState === state
										? `${STATE_COLORS[state].bg} ${STATE_COLORS[state].border} shadow-lg`
										: "bg-zinc-800 border-zinc-700 text-zinc-500"
								}`}
								animate={{
									scale: currentState === state ? 1.1 : 1,
									boxShadow:
										currentState === state
											? "0 0 30px rgba(139, 92, 246, 0.5)"
											: "none",
								}}
								transition={{ duration: 0.3 }}
							>
								{state.toUpperCase()}
							</motion.div>

							{/* Transition arrow */}
							{idx < 2 && (
								<motion.div
									className="absolute top-12"
									style={{ left: `${33 * (idx + 1)}%` }}
									animate={{
										opacity:
											isTransitioning && TRANSITIONS[idx].from === currentState
												? 1
												: 0.3,
									}}
								>
									<svg
										width="80"
										height="40"
										viewBox="0 0 80 40"
										role="img"
										aria-label="Transition arrow"
									>
										<defs>
											<marker
												id={`arrowhead-${idx}`}
												markerWidth="10"
												markerHeight="10"
												refX="9"
												refY="3"
												orient="auto"
											>
												<polygon
													points="0 0, 10 3, 0 6"
													className={
														isTransitioning &&
														TRANSITIONS[idx].from === currentState
															? "fill-cyan-400"
															: "fill-zinc-600"
													}
												/>
											</marker>
										</defs>
										<motion.path
											d="M 10 20 L 70 20"
											className={
												isTransitioning &&
												TRANSITIONS[idx].from === currentState
													? "stroke-cyan-400"
													: "stroke-zinc-600"
											}
											strokeWidth="2"
											fill="none"
											markerEnd={`url(#arrowhead-${idx})`}
											initial={{ pathLength: 0 }}
											animate={{
												pathLength:
													isTransitioning &&
													TRANSITIONS[idx].from === currentState
														? 1
														: 1,
												opacity:
													isTransitioning &&
													TRANSITIONS[idx].from === currentState
														? 1
														: 0.5,
											}}
											transition={{ duration: 0.4 }}
										/>
									</svg>
									<div className="text-xs text-center text-cyan-400 -mt-2">
										TIMER
									</div>
								</motion.div>
							)}
						</div>
					))}

					{/* Return arrow from green to red */}
					<motion.div
						className="absolute -bottom-12 left-1/2 -translate-x-1/2"
						animate={{
							opacity: isTransitioning && currentState === "green" ? 1 : 0.3,
						}}
					>
						<svg
							width="300"
							height="60"
							viewBox="0 0 300 60"
							role="img"
							aria-label="Return transition arrow"
						>
							<defs>
								<marker
									id="arrowhead-return"
									markerWidth="10"
									markerHeight="10"
									refX="9"
									refY="3"
									orient="auto"
								>
									<polygon
										points="0 0, 10 3, 0 6"
										className={
											isTransitioning && currentState === "green"
												? "fill-cyan-400"
												: "fill-zinc-600"
										}
									/>
								</marker>
							</defs>
							<motion.path
								d="M 250 10 Q 150 50 50 10"
								className={
									isTransitioning && currentState === "green"
										? "stroke-cyan-400"
										: "stroke-zinc-600"
								}
								strokeWidth="2"
								fill="none"
								markerEnd="url(#arrowhead-return)"
								animate={{
									opacity:
										isTransitioning && currentState === "green" ? 1 : 0.5,
								}}
							/>
						</svg>
						<div className="text-xs text-center text-cyan-400 -mt-8">TIMER</div>
					</motion.div>
				</div>
			</div>

			{/* Controls */}
			<div className="flex flex-col items-center gap-4">
				<button
					type="button"
					onClick={transition}
					disabled={isTransitioning}
					className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
				>
					{isTransitioning
						? "Transitioning..."
						: `Send TIMER Event → ${getNextState()?.toUpperCase()}`}
				</button>

				<div className="text-sm text-zinc-400 text-center">
					Current state:{" "}
					<span
						className={`font-mono font-bold ${STATE_COLORS[currentState].text}`}
					>
						{currentState.toUpperCase()}
					</span>
				</div>
			</div>

			{/* Key Insight */}
			<div className="bg-violet-950/30 border border-violet-800/50 rounded-lg p-4">
				<div className="text-sm text-violet-300">
					<strong>Key insight:</strong> Each state has exactly one valid
					transition. No ambiguity, no impossible states. The system is{" "}
					<strong>deterministic</strong> - the same event in the same state
					always produces the same result.
				</div>
			</div>
		</div>
	);
}
