import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import { StateDiagram, type StateNode, type Transition } from "./StateDiagram";

type State = "step1" | "step2" | "step3" | "complete";
type Event = "NEXT" | "PREV" | "SUBMIT" | "RESET";

// State machine: explicit mapping of (current state, event) → next state
// This prevents invalid transitions and impossible states
const stateMachine: Record<State, Partial<Record<Event, State>>> = {
	step1: { NEXT: "step2" },
	step2: { NEXT: "step3", PREV: "step1" },
	step3: { SUBMIT: "complete", PREV: "step2" },
	complete: { RESET: "step1" },
} as const;

const states: StateNode[] = [
	{ id: "step1", label: "Step 1" },
	{ id: "step2", label: "Step 2" },
	{ id: "step3", label: "Step 3" },
	{ id: "complete", label: "Complete", type: "final" },
];

const transitions: Transition[] = [
	{ from: "step1", to: "step2", event: "NEXT" },
	{ from: "step2", to: "step3", event: "NEXT" },
	{ from: "step2", to: "step1", event: "PREV" },
	{ from: "step3", to: "step2", event: "PREV" },
	{ from: "step3", to: "complete", event: "SUBMIT" },
	{ from: "complete", to: "step1", event: "RESET" },
];

const machineCode = `type State = "step1" | "step2" | "step3" | "complete";
type Event = "NEXT" | "PREV" | "SUBMIT" | "RESET";

const stateMachine: Record<State, Partial<Record<Event, State>>> = {
  step1: { NEXT: "step2" },
  step2: { NEXT: "step3", PREV: "step1" },
  step3: { SUBMIT: "complete", PREV: "step2" },
  complete: { RESET: "step1" },
};

function transition(currentState: State, event: Event): State {
  const nextState = stateMachine[currentState][event];
  if (!nextState) {
    console.warn(\`Invalid transition: \${event} from \${currentState}\`);
    return currentState;
  }
  return nextState;
}`;

export function VanillaStateMachineDemo() {
	const [currentState, setCurrentState] = useState<State>("step1");
	const [formData, setFormData] = useState({
		name: "",
		email: "",
	});
	// Use ref to avoid recreating callbacks when isTransitioning changes
	const isTransitioningRef = useRef(false);
	const [pendingTransition, setPendingTransition] = useState<State | null>(
		null,
	);

	// Handle delayed state transition with proper cleanup
	useEffect(() => {
		if (!pendingTransition) return;

		const timer = setTimeout(() => {
			setCurrentState(pendingTransition);
			setPendingTransition(null);
			isTransitioningRef.current = false;
		}, 300);

		return () => clearTimeout(timer);
	}, [pendingTransition]);

	const transition = useCallback(
		(event: Event) => {
			if (isTransitioningRef.current) return;

			const nextState = stateMachine[currentState][event];

			if (!nextState) {
				console.warn(`Invalid transition: ${event} from ${currentState}`);
				return;
			}

			isTransitioningRef.current = true;
			setPendingTransition(nextState);
		},
		[currentState],
	);

	const handleEvent = useCallback(
		(event: string) => {
			transition(event as Event);
		},
		[transition],
	);

	const canGoNext =
		currentState === "step1"
			? formData.name.length > 0
			: currentState === "step2"
				? formData.email.length > 0
				: true;

	return (
		<DemoSection
			title="Vanilla State Machine"
			description="Hand-rolled finite state machine for a multi-step form wizard"
		>
			<div className="space-y-8">
				<StateDiagram
					states={states}
					transitions={transitions}
					currentState={currentState}
					onEvent={handleEvent}
				/>

				<motion.div
					className="p-6 bg-zinc-800 border border-zinc-700 rounded-lg"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					{currentState === "step1" && (
						<motion.div
							key="step1"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="space-y-4"
						>
							<h3 className="text-lg font-semibold text-white">Step 1: Name</h3>
							<input
								type="text"
								placeholder="Enter your name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
							/>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => transition("NEXT")}
									disabled={!canGoNext || isTransitioningRef.current}
									className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Next
								</button>
							</div>
						</motion.div>
					)}

					{currentState === "step2" && (
						<motion.div
							key="step2"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="space-y-4"
						>
							<h3 className="text-lg font-semibold text-white">
								Step 2: Email
							</h3>
							<input
								type="email"
								placeholder="Enter your email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
							/>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => transition("PREV")}
									disabled={isTransitioningRef.current}
									className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() => transition("NEXT")}
									disabled={!canGoNext || isTransitioningRef.current}
									className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Next
								</button>
							</div>
						</motion.div>
					)}

					{currentState === "step3" && (
						<motion.div
							key="step3"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="space-y-4"
						>
							<h3 className="text-lg font-semibold text-white">
								Step 3: Review
							</h3>
							<div className="space-y-2 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
								<div>
									<span className="text-zinc-400">Name:</span>{" "}
									<span className="text-white">{formData.name}</span>
								</div>
								<div>
									<span className="text-zinc-400">Email:</span>{" "}
									<span className="text-white">{formData.email}</span>
								</div>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => transition("PREV")}
									disabled={isTransitioningRef.current}
									className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() => transition("SUBMIT")}
									disabled={isTransitioningRef.current}
									className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Submit
								</button>
							</div>
						</motion.div>
					)}

					{currentState === "complete" && (
						<motion.div
							key="complete"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							className="space-y-4 text-center"
						>
							<div className="text-4xl">✓</div>
							<h3 className="text-lg font-semibold text-emerald-400">
								Form Submitted!
							</h3>
							<p className="text-zinc-400">Your information has been saved.</p>
							<button
								type="button"
								onClick={() => {
									transition("RESET");
									setFormData({ name: "", email: "" });
								}}
								disabled={isTransitioningRef.current}
								className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Start Over
							</button>
						</motion.div>
					)}
				</motion.div>

				<div className="space-y-4">
					<h4 className="text-sm font-semibold text-zinc-400">
						Machine Definition
					</h4>
					<ShikiCode language="typescript" code={machineCode} />
				</div>

				<div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
					<h4 className="text-sm font-semibold text-amber-400 mb-2">
						Manual State Management Challenges
					</h4>
					<ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside">
						<li>Boilerplate: Manual validation of every transition</li>
						<li>
							Error-prone: Easy to forget edge cases or invalid transitions
						</li>
						<li>No tooling: Hard to visualize or debug state flow</li>
						<li>Scalability: Complex as states/transitions grow</li>
					</ul>
				</div>
			</div>
		</DemoSection>
	);
}
