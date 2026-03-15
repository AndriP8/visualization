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
				topic={{ label: "React Internals", color: "orange" }}
				title="State & Re-renders"
				subtitle="What actually triggers a re-render? How does it cascade down the component tree? And which tools — React.memo, useCallback, split contexts — can stop unnecessary work? Explore each mechanism interactively."
				gradient={{ from: "amber-400", via: "orange-400", to: "rose-400" }}
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
