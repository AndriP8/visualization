import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageHeader } from "../components/shared/PageHeader";
import { AdvancedXStateDemo } from "../components/state-machines/AdvancedXStateDemo";
import { BasicStateMachineDemo } from "../components/state-machines/BasicStateMachineDemo";
import { BooleanSoupComparisonDemo } from "../components/state-machines/BooleanSoupComparisonDemo";
import { HierarchicalStatesDemo } from "../components/state-machines/HierarchicalStatesDemo";
import { VanillaStateMachineDemo } from "../components/state-machines/VanillaStateMachineDemo";

export const Route = createFileRoute("/state-machines")({
	component: StateMachinesPage,
});

function StateMachinesPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "React", color: "cyan" }}
				title="State Machines"
				subtitle="Eliminate impossible states and entire classes of concurrency bugs through declarative state management. Learn why explicit state machines prevent race conditions that plague boolean-based approaches."
				gradient={{ from: "cyan-400", to: "blue-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Boolean flags for async state ( <code>isLoading</code>,{" "}
								<code>isError</code>, <code>isSuccess</code>) create a
								combinatorial explosion of possible combinations — most of them
								meaningless or contradictory. A{" "}
								<span className="text-cyan-300 font-medium">state machine</span>{" "}
								replaces this with a finite set of named states and explicit
								transitions. At any moment the system is in exactly one state,
								and only valid transitions are possible — making impossible
								states unrepresentable at the type level.
							</p>
							<p>
								The practical payoff is{" "}
								<span className="text-sky-300 font-medium">
									deterministic behavior
								</span>
								: same event + same state always produces the same next state.
								Race conditions collapse because concurrent events are processed
								sequentially through the transition function, not applied
								independently to separate flags. TypeScript discriminated unions
								enforce this at compile time without requiring a library.
							</p>
							<p className="text-zinc-400">
								The demos below cover basic finite state machines, boolean soup
								vs state machine comparison, hierarchical states, manual
								type-safe state machines, and advanced XState integration.
							</p>
						</div>
					),
				}}
			/>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.3, duration: 0.4 }}
				className="space-y-16"
			>
				<BasicStateMachineDemo />
				<BooleanSoupComparisonDemo />
				<HierarchicalStatesDemo />
				<VanillaStateMachineDemo />
				<AdvancedXStateDemo />

				{/* When to Use: Decision Matrix & Guidelines */}
				<div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
					<div className="px-6 py-4 border-b border-zinc-800">
						<h3 className="text-lg font-semibold text-white">
							When to Use State Machines
						</h3>
						<p className="text-sm text-zinc-400 mt-1">
							Understanding trade-offs to choose the right state pattern
						</p>
					</div>
					<div className="p-6 space-y-6">
						<div className="grid md:grid-cols-2 gap-6">
							{/* When to use */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
								<h4 className="text-sm font-semibold text-emerald-400">
									✓ Use State Machines When:
								</h4>
								<ul className="space-y-3 text-sm text-zinc-300">
									<li className="flex items-start gap-2">
										<span className="text-emerald-400 mt-1">•</span>
										<div>
											<strong>Complex async flows:</strong> Authentication,
											multi-step forms, media players, game states
										</div>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-emerald-400 mt-1">•</span>
										<div>
											<strong>Preventing impossible states:</strong> Can't be
											loading AND error simultaneously
										</div>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-emerald-400 mt-1">•</span>
										<div>
											<strong>Self-documenting behavior:</strong> State chart
											serves as visual documentation
										</div>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-emerald-400 mt-1">•</span>
										<div>
											<strong>Race condition bugs:</strong> Sequential
											operations with side effects
										</div>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-emerald-400 mt-1">•</span>
										<div>
											<strong>Testing critical paths:</strong> Explicit
											transitions make edge cases testable
										</div>
									</li>
								</ul>
							</div>

							{/* When NOT to use */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
								<h4 className="text-sm font-semibold text-amber-400">
									⚠ Skip State Machines When:
								</h4>
								<ul className="space-y-3 text-sm text-zinc-300">
									<li className="flex items-start gap-2">
										<span className="text-amber-400 mt-1">•</span>
										<div>
											<strong>Simple toggles:</strong> Single boolean (
											<code className="text-xs bg-zinc-800 px-1 rounded">
												isOpen
											</code>
											) is clearer than a state machine
										</div>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-amber-400 mt-1">•</span>
										<div>
											<strong>No invalid states possible:</strong> If booleans
											can't conflict, keep it simple
										</div>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-amber-400 mt-1">•</span>
										<div>
											<strong>Continuous values:</strong> Sliders, scroll
											positions — not discrete states
										</div>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-amber-400 mt-1">•</span>
										<div>
											<strong>Over-engineering risk:</strong> Adding complexity
											where useState suffices
										</div>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-amber-400 mt-1">•</span>
										<div>
											<strong>Team unfamiliarity:</strong> Learning curve may
											outweigh benefits for simple cases
										</div>
									</li>
								</ul>
							</div>
						</div>

						{/* Real-World Decision Matrix */}
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-zinc-700">
										<th className="text-left py-2 px-3 text-zinc-400 font-medium">
											Scenario
										</th>
										<th className="text-left py-2 px-3 text-zinc-400 font-medium">
											Boolean Flags
										</th>
										<th className="text-left py-2 px-3 text-zinc-400 font-medium">
											State Machine
										</th>
										<th className="text-left py-2 px-3 text-zinc-400 font-medium">
											Winner
										</th>
									</tr>
								</thead>
								<tbody className="text-zinc-300">
									<tr className="border-b border-zinc-800">
										<td className="py-3 px-3">Modal open/close</td>
										<td className="py-3 px-3 text-emerald-400">✓ Simple</td>
										<td className="py-3 px-3 text-amber-400">Overkill</td>
										<td className="py-3 px-3 font-medium">Boolean</td>
									</tr>
									<tr className="border-b border-zinc-800">
										<td className="py-3 px-3">
											API request (idle/loading/success/error)
										</td>
										<td className="py-3 px-3 text-rose-400">Race conditions</td>
										<td className="py-3 px-3 text-emerald-400">✓ Type-safe</td>
										<td className="py-3 px-3 font-medium text-cyan-300">
											State Machine
										</td>
									</tr>
									<tr className="border-b border-zinc-800">
										<td className="py-3 px-3">Multi-step wizard / checkout</td>
										<td className="py-3 px-3 text-rose-400">
											Impossible states
										</td>
										<td className="py-3 px-3 text-emerald-400">
											✓ Self-documenting
										</td>
										<td className="py-3 px-3 font-medium text-cyan-300">
											State Machine
										</td>
									</tr>
									<tr className="border-b border-zinc-800">
										<td className="py-3 px-3">Form field validation</td>
										<td className="py-3 px-3 text-emerald-400">✓ Adequate</td>
										<td className="py-3 px-3 text-amber-400">Verbose</td>
										<td className="py-3 px-3 font-medium">Boolean</td>
									</tr>
									<tr>
										<td className="py-3 px-3">
											WebSocket / connection lifecycle
										</td>
										<td className="py-3 px-3 text-rose-400">
											Reconnection bugs
										</td>
										<td className="py-3 px-3 text-emerald-400">
											✓ Handles retries
										</td>
										<td className="py-3 px-3 font-medium text-cyan-300">
											State Machine
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* Key Takeaways */}
				<div className="bg-linear-to-r from-cyan-950/40 via-blue-950/40 to-indigo-950/40 border border-cyan-800/40 rounded-xl p-6">
					<h3 className="text-lg font-semibold text-white mb-4">
						Key Takeaways
					</h3>
					<div className="grid md:grid-cols-3 gap-6 text-sm text-zinc-300">
						<div>
							<div className="text-cyan-400 font-medium mb-2">
								1. Impossible States
							</div>
							<p className="text-xs text-zinc-400 leading-relaxed">
								State machines make invalid states unrepresentable. TypeScript
								prevents accessing <code className="text-cyan-300">data</code>{" "}
								in a loading or error state.
							</p>
						</div>
						<div>
							<div className="text-blue-400 font-medium mb-2">
								2. Deterministic Behavior
							</div>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Same event + same state = same result. Eliminates race
								conditions and simplifies unit testing for asynchronous
								interactions.
							</p>
						</div>
						<div>
							<div className="text-sky-400 font-medium mb-2">
								3. Self-Documenting
							</div>
							<p className="text-xs text-zinc-400 leading-relaxed">
								State charts visualize all allowed states and transitions,
								making system contracts clear and unambiguous.
							</p>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
