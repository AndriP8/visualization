import { motion } from "motion/react";
import { useMemo } from "react";

export interface StateNode {
	id: string;
	label: string;
	type?: "normal" | "final";
}

export interface Transition {
	from: string;
	to: string;
	event: string;
}

interface StateDiagramProps {
	states: StateNode[];
	transitions: Transition[];
	currentState: string;
	onEvent?: (event: string) => void;
}

export function StateDiagram({
	states,
	transitions,
	currentState,
	onEvent,
}: StateDiagramProps) {
	// Calculate positions in a circular layout
	const centerX = 400;
	const centerY = 250;
	const radius = 150;

	const statePositions = states.reduce(
		(acc, state, index) => {
			const angle = (index / states.length) * 2 * Math.PI - Math.PI / 2;
			acc[state.id] = {
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle),
			};
			return acc;
		},
		{} as Record<string, { x: number; y: number }>,
	);

	// Get unique events for transitions from current state (memoized)
	const availableEvents = useMemo(
		() =>
			transitions.filter((t) => t.from === currentState).map((t) => t.event),
		[transitions, currentState],
	);

	return (
		<div className="w-full flex flex-col items-center gap-4">
			{/* Accessibility: announce state changes to screen readers */}
			<output aria-live="polite" className="sr-only">
				Current state: {currentState}
			</output>

			<svg
				viewBox="0 0 800 500"
				className="w-full max-w-3xl border border-border-secondary rounded-lg bg-surface-primary/50"
			>
				<title>State machine diagram showing states and transitions</title>
				{/* Draw transitions */}
				{transitions.map((transition, idx) => {
					const from = statePositions[transition.from];
					const to = statePositions[transition.to];
					if (!from || !to) return null;

					const isActive = transition.from === currentState;
					const midX = (from.x + to.x) / 2;
					const midY = (from.y + to.y) / 2;

					return (
						<g key={`${transition.from}-${transition.to}-${idx}`}>
							{/* Transition line */}
							<motion.line
								x1={from.x}
								y1={from.y}
								x2={to.x}
								y2={to.y}
								stroke={isActive ? "#fb923c" : "var(--svg-text-muted)"}
								strokeWidth={isActive ? 2 : 1}
								initial={{ pathLength: 0 }}
								animate={{ pathLength: 1 }}
								transition={{ duration: 0.5, delay: idx * 0.1 }}
								markerEnd="url(#arrowhead)"
							/>
							{/* Event label */}
							<text
								x={midX}
								y={midY - 10}
								fill={isActive ? "#fb923c" : "var(--svg-text-muted)"}
								fontSize="12"
								textAnchor="middle"
								className="font-mono"
							>
								{transition.event}
							</text>
						</g>
					);
				})}

				{/* Arrow marker definition */}
				<defs>
					<marker
						id="arrowhead"
						markerWidth="10"
						markerHeight="10"
						refX="9"
						refY="3"
						orient="auto"
					>
						<polygon points="0 0, 10 3, 0 6" fill="var(--svg-text-muted)" />
					</marker>
				</defs>

				{/* Draw states */}
				{states.map((state) => {
					const pos = statePositions[state.id];
					const isCurrent = state.id === currentState;
					const isFinal = state.type === "final";

					return (
						<g key={state.id}>
							{/* State circle */}
							<motion.circle
								cx={pos.x}
								cy={pos.y}
								r={40}
								fill={
									isCurrent
										? "rgba(251, 146, 60, 0.2)"
										: isFinal
											? "rgba(52, 211, 153, 0.2)"
											: "rgba(39, 39, 42, 1)"
								}
								stroke={
									isCurrent
										? "#fb923c"
										: isFinal
											? "#34d399"
											: "var(--svg-text-muted)"
								}
								strokeWidth={isCurrent ? 3 : 2}
								initial={{ scale: 0 }}
								animate={{
									scale: 1,
									opacity: 1,
								}}
								transition={{
									type: "spring",
									stiffness: 300,
									damping: 20,
								}}
							/>
							{/* Pulsing effect for current state */}
							{isCurrent && (
								<motion.circle
									cx={pos.x}
									cy={pos.y}
									r={40}
									fill="none"
									stroke="#fb923c"
									strokeWidth={2}
									initial={{ scale: 1, opacity: 0.5 }}
									animate={{
										scale: 1.3,
										opacity: 0,
									}}
									transition={{
										duration: 1.5,
										repeat: Infinity,
										ease: "easeOut",
									}}
								/>
							)}
							{/* State label */}
							<text
								x={pos.x}
								y={pos.y}
								fill={
									isCurrent
										? "#fb923c"
										: isFinal
											? "#34d399"
											: "var(--svg-text)"
								}
								fontSize="14"
								fontWeight={isCurrent ? "bold" : "normal"}
								textAnchor="middle"
								dominantBaseline="middle"
								className="font-mono pointer-events-none"
							>
								{state.label}
							</text>
						</g>
					);
				})}
			</svg>

			{/* Event buttons */}
			{onEvent && availableEvents.length > 0 && (
				<div className="flex gap-2 flex-wrap justify-center">
					{availableEvents.map((event) => (
						<button
							key={event}
							onClick={() => onEvent(event)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onEvent(event);
								}
							}}
							className="px-4 py-2 bg-orange-500/20 border border-orange-400 text-accent-orange rounded-lg hover:bg-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors font-mono text-sm"
							type="button"
							aria-label={`Trigger ${event} transition`}
						>
							{event}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
