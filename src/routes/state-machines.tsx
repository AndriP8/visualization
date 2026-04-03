import { createFileRoute } from "@tanstack/react-router";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";
import { ShikiCode } from "../components/shared/ShikiCode";
import { BasicStateMachineDemo } from "../components/state-machines/BasicStateMachineDemo";
import { BooleanSoupComparisonDemo } from "../components/state-machines/BooleanSoupComparisonDemo";
import { HierarchicalStatesDemo } from "../components/state-machines/HierarchicalStatesDemo";

export const Route = createFileRoute("/state-machines")({
	component: StateMachinesPage,
});

function StateMachinesPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "Software Architecture", color: "violet" }}
				title="State Machines"
				subtitle="Eliminate impossible states and entire classes of concurrency bugs through declarative state management. Learn why explicit state machines prevent race conditions that plague boolean-based approaches."
				gradient={{ from: "violet-400", via: "purple-400", to: "fuchsia-400" }}
			/>

			<div className="space-y-16">
				{/* What is a State Machine */}
				<DemoSection
					title="Basic Finite State Machine"
					description="A state machine is a mathematical model with a finite number of states and explicit transitions between them. At any moment, it's in exactly one state, and transitions occur in response to events."
				>
					<BasicStateMachineDemo />
				</DemoSection>

				{/* Why: Boolean Soup vs State Machine */}
				<DemoSection
					title="State Machine vs Boolean Soup"
					description="See how boolean flags create impossible states and race conditions that state machines prevent by design. Click 'Trigger Bug' on the left to see what happens when multiple booleans are true simultaneously."
				>
					<BooleanSoupComparisonDemo />
				</DemoSection>

				{/* Show: Hierarchical and Parallel States */}
				<DemoSection
					title="Hierarchical & Parallel States"
					description="Advanced state machines support nested states (substates within parent states) and parallel states (independent orthogonal regions). This models complex real-world systems like media players."
				>
					<HierarchicalStatesDemo />
				</DemoSection>

				{/* How: Implementation Patterns */}
				<DemoSection
					title="Implementation: Manual State Machine"
					description="Build a type-safe state machine from scratch using TypeScript discriminated unions. Each state is a distinct type, making impossible states unrepresentable."
				>
					<div className="space-y-6">
						<div>
							<h4 className="text-sm font-semibold text-text-primary mb-3">
								Define States as Discriminated Union
							</h4>
							<ShikiCode
								language="typescript"
								code={`// Each state is a unique type
type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string }
  | { status: "error"; error: string };

// TypeScript enforces correctness:
// ✅ if (state.status === "success") { console.log(state.data) }
// ❌ if (state.status === "loading") { console.log(state.data) }
//    Property 'data' does not exist on type '{ status: "loading" }'`}
								className="text-xs"
							/>
						</div>

						<div>
							<h4 className="text-sm font-semibold text-text-primary mb-3">
								Implement Transitions
							</h4>
							<ShikiCode
								language="typescript"
								code={`function transition(
  state: RequestState,
  event: { type: "FETCH" } | { type: "SUCCESS"; data: string } | { type: "ERROR"; error: string }
): RequestState {
  switch (state.status) {
    case "idle":
      if (event.type === "FETCH") return { status: "loading" };
      return state; // Ignore invalid events

    case "loading":
      if (event.type === "SUCCESS") return { status: "success", data: event.data };
      if (event.type === "ERROR") return { status: "error", error: event.error };
      return state;

    case "success":
    case "error":
      if (event.type === "FETCH") return { status: "loading" };
      return state;
  }
}

// Usage
let state: RequestState = { status: "idle" };
state = transition(state, { type: "FETCH" });
state = transition(state, { type: "SUCCESS", data: "User data" });`}
								className="text-xs"
							/>
						</div>

						<div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
							<div className="text-sm text-accent-violet">
								<strong>Key benefits:</strong> Type system prevents accessing{" "}
								<code className="text-accent-violet bg-surface-secondary px-1 rounded">
									data
								</code>{" "}
								when in loading state. Transitions are explicit and testable. No
								hidden bugs from race conditions.
							</div>
						</div>
					</div>
				</DemoSection>

				{/* How: XState Library */}
				<DemoSection
					title="Implementation: XState Library"
					description="XState is the industry-standard library for state machines in JavaScript/TypeScript. It provides visualizers, testing tools, and advanced features like guards, actions, and state charts."
				>
					<div className="space-y-6">
						<div>
							<h4 className="text-sm font-semibold text-text-primary mb-3">
								Define Machine with XState
							</h4>
							<ShikiCode
								language="typescript"
								code={`import { createMachine, interpret } from "xstate";

const fetchMachine = createMachine({
  id: "fetch",
  initial: "idle",
  states: {
    idle: {
      on: { FETCH: "loading" }
    },
    loading: {
      on: {
        SUCCESS: "success",
        ERROR: "error"
      }
    },
    success: {
      on: { FETCH: "loading" }
    },
    error: {
      on: { FETCH: "loading" }
    }
  }
});

// Interpret (run) the machine
const service = interpret(fetchMachine).start();

// Listen to state changes
service.subscribe((state) => {
  console.log(state.value); // "idle", "loading", etc.
});

// Send events
service.send("FETCH");
service.send("SUCCESS");`}
								className="text-xs"
							/>
						</div>

						<div>
							<h4 className="text-sm font-semibold text-text-primary mb-3">
								Advanced Features: Guards & Actions
							</h4>
							<ShikiCode
								language="typescript"
								code={`const authMachine = createMachine({
  id: "auth",
  initial: "loggedOut",
  context: { retries: 0 },
  states: {
    loggedOut: {
      on: { LOGIN: "loggingIn" }
    },
    loggingIn: {
      invoke: {
        src: "loginService",
        onDone: {
          target: "loggedIn",
          actions: "clearRetries" // Side effect
        },
        onError: [
          {
            target: "loggingIn",
            cond: "canRetry", // Guard: conditional transition
            actions: "incrementRetries"
          },
          { target: "error" }
        ]
      }
    },
    loggedIn: {
      on: { LOGOUT: "loggedOut" }
    },
    error: {}
  }
}, {
  guards: {
    canRetry: (context) => context.retries < 3
  },
  actions: {
    incrementRetries: assign({ retries: (ctx) => ctx.retries + 1 }),
    clearRetries: assign({ retries: 0 })
  }
});`}
								className="text-xs"
							/>
						</div>

						<div>
							<h4 className="text-sm font-semibold text-text-primary mb-3">
								React Integration
							</h4>
							<ShikiCode
								language="typescript"
								code={`import { useMachine } from "@xstate/react";

function FetchComponent() {
  const [state, send] = useMachine(fetchMachine);

  return (
    <div>
      {state.matches("idle") && (
        <button onClick={() => send("FETCH")}>Fetch Data</button>
      )}
      {state.matches("loading") && <p>Loading...</p>}
      {state.matches("success") && <p>Success!</p>}
      {state.matches("error") && <p>Error occurred</p>}
    </div>
  );
}`}
								className="text-xs"
							/>
						</div>

						<div className="bg-cyan-950/30 border border-cyan-800/50 rounded-lg p-4">
							<div className="text-sm text-accent-cyan">
								<strong>XState advantages:</strong> Built-in visualizer (
								<a
									href="https://stately.ai/viz"
									target="_blank"
									rel="noopener noreferrer"
									className="text-cyan-200 hover:text-cyan-100 underline"
								>
									stately.ai/viz
								</a>
								), actor model for complex systems, time-travel debugging, and
								automatic generation of state charts from code.
							</div>
						</div>
					</div>
				</DemoSection>

				{/* When: Use Cases and Trade-offs */}
				<DemoSection
					title="When to Use State Machines"
					description="State machines excel in specific scenarios but aren't always necessary. Understanding trade-offs helps you choose the right tool."
				>
					<div className="grid md:grid-cols-2 gap-6">
						{/* When to use */}
						<div className="bg-surface-primary border border-border-secondary rounded-lg p-6 space-y-4">
							<h4 className="text-sm font-semibold text-accent-green-soft">
								✓ Use State Machines When:
							</h4>
							<ul className="space-y-3 text-sm text-text-secondary">
								<li className="flex items-start gap-2">
									<span className="text-accent-green-soft mt-1">•</span>
									<div>
										<strong>Complex async flows:</strong> Authentication,
										multi-step forms, media players, game states
									</div>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-accent-green-soft mt-1">•</span>
									<div>
										<strong>Preventing impossible states:</strong> Can't be
										loading AND error simultaneously
									</div>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-accent-green-soft mt-1">•</span>
									<div>
										<strong>Self-documenting behavior:</strong> State chart
										serves as visual documentation
									</div>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-accent-green-soft mt-1">•</span>
									<div>
										<strong>Race condition bugs:</strong> Sequential operations
										with side effects
									</div>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-accent-green-soft mt-1">•</span>
									<div>
										<strong>Testing critical paths:</strong> Explicit
										transitions make edge cases testable
									</div>
								</li>
							</ul>
						</div>

						{/* When NOT to use */}
						<div className="bg-surface-primary border border-border-secondary rounded-lg p-6 space-y-4">
							<h4 className="text-sm font-semibold text-accent-amber-soft">
								⚠ Skip State Machines When:
							</h4>
							<ul className="space-y-3 text-sm text-text-secondary">
								<li className="flex items-start gap-2">
									<span className="text-accent-amber-soft mt-1">•</span>
									<div>
										<strong>Simple toggles:</strong> Single boolean (
										<code className="text-xs bg-surface-secondary px-1 rounded">
											isOpen
										</code>
										) is clearer than a state machine
									</div>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-accent-amber-soft mt-1">•</span>
									<div>
										<strong>No invalid states possible:</strong> If booleans
										can't conflict, keep it simple
									</div>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-accent-amber-soft mt-1">•</span>
									<div>
										<strong>Continuous values:</strong> Sliders, scroll
										positions - not discrete states
									</div>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-accent-amber-soft mt-1">•</span>
									<div>
										<strong>Over-engineering risk:</strong> Adding complexity
										where useState suffices
									</div>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-accent-amber-soft mt-1">•</span>
									<div>
										<strong>Team unfamiliarity:</strong> Learning curve may
										outweigh benefits for simple cases
									</div>
								</li>
							</ul>
						</div>
					</div>

					<div className="bg-surface-primary border border-border-secondary rounded-lg p-6 mt-6">
						<h4 className="text-sm font-semibold text-text-primary mb-4">
							Real-World Decision Matrix
						</h4>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border-secondary">
										<th className="text-left py-2 px-3 text-text-tertiary font-medium">
											Scenario
										</th>
										<th className="text-left py-2 px-3 text-text-tertiary font-medium">
											Boolean Soup
										</th>
										<th className="text-left py-2 px-3 text-text-tertiary font-medium">
											State Machine
										</th>
										<th className="text-left py-2 px-3 text-text-tertiary font-medium">
											Winner
										</th>
									</tr>
								</thead>
								<tbody className="text-text-secondary">
									<tr className="border-b border-border-primary">
										<td className="py-3 px-3">Modal open/close</td>
										<td className="py-3 px-3 text-accent-green-soft">
											✓ Simple
										</td>
										<td className="py-3 px-3 text-accent-amber-soft">
											Overkill
										</td>
										<td className="py-3 px-3 font-medium">Boolean</td>
									</tr>
									<tr className="border-b border-border-primary">
										<td className="py-3 px-3">
											API request (idle/loading/success/error)
										</td>
										<td className="py-3 px-3 text-accent-red-soft">
											Race conditions
										</td>
										<td className="py-3 px-3 text-accent-green-soft">
											✓ Type-safe
										</td>
										<td className="py-3 px-3 font-medium">State Machine</td>
									</tr>
									<tr className="border-b border-border-primary">
										<td className="py-3 px-3">Multi-step checkout flow</td>
										<td className="py-3 px-3 text-accent-red-soft">
											Impossible states
										</td>
										<td className="py-3 px-3 text-accent-green-soft">
											✓ Self-documenting
										</td>
										<td className="py-3 px-3 font-medium">State Machine</td>
									</tr>
									<tr className="border-b border-border-primary">
										<td className="py-3 px-3">Form field validation</td>
										<td className="py-3 px-3 text-accent-green-soft">
											✓ Adequate
										</td>
										<td className="py-3 px-3 text-accent-amber-soft">
											Verbose
										</td>
										<td className="py-3 px-3 font-medium">Boolean</td>
									</tr>
									<tr>
										<td className="py-3 px-3">
											WebSocket connection lifecycle
										</td>
										<td className="py-3 px-3 text-accent-red-soft">
											Reconnection bugs
										</td>
										<td className="py-3 px-3 text-accent-green-soft">
											✓ Handles retries
										</td>
										<td className="py-3 px-3 font-medium">State Machine</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</DemoSection>
			</div>

			{/* Summary */}
			<div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-6">
				<h3 className="text-lg font-semibold text-text-primary mb-4">
					Key Takeaways
				</h3>
				<div className="grid md:grid-cols-3 gap-6 text-sm text-text-secondary">
					<div>
						<div className="text-accent-violet-soft font-medium mb-2">
							1. Impossible States
						</div>
						<p>
							State machines make invalid states unrepresentable. TypeScript
							prevents you from accessing{" "}
							<code className="text-xs bg-surface-secondary px-1 rounded">
								data
							</code>{" "}
							in loading state.
						</p>
					</div>
					<div>
						<div className="text-accent-purple-soft font-medium mb-2">
							2. Deterministic Behavior
						</div>
						<p>
							Same event + same state = same result. Eliminates race conditions
							and makes testing straightforward.
						</p>
					</div>
					<div>
						<div className="text-accent-pink-soft font-medium mb-2">
							3. Self-Documenting
						</div>
						<p>
							State charts visualize all possible states and transitions. New
							engineers understand flow instantly.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
