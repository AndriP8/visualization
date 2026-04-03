import { motion } from "motion/react";
import type { Actor, SequenceStep } from "./types";

interface AuthFlowSequenceProps {
	steps: SequenceStep[];
	currentStep: number;
	actors: Actor[];
}

const ACTOR_LABELS: Record<Actor, string> = {
	browser: "Browser",
	server: "App Server",
	db: "Database",
	"oauth-provider": "OAuth Provider",
	"resource-api": "Resource API",
};

const ACTOR_COLORS: Record<Actor, { main: string; light: string; bg: string }> =
	{
		browser: {
			main: "#a78bfa",
			light: "#c4b5fd",
			bg: "rgba(167, 139, 250, 0.2)",
		},
		server: {
			main: "#22d3ee",
			light: "#67e8f9",
			bg: "rgba(34, 211, 238, 0.2)",
		},
		db: { main: "#fbbf24", light: "#fcd34d", bg: "rgba(251, 191, 36, 0.2)" },
		"oauth-provider": {
			main: "#fb7185",
			light: "#fda4af",
			bg: "rgba(251, 113, 133, 0.2)",
		},
		"resource-api": {
			main: "#34d399",
			light: "#6ee7b7",
			bg: "rgba(52, 211, 153, 0.2)",
		},
	};

const STEP_COLORS: Record<
	string,
	{ main: string; light: string; border: string }
> = {
	violet: {
		main: "#a78bfa",
		light: "#c4b5fd",
		border: "rgba(167, 139, 250, 0.3)",
	},
	cyan: {
		main: "#22d3ee",
		light: "#67e8f9",
		border: "rgba(34, 211, 238, 0.3)",
	},
	amber: {
		main: "#fbbf24",
		light: "#fcd34d",
		border: "rgba(251, 191, 36, 0.3)",
	},
	rose: {
		main: "#fb7185",
		light: "#fda4af",
		border: "rgba(251, 113, 133, 0.3)",
	},
	emerald: {
		main: "#34d399",
		light: "#6ee7b7",
		border: "rgba(52, 211, 153, 0.3)",
	},
};

export function AuthFlowSequence({
	steps,
	currentStep,
	actors,
}: AuthFlowSequenceProps) {
	const visibleSteps = steps.slice(0, currentStep + 1);
	const containerHeight = 60 + steps.length * 80;

	return (
		<div className="w-full overflow-x-auto">
			<div className="min-w-150 p-8">
				{/* Actor headers */}
				<div className="flex items-center justify-between gap-4 mb-8">
					{actors.map((actor) => {
						const colors = ACTOR_COLORS[actor];
						return (
							<div key={actor} className="flex flex-col items-center flex-1">
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2"
									style={{
										backgroundColor: colors.bg,
										borderColor: colors.main,
									}}
								>
									<div className="text-2xl">
										{actor === "browser" && "🌐"}
										{actor === "server" && "🖥️"}
										{actor === "db" && "🗄️"}
										{actor === "oauth-provider" && "🔐"}
										{actor === "resource-api" && "📡"}
									</div>
								</motion.div>
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.2, duration: 0.5 }}
									className="text-sm font-medium"
									style={{ color: colors.light }}
								>
									{ACTOR_LABELS[actor]}
								</motion.div>
							</div>
						);
					})}
				</div>

				{/* Vertical lifelines */}
				<div className="relative" style={{ height: `${containerHeight}px` }}>
					<div className="flex items-start justify-between gap-4 h-full">
						{actors.map((actor) => {
							const colors = ACTOR_COLORS[actor];
							return (
								<div
									key={actor}
									className="flex-1 flex flex-col items-center h-full"
								>
									<div
										className="w-0.5 h-full relative"
										style={{ backgroundColor: colors.bg }}
									/>
								</div>
							);
						})}
					</div>

					{/* Animated arrows and messages */}
					<div className="absolute inset-0">
						{visibleSteps.map((step, index) => {
							const fromIndex = actors.indexOf(step.from);
							const toIndex = actors.indexOf(step.to);
							const isRightward = toIndex > fromIndex;
							const yPosition = 30 + index * 80;

							const colWidth = 100 / actors.length;
							const fromCenter = (fromIndex + 0.5) * colWidth;
							const toCenter = (toIndex + 0.5) * colWidth;
							const leftPos = Math.min(fromCenter, toCenter);
							const width = Math.abs(toCenter - fromCenter);

							const colors = STEP_COLORS[step.color] || STEP_COLORS.cyan;

							return (
								<motion.div
									key={`step-${
										// biome-ignore lint/suspicious/noArrayIndexKey: index is stable for animation
										index
									}`}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: index * 0.3,
										type: "spring",
										stiffness: 200,
										damping: 20,
									}}
									className="absolute"
									style={{
										top: `${yPosition}px`,
										left: `${leftPos}%`,
										width: `${width}%`,
									}}
								>
									{/* Arrow line */}
									<div className="relative h-8 flex items-center">
										<motion.div
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{
												delay: index * 0.3 + 0.2,
												duration: 0.5,
											}}
											style={{
												transformOrigin: isRightward ? "left" : "right",
												backgroundColor: colors.main,
											}}
											className="h-0.5 w-full"
										/>
										{/* Arrowhead */}
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{
												delay: index * 0.3 + 0.6,
												duration: 0.3,
											}}
											className={`absolute ${isRightward ? "right-0" : "left-0"}`}
										>
											<div
												className="w-0 h-0 border-t-4 border-b-4 border-transparent"
												style={{
													[isRightward
														? "borderLeftWidth"
														: "borderRightWidth"]: "8px",
													[isRightward
														? "borderLeftColor"
														: "borderRightColor"]: colors.main,
												}}
											/>
										</motion.div>
									</div>

									{/* Label */}
									<motion.div
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											delay: index * 0.3 + 0.4,
											duration: 0.5,
										}}
										className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
									>
										<div
											className="text-xs font-medium px-2 py-1 rounded bg-surface-secondary border"
											style={{
												borderColor: colors.border,
												color: colors.light,
											}}
										>
											{step.label}
										</div>
									</motion.div>

									{/* Data payload (if exists) */}
									{step.data && (
										<motion.div
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{
												delay: index * 0.3 + 0.7,
												duration: 0.3,
											}}
											className="absolute top-10 left-1/2 -translate-x-1/2 w-48"
										>
											<div className="text-xs bg-surface-primary border border-border-secondary rounded p-2 space-y-1">
												{step.data.map((item) => (
													<div
														key={item.key}
														className="flex justify-between gap-2"
													>
														<span className="text-text-muted">{item.key}:</span>
														<span className="text-text-secondary font-mono truncate">
															{item.value}
														</span>
													</div>
												))}
											</div>
										</motion.div>
									)}
								</motion.div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
