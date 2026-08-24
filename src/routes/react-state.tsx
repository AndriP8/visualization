import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BatchingVisualizerDemo } from "../components/react-state/BatchingVisualizerDemo";
import { ContextRerenderDemo } from "../components/react-state/ContextRerenderDemo";
import { MemoCallbackDemo } from "../components/react-state/MemoCallbackDemo";
import { RerenderPropagationDemo } from "../components/react-state/RerenderPropagationDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/react-state")({
	component: ReactStatePage,
});

function ReactStatePage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "React", color: "cyan" }}
				title="State & Re-renders"
				subtitle="A state update in React triggers a re-render of the owning component and every descendant by default — regardless of whether their props changed. The rendering cost cascades down the component tree, and the fixes are easy to misapply."
				gradient={{ from: "cyan-400", to: "blue-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								React's re-render model is opt-out, not opt-in:{" "}
								<span className="text-cyan-300 font-medium">
									any state change
								</span>{" "}
								re-renders the component and all its children. React.memo breaks
								propagation by bailing out when props are shallowly equal, but
								it's invalidated by inline object or function props created
								fresh each render — which is why React.memo without useCallback
								or useMemo rarely helps. Batching (React 18 groups all updates
								in an event handler into one re-render) reduces unnecessary work
								without any explicit optimization.
							</p>
							<p>
								Context is the most common source of invisible re-renders:{" "}
								<span className="text-cyan-300 font-medium">
									every consumer re-renders when the context value changes
								</span>
								, even if the specific slice of state it reads is unchanged.
								Splitting contexts by update frequency — separating frequently
								changing values from stable ones — is the primary fix, not
								memoization.
							</p>
							<p className="text-zinc-400">
								The demos below cover re-render propagation, batching behavior,
								context re-render patterns, and React.memo with useCallback
								trade-offs.
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
				<RerenderPropagationDemo />
				<BatchingVisualizerDemo />
				<ContextRerenderDemo />
				<MemoCallbackDemo />
			</motion.div>
		</div>
	);
}
