import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

interface StackFrame {
	id: string;
	label: string;
	color: string;
}

interface Step {
	stack: StackFrame[];
	highlightLine: number;
	description: string;
}

const CODE_LINES = [
	"function c() {",
	"  return 'done';",
	"}",
	"",
	"function b() {",
	"  c();",
	"}",
	"",
	"function a() {",
	"  b();",
	"}",
	"",
	"a();",
];

const STEPS: Step[] = [
	{
		stack: [],
		highlightLine: -1,
		description: "Program starts. The call stack is empty.",
	},
	{
		stack: [{ id: "global", label: "main()", color: "#6366f1" }],
		highlightLine: 12,
		description:
			"The script begins executing. A global execution context is pushed.",
	},
	{
		stack: [
			{ id: "global", label: "main()", color: "#6366f1" },
			{ id: "a", label: "a()", color: "#8b5cf6" },
		],
		highlightLine: 12,
		description: "a() is called — its frame is pushed onto the stack.",
	},
	{
		stack: [
			{ id: "global", label: "main()", color: "#6366f1" },
			{ id: "a", label: "a()", color: "#8b5cf6" },
			{ id: "b", label: "b()", color: "#a78bfa" },
		],
		highlightLine: 9,
		description: "Inside a(), b() is called — pushed onto the stack.",
	},
	{
		stack: [
			{ id: "global", label: "main()", color: "#6366f1" },
			{ id: "a", label: "a()", color: "#8b5cf6" },
			{ id: "b", label: "b()", color: "#a78bfa" },
			{ id: "c", label: "c()", color: "#c4b5fd" },
		],
		highlightLine: 5,
		description: "Inside b(), c() is called — pushed onto the stack.",
	},
	{
		stack: [
			{ id: "global", label: "main()", color: "#6366f1" },
			{ id: "a", label: "a()", color: "#8b5cf6" },
			{ id: "b", label: "b()", color: "#a78bfa" },
		],
		highlightLine: 1,
		description:
			"c() returns 'done' — its frame is popped off the stack (LIFO).",
	},
	{
		stack: [
			{ id: "global", label: "main()", color: "#6366f1" },
			{ id: "a", label: "a()", color: "#8b5cf6" },
		],
		highlightLine: 5,
		description: "b() finishes — popped off the stack.",
	},
	{
		stack: [{ id: "global", label: "main()", color: "#6366f1" }],
		highlightLine: 9,
		description: "a() finishes — popped off the stack.",
	},
	{
		stack: [],
		highlightLine: 12,
		description:
			"Script execution complete. Call stack is empty — ready for the next task.",
	},
];

const FRAME_HEIGHT = 40;
const FRAME_GAP = 4;
const STACK_WIDTH = 200;
const SVG_HEIGHT = 220;

export function CallStackDemo() {
	const [step, setStep] = useState(0);
	const current = STEPS[step];

	const next = () => {
		if (step < STEPS.length - 1) setStep(step + 1);
	};
	const prev = () => {
		if (step > 0) setStep(step - 1);
	};
	const reset = () => setStep(0);

	return (
		<DemoSection
			title="Demo 1: Call Stack Visualizer"
			description="Watch how functions push/pop on the call stack (LIFO). Step through a() → b() → c() → return."
		>
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Code panel */}
				<div className="flex-1 min-w-0">
					<div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
						Source Code
					</div>
					<ShikiCode
						code={CODE_LINES.join("\n")}
						language="javascript"
						highlightLine={current.highlightLine}
					/>
				</div>

				{/* Stack visualization */}
				<div className="flex-1 min-w-0">
					<div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
						Call Stack
					</div>
					<div className="p-4 rounded-lg bg-surface-primary border border-border-primary">
						<svg
							width="100%"
							viewBox={`0 0 ${STACK_WIDTH} ${SVG_HEIGHT}`}
							className="max-w-60 mx-auto"
							role="img"
							aria-label="Call stack visualization"
						>
							<title>Call stack visualization</title>
							{/* Stack base */}
							<line
								x1={10}
								y1={SVG_HEIGHT - 10}
								x2={STACK_WIDTH - 10}
								y2={SVG_HEIGHT - 10}
								stroke="var(--svg-border)"
								strokeWidth={2}
							/>
							<text
								x={STACK_WIDTH / 2}
								y={SVG_HEIGHT}
								textAnchor="middle"
								fill="var(--svg-text-muted)"
								fontSize={10}
								fontFamily="monospace"
							>
								stack bottom
							</text>

							{/* Frames */}
							<AnimatePresence>
								{current.stack.map((frame, i) => {
									const y =
										SVG_HEIGHT - 20 - (i + 1) * (FRAME_HEIGHT + FRAME_GAP);
									return (
										<motion.g
											key={frame.id}
											initial={{ opacity: 0, y: -30 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -30 }}
											transition={{ duration: 0.3 }}
										>
											<rect
												x={15}
												y={y}
												width={STACK_WIDTH - 30}
												height={FRAME_HEIGHT}
												rx={6}
												fill={`${frame.color}22`}
												stroke={frame.color}
												strokeWidth={1.5}
											/>
											<text
												x={STACK_WIDTH / 2}
												y={y + FRAME_HEIGHT / 2 + 4}
												textAnchor="middle"
												fill={frame.color}
												fontSize={13}
												fontWeight="600"
												fontFamily="monospace"
											>
												{frame.label}
											</text>
										</motion.g>
									);
								})}
							</AnimatePresence>

							{/* Empty state */}
							{current.stack.length === 0 && (
								<text
									x={STACK_WIDTH / 2}
									y={SVG_HEIGHT / 2}
									textAnchor="middle"
									fill="var(--svg-text-muted)"
									fontSize={12}
									fontFamily="monospace"
								>
									(empty)
								</text>
							)}
						</svg>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-3 mt-5">
				<button
					type="button"
					onClick={prev}
					disabled={step <= 0}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					← Back
				</button>
				<button
					type="button"
					onClick={next}
					disabled={step >= STEPS.length - 1}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-accent-violet border border-violet-500/30 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					Next →
				</button>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors"
				>
					↺ Reset
				</button>
				<span className="text-xs text-text-faint ml-auto">
					Step {step + 1} / {STEPS.length}
				</span>
			</div>

			{/* Description */}
			<motion.div
				key={step}
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				className="mt-4 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-sm text-accent-violet"
			>
				{current.description}
			</motion.div>
		</DemoSection>
	);
}
