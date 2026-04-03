import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ConcurrentRenderingDemo } from "../components/react-concurrent/ConcurrentRenderingDemo";
import { DeferredValueDemo } from "../components/react-concurrent/DeferredValueDemo";
import { SuspenseStreamingDemo } from "../components/react-concurrent/SuspenseStreamingDemo";
import { TransitionDemo } from "../components/react-concurrent/TransitionDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/react-concurrent")({
	component: ReactConcurrentPage,
});

function ReactConcurrentPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "React", color: "violet" }}
				title="Concurrent Features"
				subtitle="How React 18 transitions, deferred values, and Suspense keep UIs responsive under load."
				gradient={{
					from: "violet-400",
					via: "purple-400",
					to: "fuchsia-400",
				}}
			/>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.3, duration: 0.4 }}
				className="space-y-16"
			>
				<ConcurrentRenderingDemo />
				<TransitionDemo />
				<DeferredValueDemo />
				<SuspenseStreamingDemo />

				{/* Decision Matrix */}
				<div className="rounded-xl border border-border-primary bg-surface-primary/50 overflow-hidden">
					<div className="px-6 py-4 border-b border-border-primary">
						<h3 className="text-lg font-semibold text-text-primary">
							When to Use What
						</h3>
						<p className="text-sm text-text-tertiary mt-1">
							Common misconceptions addressed
						</p>
					</div>
					<div className="p-6 space-y-6">
						{/* Decision table */}
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border-secondary">
										<th className="text-left py-2 pr-4 text-text-tertiary font-medium">
											Scenario
										</th>
										<th className="text-left py-2 text-text-tertiary font-medium">
											Tool
										</th>
									</tr>
								</thead>
								<tbody className="text-text-secondary">
									<tr className="border-b border-border-primary">
										<td className="py-2 pr-4">
											Heavy list filtered on every keystroke
										</td>
										<td className="py-2">
											<code className="text-accent-emerald-soft">
												useDeferredValue
											</code>
										</td>
									</tr>
									<tr className="border-b border-border-primary">
										<td className="py-2 pr-4">
											Tab switch triggers expensive render
										</td>
										<td className="py-2">
											<code className="text-accent-emerald-soft">
												useTransition
											</code>
										</td>
									</tr>
									<tr className="border-b border-border-primary">
										<td className="py-2 pr-4">
											Data-fetching component needs loading state
										</td>
										<td className="py-2">
											<code className="text-accent-emerald-soft">Suspense</code>
										</td>
									</tr>
									<tr className="border-b border-border-primary">
										<td className="py-2 pr-4">Page navigation feels janky</td>
										<td className="py-2">
											<code className="text-accent-emerald-soft">
												startTransition on route change
											</code>
										</td>
									</tr>
									<tr>
										<td className="py-2 pr-4">
											User input blocked by background work
										</td>
										<td className="py-2">
											<code className="text-accent-emerald-soft">
												useTransition or useDeferredValue (opt-in)
											</code>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						{/* Misconceptions */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{[
								{
									myth: '"Concurrent mode makes things faster"',
									truth:
										"It makes things feel faster by prioritizing urgent updates",
								},
								{
									myth: '"useTransition delays the update"',
									truth: "It marks it interruptible, not delayed",
								},
								{
									myth: '"useDeferredValue debounces"',
									truth:
										"It shows the latest value React has time for — no timer involved",
								},
								{
									myth: '"Suspense is only for code splitting"',
									truth:
										"It works with any async resource that throws a Promise",
								},
							].map((item) => (
								<div
									key={item.myth}
									className="bg-surface-secondary/50 rounded-lg p-3 border border-border-secondary/50"
								>
									<p className="text-xs text-accent-red-soft line-through mb-1">
										{item.myth}
									</p>
									<p className="text-xs text-accent-emerald-soft">
										{item.truth}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
