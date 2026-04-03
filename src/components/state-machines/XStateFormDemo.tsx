import { useMachine } from "@xstate/react";
import { motion } from "motion/react";
import { assign, createMachine } from "xstate";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import { StateDiagram, type StateNode, type Transition } from "./StateDiagram";

// Context type for form data
interface FormContext {
	name: string;
	email: string;
}

// Events our machine can receive
type FormEvent =
	| { type: "UPDATE_NAME"; value: string }
	| { type: "UPDATE_EMAIL"; value: string }
	| { type: "NEXT" }
	| { type: "PREV" }
	| { type: "SUBMIT" }
	| { type: "RESET" };

const formMachine = createMachine(
	{
		id: "wizard",
		initial: "step1",
		// Form data stored in machine context
		context: {
			name: "",
			email: "",
		} as FormContext,
		states: {
			step1: {
				on: {
					UPDATE_NAME: {
						actions: "updateName",
					},
					NEXT: {
						// Guard prevents advancing with empty name
						guard: "hasName",
						target: "step2",
					},
				},
			},
			step2: {
				on: {
					UPDATE_EMAIL: {
						actions: "updateEmail",
					},
					NEXT: {
						guard: "hasEmail",
						target: "step3",
					},
					PREV: "step1",
				},
			},
			step3: {
				on: {
					SUBMIT: "complete",
					PREV: "step2",
				},
			},
			complete: {
				type: "final",
				on: {
					RESET: {
						target: "step1",
						actions: "resetForm",
					},
				},
			},
		},
	},
	{
		actions: {
			updateName: assign({
				name: (_, event) => {
					if (
						typeof event === "object" &&
						event &&
						"type" in event &&
						event.type === "UPDATE_NAME" &&
						"value" in event
					) {
						return event.value as string;
					}
					return "";
				},
			}),
			updateEmail: assign({
				email: (_, event) => {
					if (
						typeof event === "object" &&
						event &&
						"type" in event &&
						event.type === "UPDATE_EMAIL" &&
						"value" in event
					) {
						return event.value as string;
					}
					return "";
				},
			}),
			resetForm: assign({
				name: "",
				email: "",
			}),
		},
		guards: {
			hasName: ({ context }) => context.name.length > 0,
			hasEmail: ({ context }) => context.email.length > 0,
		},
	},
);

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

const machineCode = `import { assign, createMachine } from "xstate";
import { useMachine } from "@xstate/react";

const formMachine = createMachine({
  id: "wizard",
  initial: "step1",
  // Form data stored in machine context (not useState!)
  context: { name: "", email: "" },
  states: {
    step1: {
      on: {
        UPDATE_NAME: { actions: "updateName" },
        NEXT: {
          guard: "hasName",  // Only advance if name entered
          target: "step2"
        }
      }
    },
    step2: {
      on: {
        UPDATE_EMAIL: { actions: "updateEmail" },
        NEXT: { guard: "hasEmail", target: "step3" },
        PREV: "step1"
      }
    },
    step3: {
      on: { SUBMIT: "complete", PREV: "step2" }
    },
    complete: {
      type: "final",
      on: { RESET: { target: "step1", actions: "resetForm" } }
    }
  }
}, {
  actions: {
    updateName: assign({ name: (_, event) => event.value }),
    updateEmail: assign({ email: (_, event) => event.value }),
    resetForm: assign({ name: "", email: "" })
  },
  guards: {
    hasName: ({ context }) => context.name.length > 0,
    hasEmail: ({ context }) => context.email.length > 0
  }
});

// Usage: form data comes from context
const [state, send] = useMachine(formMachine);
const { name, email } = state.context;`;

export function XStateFormDemo() {
	const [state, send] = useMachine(formMachine);

	// Safe state.value handling - XState can return nested states as objects
	if (typeof state.value !== "string") {
		throw new Error("Nested states not supported in this demo");
	}
	const currentState = state.value;

	// Form data comes from machine context (not useState!)
	const { name, email } = state.context;

	const handleEvent = (event: string) => {
		send({ type: event } as FormEvent);
	};

	// Validation is now handled by guards in the machine
	const canGoNext =
		currentState === "step1"
			? name.length > 0
			: currentState === "step2"
				? email.length > 0
				: true;

	return (
		<DemoSection
			title="XState State Machine with Context"
			description="Form wizard using XState with context for data storage, guards for validation, and actions for updates"
		>
			<div className="space-y-8">
				<StateDiagram
					states={states}
					transitions={transitions}
					currentState={currentState}
					onEvent={handleEvent}
				/>

				<motion.div
					className="p-6 bg-surface-secondary border border-border-secondary rounded-lg"
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
							<h3 className="text-lg font-semibold text-text-primary">
								Step 1: Name
							</h3>
							<input
								type="text"
								placeholder="Enter your name"
								value={name}
								onChange={(e) =>
									send({ type: "UPDATE_NAME", value: e.target.value })
								}
								className="w-full px-4 py-2 bg-surface-primary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500"
							/>
							{name.length > 0 && name.length < 2 && (
								<p className="text-xs text-accent-amber-soft">
									Name should be at least 2 characters
								</p>
							)}
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => send({ type: "NEXT" })}
									disabled={!canGoNext}
									className="px-4 py-2 bg-orange-500 text-text-primary rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
							<h3 className="text-lg font-semibold text-text-primary">
								Step 2: Email
							</h3>
							<input
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) =>
									send({ type: "UPDATE_EMAIL", value: e.target.value })
								}
								className="w-full px-4 py-2 bg-surface-primary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500"
							/>
							{email.length > 0 && !email.includes("@") && (
								<p className="text-xs text-accent-amber-soft">
									Email must contain @ symbol
								</p>
							)}
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => send({ type: "PREV" })}
									className="px-4 py-2 bg-surface-tertiary text-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() => send({ type: "NEXT" })}
									disabled={!canGoNext}
									className="px-4 py-2 bg-orange-500 text-text-primary rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
							<h3 className="text-lg font-semibold text-text-primary">
								Step 3: Review
							</h3>
							<div className="space-y-2 p-4 bg-surface-primary rounded-lg border border-border-secondary">
								<div>
									<span className="text-text-tertiary">Name:</span>{" "}
									<span className="text-text-primary">{name}</span>
								</div>
								<div>
									<span className="text-text-tertiary">Email:</span>{" "}
									<span className="text-text-primary">{email}</span>
								</div>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => send({ type: "PREV" })}
									className="px-4 py-2 bg-surface-tertiary text-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() => send({ type: "SUBMIT" })}
									className="px-4 py-2 bg-emerald-500 text-text-primary rounded-lg hover:bg-emerald-600 transition-colors"
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
							<h3 className="text-lg font-semibold text-accent-emerald-soft">
								Form Submitted!
							</h3>
							<p className="text-text-tertiary">
								Your information has been saved.
							</p>
							<button
								type="button"
								onClick={() => send({ type: "RESET" })}
								className="px-4 py-2 bg-orange-500 text-text-primary rounded-lg hover:bg-orange-600 transition-colors"
							>
								Start Over
							</button>
						</motion.div>
					)}
				</motion.div>

				<div className="space-y-4">
					<h4 className="text-sm font-semibold text-text-tertiary">
						Machine Definition
					</h4>
					<ShikiCode language="typescript" code={machineCode} />
				</div>

				<div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
					<h4 className="text-sm font-semibold text-accent-emerald-soft mb-2">
						XState Benefits
					</h4>
					<ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
						<li>Declarative: State graph defined as configuration</li>
						<li>Type-safe: Invalid transitions caught at compile time</li>
						<li>Tooling: Built-in visualizer and inspector</li>
						<li>
							Features: Guards, actions, context, history states out of the box
						</li>
						<li>Testing: Easier to test state transitions in isolation</li>
					</ul>
				</div>
			</div>
		</DemoSection>
	);
}
