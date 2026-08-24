import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AnalyzerRewriterDemo } from "../components/database-query-flow/AnalyzerRewriterDemo";
import { ExecutionEngineDemo } from "../components/database-query-flow/ExecutionEngineDemo";
import { ExplainAnalyzeDemo } from "../components/database-query-flow/ExplainAnalyzeDemo";
import { ParserDemo } from "../components/database-query-flow/ParserDemo";
import { PipelineOverviewDemo } from "../components/database-query-flow/PipelineOverviewDemo";
import { PlannerOptimizerDemo } from "../components/database-query-flow/PlannerOptimizerDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/database-query-flow")({
	component: DatabaseQueryFlow,
});

function DatabaseQueryFlow() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Database Internals", color: "emerald" }}
				title="Database Query Engine Flow"
				subtitle="Between receiving a SQL string and returning rows, a relational database runs it through four stages: parse the text into an AST, analyze and rewrite it against the schema, plan and cost multiple execution strategies, then execute the cheapest plan."
				gradient={{ from: "emerald-400", to: "teal-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								The <span className="text-emerald-300 font-medium">parser</span>{" "}
								validates syntax and produces an Abstract Syntax Tree. The
								analyzer resolves identifiers against the catalog (real table
								and column names), infers types, and rewrites views into their
								underlying queries. This separation means a syntax error is
								caught before any catalog lookup happens — but a missing column
								only surfaces in the analyzer phase.
							</p>
							<p>
								The{" "}
								<span className="text-fuchsia-300 font-medium">
									planner/optimizer
								</span>{" "}
								is where most of the intelligence lives. It enumerates multiple
								ways to execute the query (nested loop join vs hash join vs
								merge join, sequential scan vs index scan) and uses table
								statistics to estimate row counts and costs. The cheapest plan
								wins. This is why <code>EXPLAIN ANALYZE</code> is the most
								powerful debugging tool — it shows you what the planner expected
								vs what actually happened.
							</p>
							<p className="text-zinc-400">
								The demos below walk through the full pipeline: parser, analyzer
								and rewriter, planner and optimizer, execution engine, and
								EXPLAIN ANALYZE output.
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
				<PipelineOverviewDemo />
				<ParserDemo />
				<AnalyzerRewriterDemo />
				<PlannerOptimizerDemo />
				<ExecutionEngineDemo />
				<ExplainAnalyzeDemo />
			</motion.div>
		</div>
	);
}
