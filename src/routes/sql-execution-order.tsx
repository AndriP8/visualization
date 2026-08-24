import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageHeader } from "../components/shared/PageHeader";
import { DataFlowPipelineDemo } from "../components/sql-execution-order/DataFlowPipelineDemo";
import { ExecutionQuizDemo } from "../components/sql-execution-order/ExecutionQuizDemo";
import { JoinSubqueryDemo } from "../components/sql-execution-order/JoinSubqueryDemo";
import { WrittenVsExecutionDemo } from "../components/sql-execution-order/WrittenVsExecutionDemo";

export const Route = createFileRoute("/sql-execution-order")({
	component: SQLExecutionOrder,
});

function SQLExecutionOrder() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Database Internals", color: "emerald" }}
				title="SQL Execution Order"
				subtitle="How you write a SQL query is fundamentally different from how the database engine executes it. Explore the Standard ANSI SQL execution pipeline to understand filtering, grouping, and rendering phases."
				gradient={{ from: "emerald-400", to: "teal-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								SQL is a declarative language — you describe what you want, not
								how to get it. The engine determines execution order, which
								diverges from the written order (SELECT → FROM → WHERE → GROUP
								BY → HAVING → ORDER BY → LIMIT). The actual logical execution
								starts with{" "}
								<span className="text-emerald-300 font-medium">
									FROM and JOIN
								</span>{" "}
								to build the working dataset, then WHERE filters rows, then
								GROUP BY aggregates, then HAVING filters groups — SELECT runs
								near the end, which is why you cannot reference a SELECT alias
								in a WHERE clause.
							</p>
							<p>
								Understanding this order resolves most SQL syntax errors and
								query optimization questions. It explains why{" "}
								<span className="text-indigo-300 font-medium">
									correlated subqueries
								</span>{" "}
								are expensive (re-executed per outer row), why column aliases
								defined in SELECT are invisible to WHERE, and how the planner
								rewrites your query before generating a physical execution plan.
							</p>
							<p className="text-zinc-400">
								The demos below cover written vs execution order, the data flow
								pipeline, common pitfalls quiz, and JOIN and subquery execution
								mechanics.
							</p>
						</div>
					),
				}}
			/>

			{/* Demos */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<WrittenVsExecutionDemo />
				<DataFlowPipelineDemo />
				<ExecutionQuizDemo />
				<JoinSubqueryDemo />
			</motion.div>
		</div>
	);
}
