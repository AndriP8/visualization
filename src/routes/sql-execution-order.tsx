import { createFileRoute } from "@tanstack/react-router";
import { DemoSection } from "../components/shared/DemoSection";
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
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "Database Concepts", color: "blue" }}
				title="SQL Execution Order"
				subtitle="How you write a SQL query is fundamentally different from how the database engine executes it. Explore the Standard ANSI SQL execution pipeline to understand filtering, grouping, and rendering phases."
				gradient={{ from: "blue-400", via: "indigo-400", to: "purple-400" }}
			/>

			<div className="space-y-16">
				<DemoSection
					title="1. Written vs. Execution Order"
					description="Compare how a SQL query is written syntax-wise vs how it is logically executed step-by-step."
				>
					<WrittenVsExecutionDemo />
				</DemoSection>

				<DemoSection
					title="2. The Data Flow Pipeline"
					description="Watch the dataset transform as it passes through each clause of the standard SQL execution pipeline."
				>
					<DataFlowPipelineDemo />
				</DemoSection>

				<DemoSection
					title="3. Common Pitfalls Quiz"
					description="Test your understanding of SQL execution order and learn why certain syntax errors occur."
				>
					<ExecutionQuizDemo />
				</DemoSection>

				<DemoSection
					title="4. JOIN & Subquery Execution"
					description="Understand how JOINs combine tables and how subquery execution differs between correlated and non-correlated queries."
				>
					<JoinSubqueryDemo />
				</DemoSection>
			</div>
		</div>
	);
}
