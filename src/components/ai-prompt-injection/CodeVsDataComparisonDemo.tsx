import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

export function CodeVsDataComparisonDemo() {
	const [activeTab, setActiveTab] = useState<"sql" | "llm">("sql");

	return (
		<DemoSection
			title="4. Code vs Data: Why Prompt Injection is Fundamentally Hard"
			description="SQL injection was solved by separating syntax from parameters at the compiler level. LLMs operate on a flat token stream where instructions and data are processed identically."
		>
			<div className="space-y-6">
				{/* Tab Selector */}
				<div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 max-w-md">
					<button
						type="button"
						onClick={() => setActiveTab("sql")}
						className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
							activeTab === "sql"
								? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						SQL: Prepared Statements (Solved)
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("llm")}
						className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
							activeTab === "llm"
								? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						LLM: Unified Attention Field (Unsolved)
					</button>
				</div>

				{/* Comparative Panels */}
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
					className="grid grid-cols-1 lg:grid-cols-12 gap-5"
				>
					{/* Left: Mechanism & Representation */}
					<div className="lg:col-span-7 space-y-4">
						{activeTab === "sql" ? (
							<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
										Abstract Syntax Tree (AST) Boundary
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
										COMPILE-TIME ISOLATION
									</span>
								</div>

								{/* AST Visualization Box */}
								<div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
									<div className="text-emerald-400 font-semibold">
										SELECT Statement [Root]
									</div>
									<div className="pl-4 border-l border-zinc-700 space-y-1 text-zinc-400">
										<div>
											├── Target: <span className="text-zinc-200">users.*</span>
										</div>
										<div>
											├── Table: <span className="text-zinc-200">users</span>
										</div>
										<div>
											└── WHERE Clause [BinaryOperator: EQUALS]
											<div className="pl-4 border-l border-zinc-700 space-y-1">
												<div>
													├── Column:{" "}
													<span className="text-zinc-200">username</span>
												</div>
												<div className="text-emerald-300 font-bold">
													└── Bound Parameter (Literal):{" "}
													<span className="text-amber-300">"' OR '1'='1"</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="text-xs text-zinc-400 leading-relaxed">
									The SQL engine builds the query structure{" "}
									<span className="text-zinc-200 font-medium">before</span>{" "}
									evaluating parameter values. The quote marks and boolean logic
									inside the payload can never escape the leaf node into the
									syntax tree.
								</div>

								<ShikiCode
									code={`-- Parameterized Query\nPREPARE getUserPlan AS\n  SELECT plan FROM users WHERE username = $1;\n\n-- Executed with raw malicious string\nEXECUTE getUserPlan("' OR '1'='1 --");`}
									language="sql"
									showLineNumbers={false}
								/>
							</div>
						) : (
							<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
										Flat Transformer Attention Field
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
										NO LEXICAL BARRIER
									</span>
								</div>

								{/* Attention Matrix Visualization Box */}
								<div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-3">
									<div className="text-rose-400 font-semibold">
										Attention Calculation: Softmax(Q · Kᵀ / √d) · V
									</div>
									<div className="grid grid-cols-4 gap-1 text-[11px] text-center">
										<div className="p-2 rounded bg-indigo-950/70 border border-indigo-700/50 text-indigo-300">
											[Sys: System]
										</div>
										<div className="p-2 rounded bg-indigo-950/70 border border-indigo-700/50 text-indigo-300">
											[Sys: Secret]
										</div>
										<div className="p-2 rounded bg-rose-950/70 border border-rose-700/50 text-rose-300 font-semibold">
											[User: Ignore]
										</div>
										<div className="p-2 rounded bg-rose-950/70 border border-rose-700/50 text-rose-300 font-semibold">
											[User: Reveal]
										</div>
									</div>
									<div className="text-[11px] text-zinc-400">
										All 4 tokens share the exact same embedding space. There is
										no type checker or syntax parser preventing token 3 from
										overriding token 1.
									</div>
								</div>

								<div className="text-xs text-zinc-400 leading-relaxed">
									LLMs process natural language probabilistically. Because
									natural language instructions and natural language data use
									the exact same vocabulary, delimiters are merely suggestions
									to the attention mechanism.
								</div>

								<ShikiCode
									code={`# Flat string passed to model\nprompt = f"System: Keep secrets.\\nUser: {user_input}"\n# Transformer converts everything to tokens [1821, 492, 991, 4402]`}
									language="python"
									showLineNumbers={false}
								/>
							</div>
						)}
					</div>

					{/* Right: Structural Comparison Matrix */}
					<div className="lg:col-span-5 space-y-4">
						<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
							<span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
								Paradigm Comparison
							</span>

							<div className="space-y-2 text-xs">
								<div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
									<span className="text-zinc-400">Execution Model</span>
									<span className="font-mono font-medium text-zinc-200">
										{activeTab === "sql"
											? "Deterministic AST"
											: "Probabilistic Transformer"}
									</span>
								</div>

								<div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
									<span className="text-zinc-400">Code/Data Boundary</span>
									<span
										className={`font-mono font-semibold ${activeTab === "sql" ? "text-emerald-400" : "text-rose-400"}`}
									>
										{activeTab === "sql"
											? "Grammar Level (Strict)"
											: "Semantic Level (Heuristic)"}
									</span>
								</div>

								<div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
									<span className="text-zinc-400">Parsing Stage</span>
									<span className="font-mono text-zinc-200">
										{activeTab === "sql"
											? "Pre-execution compilation"
											: "Autoregressive generation"}
									</span>
								</div>

								<div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
									<span className="text-zinc-400">100% Defense Possible?</span>
									<span
										className={`font-mono font-bold ${activeTab === "sql" ? "text-emerald-400" : "text-rose-400"}`}
									>
										{activeTab === "sql"
											? "YES (Prepared Stmt)"
											: "NO (In single context)"}
									</span>
								</div>
							</div>
						</div>

						{/* Architectural Conclusion */}
						<div className="rounded-xl border border-indigo-900/30 bg-indigo-950/20 p-4 space-y-2 text-xs text-indigo-200/90 leading-relaxed">
							<span className="font-semibold text-indigo-300">
								Engineering Conclusion:{" "}
							</span>
							Prompt injection cannot be solved by better system prompts alone.
							Production AI systems must treat LLMs as untrusted computation
							nodes and isolate privileges outside the context window.
						</div>
					</div>
				</motion.div>
			</div>
		</DemoSection>
	);
}
