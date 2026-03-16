import { useMachine } from "@xstate/react";
import { motion } from "motion/react";
import { assign, createMachine, fromPromise } from "xstate";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import { StateDiagram, type StateNode, type Transition } from "./StateDiagram";

// Context type for our machine
interface LoginContext {
	email: string;
	password: string;
	error: string | null;
	attempts: number;
}

// Events our machine can receive
type LoginEvent =
	| { type: "UPDATE_EMAIL"; value: string }
	| { type: "UPDATE_PASSWORD"; value: string }
	| { type: "SUBMIT" }
	| { type: "VALID" }
	| { type: "INVALID"; error: string }
	| { type: "SUCCESS" }
	| { type: "ERROR"; error: string }
	| { type: "RETRY" }
	| { type: "RESET" };

// Simulated API call with 70% success rate
const loginAPI = async (_email: string, _password: string): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, 1500));
	if (Math.random() > 0.3) {
		return Promise.resolve();
	}
	throw new Error("Invalid credentials or network error");
};

const loginMachine = createMachine(
	{
		id: "login",
		initial: "idle",
		// State machine context - holds form data and error state
		context: {
			email: "",
			password: "",
			error: null,
			attempts: 0,
		} as LoginContext,
		states: {
			idle: {
				on: {
					UPDATE_EMAIL: {
						// Actions update context without changing state
						actions: "updateEmail",
					},
					UPDATE_PASSWORD: {
						actions: "updatePassword",
					},
					SUBMIT: {
						// Guard prevents transition if form is invalid
						guard: "isFormValid",
						target: "validating",
					},
				},
			},
			validating: {
				// Entry actions run when entering this state
				entry: "clearError",
				// Invoke runs async operation
				invoke: {
					src: "validateCredentials",
					input: ({ context }) => context,
					onDone: {
						target: "submitting",
					},
					onError: {
						target: "idle",
						actions: "setValidationError",
					},
				},
			},
			submitting: {
				entry: "incrementAttempts",
				invoke: {
					src: "callLoginAPI",
					input: ({ context }) => context,
					onDone: {
						target: "success",
						actions: "logSuccess",
					},
					onError: {
						target: "error",
						actions: "setAPIError",
					},
				},
			},
			error: {
				on: {
					RETRY: {
						guard: "canRetry",
						target: "submitting",
					},
					RESET: {
						target: "idle",
						actions: "resetContext",
					},
				},
			},
			success: {
				type: "final",
				entry: "logSuccess",
				on: {
					RESET: {
						target: "idle",
						actions: "resetContext",
					},
				},
			},
		},
	},
	{
		// Actions are side effects that update context or trigger external effects
		actions: {
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
			updatePassword: assign({
				password: (_, event) => {
					if (
						typeof event === "object" &&
						event &&
						"type" in event &&
						event.type === "UPDATE_PASSWORD" &&
						"value" in event
					) {
						return event.value as string;
					}
					return "";
				},
			}),
			clearError: assign({
				error: null,
			}),
			setValidationError: assign({
				error: "Please enter valid email and password",
			}),
			setAPIError: assign({
				error: (_, event) => {
					if (
						typeof event === "object" &&
						event &&
						"type" in event &&
						event.type === "ERROR" &&
						"error" in event
					) {
						return event.error as string;
					}
					return "Unknown error";
				},
			}),
			incrementAttempts: assign({
				attempts: ({ context }) => context.attempts + 1,
			}),
			resetContext: assign({
				email: "",
				password: "",
				error: null,
				attempts: 0,
			}),
			logSuccess: ({ context }) => {
				console.log("✓ Login successful for:", context.email);
			},
		},
		// Guards are boolean functions that control whether a transition can happen
		guards: {
			isFormValid: ({ context }) => {
				return (
					context.email.length > 0 &&
					context.email.includes("@") &&
					context.password.length >= 6
				);
			},
			canRetry: ({ context }) => context.attempts < 3,
		},
		// Actors define async operations invoked by the machine
		actors: {
			validateCredentials: fromPromise(
				async ({ input }: { input: LoginContext }) => {
					await new Promise((resolve) => setTimeout(resolve, 500));
					if (!input.email.includes("@")) {
						throw new Error("Invalid email format");
					}
					if (input.password.length < 6) {
						throw new Error("Password must be at least 6 characters");
					}
				},
			),
			callLoginAPI: fromPromise(async ({ input }: { input: LoginContext }) => {
				return loginAPI(input.email, input.password);
			}),
		},
	},
);

const states: StateNode[] = [
	{ id: "idle", label: "Idle" },
	{ id: "validating", label: "Validating" },
	{ id: "submitting", label: "Submitting" },
	{ id: "error", label: "Error" },
	{ id: "success", label: "Success", type: "final" },
];

const transitions: Transition[] = [
	{ from: "idle", to: "validating", event: "SUBMIT" },
	{ from: "validating", to: "submitting", event: "VALID" },
	{ from: "validating", to: "idle", event: "INVALID" },
	{ from: "submitting", to: "success", event: "SUCCESS" },
	{ from: "submitting", to: "error", event: "ERROR" },
	{ from: "error", to: "submitting", event: "RETRY" },
	{ from: "error", to: "idle", event: "RESET" },
	{ from: "success", to: "idle", event: "RESET" },
];

const machineCode = `const loginMachine = createMachine({
  context: { email: "", password: "", error: null, attempts: 0 },
  initial: "idle",
  states: {
    idle: {
      on: {
        UPDATE_EMAIL: { actions: "updateEmail" },
        UPDATE_PASSWORD: { actions: "updatePassword" },
        SUBMIT: {
          guard: "isFormValid",  // Only allow if form valid
          target: "validating"
        }
      }
    },
    validating: {
      invoke: {
        src: "validateCredentials",
        onDone: "submitting",
        onError: { target: "idle", actions: "setValidationError" }
      }
    },
    submitting: {
      entry: "incrementAttempts",  // Track retry count
      invoke: {
        src: "callLoginAPI",
        onDone: { target: "success", actions: "logSuccess" },
        onError: { target: "error", actions: "setAPIError" }
      }
    },
    error: {
      on: {
        RETRY: { guard: "canRetry", target: "submitting" },
        RESET: { target: "idle", actions: "resetContext" }
      }
    },
    success: { type: "final" }
  }
}, {
  actions: { /* updateEmail, setAPIError, etc. */ },
  guards: {
    isFormValid: ({ context }) => context.email.includes("@") && context.password.length >= 6,
    canRetry: ({ context }) => context.attempts < 3
  },
  actors: { /* validateCredentials, callLoginAPI */ }
});`;

export function AdvancedXStateDemo() {
	const [state, send] = useMachine(loginMachine);

	// Safe state.value handling
	if (typeof state.value !== "string") {
		throw new Error("Nested states not supported in this demo");
	}
	const currentState = state.value;

	const { email, password, error, attempts } = state.context;

	const isFormValid =
		email.length > 0 && email.includes("@") && password.length >= 6;
	const isLoading =
		currentState === "validating" || currentState === "submitting";
	const canRetry = attempts < 3;

	const handleEvent = (event: string) => {
		send({ type: event } as LoginEvent);
	};

	return (
		<DemoSection
			title="Advanced XState: Guards, Actions & Context"
			description="Login form demonstrating guards (validation), actions (side effects), context (data storage), and error/retry patterns"
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
					{currentState === "success" ? (
						<motion.div
							key="success"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							className="space-y-4 text-center"
						>
							<div className="text-4xl">✓</div>
							<h3 className="text-lg font-semibold text-emerald-400">
								Login Successful!
							</h3>
							<p className="text-zinc-400">Welcome back, {email}</p>
							<p className="text-xs text-zinc-500">
								Succeeded after {attempts} attempt{attempts !== 1 ? "s" : ""}
							</p>
							<button
								type="button"
								onClick={() => send({ type: "RESET" })}
								className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
							>
								Start Over
							</button>
						</motion.div>
					) : (
						<motion.div
							key="form"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="space-y-4"
						>
							<h3 className="text-lg font-semibold text-white">Login Form</h3>

							<div className="space-y-2">
								<label htmlFor="email" className="block text-sm text-zinc-400">
									Email
								</label>
								<input
									id="email"
									type="email"
									placeholder="user@example.com"
									value={email}
									onChange={(e) =>
										send({ type: "UPDATE_EMAIL", value: e.target.value })
									}
									disabled={isLoading}
									className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
								/>
								{email.length > 0 && !email.includes("@") && (
									<p className="text-xs text-amber-400">Email must contain @</p>
								)}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="password"
									className="block text-sm text-zinc-400"
								>
									Password
								</label>
								<input
									id="password"
									type="password"
									placeholder="At least 6 characters"
									value={password}
									onChange={(e) =>
										send({ type: "UPDATE_PASSWORD", value: e.target.value })
									}
									disabled={isLoading}
									className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
								/>
								{password.length > 0 && password.length < 6 && (
									<p className="text-xs text-amber-400">
										Password must be at least 6 characters
									</p>
								)}
							</div>

							{error && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
								>
									{error}
								</motion.div>
							)}

							{currentState === "error" && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm"
								>
									<p>
										Attempts: {attempts}/3{" "}
										{!canRetry && "(Max retries reached)"}
									</p>
								</motion.div>
							)}

							<div className="flex gap-2">
								{currentState === "error" && (
									<>
										{canRetry && (
											<button
												type="button"
												onClick={() => send({ type: "RETRY" })}
												className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
											>
												Retry ({3 - attempts} left)
											</button>
										)}
										<button
											type="button"
											onClick={() => send({ type: "RESET" })}
											className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
										>
											Reset Form
										</button>
									</>
								)}
								{currentState === "idle" && (
									<button
										type="button"
										onClick={() => send({ type: "SUBMIT" })}
										disabled={!isFormValid}
										className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										Submit
									</button>
								)}
								{isLoading && (
									<div className="flex items-center gap-2 text-zinc-400">
										<div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
										{currentState === "validating"
											? "Validating..."
											: "Logging in..."}
									</div>
								)}
							</div>

							{!isFormValid && email.length === 0 && password.length === 0 && (
								<p className="text-xs text-zinc-500">
									Hint: Try any email (with @) and password (6+ chars). API has
									30% failure rate.
								</p>
							)}
						</motion.div>
					)}
				</motion.div>

				<div className="space-y-4">
					<h4 className="text-sm font-semibold text-zinc-400">
						Machine Definition
					</h4>
					<ShikiCode language="typescript" code={machineCode} />
				</div>

				<div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
					<h4 className="text-sm font-semibold text-violet-400 mb-2">
						Advanced XState Features
					</h4>
					<ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside">
						<li>
							<strong>Guards:</strong> Prevent invalid transitions (submit only
							if form valid)
						</li>
						<li>
							<strong>Actions:</strong> Side effects like logging, updating
							context
						</li>
						<li>
							<strong>Context:</strong> Machine-managed data (no separate
							useState)
						</li>
						<li>
							<strong>Actors:</strong> Async operations with automatic
							error/success handling
						</li>
						<li>
							<strong>Entry actions:</strong> Run side effects when entering a
							state
						</li>
					</ul>
				</div>
			</div>
		</DemoSection>
	);
}
