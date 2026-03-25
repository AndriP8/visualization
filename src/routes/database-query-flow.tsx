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
				topic={{ label: "Database Internals", color: "violet" }}
				title="Database Query Engine Flow"
				subtitle="What actually happens inside a relational database engine (like PostgreSQL) between the moment it receives your raw SQL string and when it returns your data? Explore the incredible architecture of Parser, Planner, Optimizer, and Executor."
				gradient={{ from: "violet-400", via: "fuchsia-400", to: "cyan-400" }}
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
