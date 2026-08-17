import { createFileRoute } from "@tanstack/react-router";
import { AnalyzerRewriterDemo } from "../components/database-query-flow/AnalyzerRewriterDemo";
import { ExecutionEngineDemo } from "../components/database-query-flow/ExecutionEngineDemo";
import { ExplainAnalyzeDemo } from "../components/database-query-flow/ExplainAnalyzeDemo";
import { ParserDemo } from "../components/database-query-flow/ParserDemo";
import { PipelineOverviewDemo } from "../components/database-query-flow/PipelineOverviewDemo";
import { PlannerOptimizerDemo } from "../components/database-query-flow/PlannerOptimizerDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/database-query-flow")({
	component: DatabaseQueryFlow,
});

function DatabaseQueryFlow() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
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

			<div className="space-y-16">
				<DemoSection
					title="1. The Engine Pipeline"
					description="At a high level, a query must be parsed, semantically validated, planned, cost-optimized, and finally executed to fetch rows."
				>
					<PipelineOverviewDemo />
				</DemoSection>

				<DemoSection
					title="2. The Parser (SQL to AST)"
					description="The engine first checks syntax and translates your text query into a structured 'Parse Tree' (Abstract Syntax Tree) that it can understand."
				>
					<ParserDemo />
				</DemoSection>

				<DemoSection
					title="3. Analyzer & Rewriter"
					description="Resolves raw identifiers to real catalog objects, checks column types, expands views into base queries, and replaces aliases with fully-qualified names."
				>
					<AnalyzerRewriterDemo />
				</DemoSection>

				<DemoSection
					title="4. Planner & Optimizer"
					description="The engine generates multiple ways to execute your query (joins, scans, sorts). It uses statistics to estimate the cost of each, picking the cheapest plan."
				>
					<PlannerOptimizerDemo />
				</DemoSection>

				<DemoSection
					title="5. Execution Engine"
					description="Nodes in the optimal plan pull data through an iterator model. Watch how a Sequential Scan differs dramatically from an Index Scan when searching for a row."
				>
					<ExecutionEngineDemo />
				</DemoSection>

				<DemoSection
					title="6. EXPLAIN ANALYZE"
					description="The ultimate profiling tool. See the difference between what the Planner estimated and what actually happened during Execution."
				>
					<ExplainAnalyzeDemo />
				</DemoSection>
			</div>
		</div>
	);
}
