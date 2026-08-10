import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
	component: Index,
});

const CONCEPT_GROUPS = [
	{
		title: "React",
		description: "Deep dive into React's internal workings",
		items: [
			{
				to: "/reconciliation" as const,
				title: "Reconciliation",
				icon: "🌳",
				description:
					"How React diffs the virtual tree and decides what to update in the real DOM.",
				tags: ["Fiber", "Diffing", "Keys", "Phases"],
				color: "from-violet-500/20 to-purple-500/20",
				borderColor: "border-violet-500/30",
			},
			{
				to: "/react-state" as const,
				title: "State & Re-renders",
				icon: "⚡",
				description:
					"What triggers re-renders, how they cascade through the tree, and when memo/useCallback actually help.",
				tags: ["Re-renders", "Batching", "Context", "Memoization"],
				color: "from-orange-500/20 to-amber-500/20",
				borderColor: "border-orange-500/30",
			},
			{
				to: "/react-concurrent" as const,
				title: "Concurrent Features",
				icon: "⚛️",
				description:
					"How React 18 transitions, deferred values, and Suspense keep UIs responsive by interleaving work and prioritizing urgent updates.",
				tags: ["useTransition", "useDeferredValue", "Suspense", "Scheduler"],
				color: "from-violet-500/20 to-fuchsia-500/20",
				borderColor: "border-violet-500/30",
			},
			{
				to: "/state-machines" as const,
				title: "State Machines",
				icon: "🤖",
				description:
					"Eliminate impossible states and race conditions with XState. See why explicit state machines prevent bugs that plague boolean-based approaches.",
				tags: ["FSM", "XState", "Type Safety", "Concurrency"],
				color: "from-violet-500/20 to-fuchsia-500/20",
				borderColor: "border-violet-500/30",
			},
		],
	},
	{
		title: "JavaScript",
		description: "Core language mechanics and runtime internals",
		items: [
			{
				to: "/closure-scope" as const,
				title: "Closure & Lexical Scope",
				icon: "🔍",
				description:
					"How JavaScript resolves variable names and the bugs that emerge when closures aren't fully understood.",
				tags: ["Closures", "Scope Chain", "Stale Closures", "React"],
				color: "from-cyan-500/20 to-blue-500/20",
				borderColor: "border-cyan-500/30",
			},
			{
				to: "/js-memory" as const,
				title: "Memory & Garbage Collection",
				icon: "🧠",
				description:
					"How V8 allocates memory, traces live objects from GC roots, and why memory leaks are just unintended references.",
				tags: ["Stack", "Heap", "Mark-and-Sweep", "Memory Leaks"],
				color: "from-emerald-500/20 to-teal-500/20",
				borderColor: "border-emerald-500/30",
			},
			{
				to: "/event-loop" as const,
				title: "Event Loop",
				icon: "🔄",
				description:
					"How JavaScript handles async code with a single thread — call stack, task queues, microtasks, and rAF.",
				tags: ["Call Stack", "Queues", "Microtasks", "rAF"],
				color: "from-rose-500/20 to-pink-500/20",
				borderColor: "border-rose-500/30",
			},
			{
				to: "/web-workers" as const,
				title: "Web Workers",
				icon: "⚙️",
				description:
					"How JavaScript achieves true parallelism — running code on separate threads without blocking the UI.",
				tags: ["Threads", "postMessage", "Transferable", "SharedWorker"],
				color: "from-emerald-500/20 to-teal-500/20",
				borderColor: "border-emerald-500/30",
			},
			{
				to: "/async-patterns" as const,
				title: "Async Patterns & Promises",
				icon: "⏳",
				description:
					"How async/await, Promise combinators, race conditions, and error handling actually work under the hood.",
				tags: [
					"async/await",
					"Promise.all",
					"Race Conditions",
					"Error Handling",
				],
				color: "from-cyan-500/20 to-blue-500/20",
				borderColor: "border-cyan-500/30",
			},
		],
	},
	{
		title: "Browser",
		description: "How browsers transform code into pixels on screen",
		items: [
			{
				to: "/critical-rendering-path" as const,
				title: "Critical Rendering Path",
				icon: "🎨",
				description:
					"How the browser converts HTML & CSS into rendered pixels — parsing, CSSOM, layout, paint, and compositing.",
				tags: ["DOM", "CSSOM", "Layout", "Paint"],
				color: "from-amber-500/20 to-orange-500/20",
				borderColor: "border-amber-500/30",
			},
			{
				to: "/web-performance-metrics" as const,
				title: "Web Performance Metrics",
				icon: "📊",
				description:
					"Core Web Vitals measure real-world user experience. LCP, CLS, INP, FCP, and TTFB — what they measure and how to optimize.",
				tags: ["LCP", "CLS", "INP", "FCP", "TTFB"],
				color: "from-blue-500/20 to-cyan-500/20",
				borderColor: "border-blue-500/30",
			},
			{
				to: "/resource-priority" as const,
				title: "Resource Loading Priority",
				icon: "🚦",
				description:
					"How browsers prioritize resources and how developer hints (preload, prefetch, async, defer) affect the loading waterfall.",
				tags: ["Preload", "Prefetch", "async", "defer", "Priority"],
				color: "from-amber-500/20 to-orange-500/20",
				borderColor: "border-amber-500/30",
			},
		],
	},
	{
		title: "Web",
		description: "Rendering approaches and patterns",
		items: [
			{
				to: "/rendering-strategies" as const,
				title: "Rendering Strategies",
				icon: "🌍",
				description:
					"CSR, SSR, SSG, ISR, Streaming SSR — when HTML is generated, where, and when the page becomes interactive.",
				tags: ["CSR", "SSR", "SSG", "ISR"],
				color: "from-violet-500/20 to-fuchsia-500/20",
				borderColor: "border-violet-500/30",
			},
		],
	},
	{
		title: "Database",
		description: "How databases store and retrieve data efficiently",
		items: [
			{
				to: "/database-indexing" as const,
				title: "Database Indexing",
				icon: "🗄️",
				description:
					"How B-Tree indexes work, clustered vs non-clustered, and when indexes hurt more than they help.",
				tags: ["B-Tree", "Full Scan", "Clustered", "Non-Clustered"],
				color: "from-teal-500/20 to-cyan-500/20",
				borderColor: "border-teal-500/30",
			},
			{
				to: "/sql-execution-order" as const,
				title: "SQL Execution Order",
				icon: "📋",
				description:
					"How SQL engines actually process queries — FROM before SELECT, WHERE before HAVING, and why execution order differs from written order.",
				tags: ["FROM", "WHERE", "GROUP BY", "SELECT"],
				color: "from-indigo-500/20 to-blue-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/database-transactions" as const,
				title: "Database Transactions & Isolation",
				icon: "🔒",
				description:
					"ACID properties, concurrency anomalies, isolation levels, and how MVCC prevents data corruption without blocking readers.",
				tags: ["ACID", "MVCC", "Isolation Levels", "Concurrency"],
				color: "from-violet-500/20 to-indigo-500/20",
				borderColor: "border-violet-500/30",
			},
			{
				to: "/database-query-flow" as const,
				title: "Query Engine Flow",
				icon: "⚙️",
				description:
					"How a SQL query travels from raw text through parsing, planning, optimization, and execution to return a result set.",
				tags: ["Parser", "Planner", "Optimizer", "Executor"],
				color: "from-teal-500/20 to-cyan-500/20",
				borderColor: "border-teal-500/30",
			},
		],
	},
	{
		title: "System Design",
		description: "Patterns for building scalable systems",
		items: [
			{
				to: "/caching-strategies" as const,
				title: "Caching Strategies",
				icon: "🏗️",
				description:
					"Client-side, CDN, server, database — where to cache, when to invalidate, and the consistency trade-offs.",
				tags: ["Client Cache", "CDN", "Redis", "Invalidation"],
				color: "from-blue-500/20 to-indigo-500/20",
				borderColor: "border-blue-500/30",
			},
			{
				to: "/api-patterns" as const,
				title: "API Communication Patterns",
				icon: "🔌",
				description:
					"REST, GraphQL, tRPC, WebSocket, SSE — how different patterns handle data fetching, updates, and real-time communication.",
				tags: ["REST", "GraphQL", "WebSocket", "SSE"],
				color: "from-blue-500/20 to-cyan-500/20",
				borderColor: "border-blue-500/30",
			},
			{
				to: "/load-balancing" as const,
				title: "Load Balancing Strategies",
				icon: "⚖️",
				description:
					"Round-robin, least connections, weighted, and consistent hashing — how distributed systems route requests across servers to maximize throughput.",
				tags: [
					"Round-Robin",
					"Least Connections",
					"Consistent Hashing",
					"Weighted",
				],
				color: "from-amber-500/20 to-orange-500/20",
				borderColor: "border-amber-500/30",
			},
		],
	},
	{
		title: "Network",
		description: "How browsers and servers communicate over the wire",
		items: [
			{
				to: "/http-versions" as const,
				title: "HTTP/1.1 vs HTTP/2",
				icon: "🌐",
				description:
					"How HTTP/2 multiplexing, header compression, and binary framing solve the fundamental performance bottlenecks of HTTP/1.1.",
				tags: ["Multiplexing", "HPACK", "HOL Blocking", "Server Push"],
				color: "from-blue-500/20 to-cyan-500/20",
				borderColor: "border-blue-500/30",
			},
		],
	},
	{
		title: "Web Security",
		description: "Authentication, authorization, and security patterns",
		items: [
			{
				to: "/auth-flows" as const,
				title: "Authentication Flows",
				icon: "🔐",
				description:
					"Session-based, JWT, and OAuth 2.0 + PKCE — how modern web apps verify identity and delegate authorization.",
				tags: ["Sessions", "JWT", "OAuth 2.0", "PKCE"],
				color: "from-red-500/20 to-rose-500/20",
				borderColor: "border-red-500/30",
			},
			{
				to: "/xss-csrf" as const,
				title: "XSS & CSRF Attacks",
				icon: "🛡️",
				description:
					"How cross-site scripting and forged requests exploit browser trust — reflected XSS, stored XSS, CSRF, and how to stop them.",
				tags: ["XSS", "CSRF", "CSP", "SameSite", "CORS"],
				color: "from-rose-500/20 to-red-500/20",
				borderColor: "border-rose-500/30",
			},
		],
	},
	{
		title: "Data Structures",
		description: "Core data structures visualized from first principles",
		items: [
			{
				to: "/hash-tables" as const,
				title: "Hash Tables",
				icon: "#️⃣",
				description:
					"How hash functions, buckets, and collision resolution turn O(n) lookups into amortized O(1) — and what breaks that guarantee.",
				tags: ["Hashing", "Collision", "Chaining", "Open Addressing"],
				color: "from-violet-500/20 to-purple-500/20",
				borderColor: "border-violet-500/30",
			},
			{
				to: "/linked-lists" as const,
				title: "Linked Lists",
				icon: "🔗",
				description:
					"O(1) insert/delete at a known position at the cost of O(n) traversal — singly, doubly, and circular variants compared.",
				tags: ["Singly", "Doubly", "Circular", "Pointer"],
				color: "from-cyan-500/20 to-teal-500/20",
				borderColor: "border-cyan-500/30",
			},
		],
	},
	{
		title: "AI Internals",
		description: "How models actually work under the hood",
		items: [
			{
				to: "/ai-tokenization" as const,
				title: "Tokenization",
				icon: "🔤",
				description:
					"Text isn't what the model sees — it's a sequence of integer IDs. BPE is the lossy compression step that decides what the model can represent.",
				tags: ["BPE", "Vocab", "Token IDs", "Pricing"],
				color: "from-fuchsia-500/20 to-pink-500/20",
				borderColor: "border-fuchsia-500/30",
			},
			{
				to: "/ai-attention" as const,
				title: "Attention Mechanism",
				icon: "🧠",
				description:
					"Every token attends to every other token simultaneously via Q/K/V projections. Multi-head attention runs this in parallel across subspaces.",
				tags: ["Q/K/V", "Multi-Head", "Softmax", "O(n²)"],
				color: "from-fuchsia-500/20 to-pink-500/20",
				borderColor: "border-fuchsia-500/30",
			},
			{
				to: "/ai-sampling" as const,
				title: "Sampling & Temperature",
				icon: "🎲",
				description:
					"The model outputs a distribution over the vocabulary at each step. Sampling strategy determines how it collapses into a single token — and defines creativity vs. reliability.",
				tags: ["Greedy", "Top-k", "Top-p", "Temperature"],
				color: "from-fuchsia-500/20 to-pink-500/20",
				borderColor: "border-fuchsia-500/30",
			},
			{
				to: "/ai-kv-cache" as const,
				title: "KV Cache",
				icon: "💾",
				description:
					"Inference happens in two phases — a parallel prefill burst, then sequential token-by-token decode. KV cache is the memory that makes decode fast.",
				tags: ["Prefill", "Decode", "TTFT", "TPS"],
				color: "from-fuchsia-500/20 to-pink-500/20",
				borderColor: "border-fuchsia-500/30",
			},
			{
				to: "/ai-context-window" as const,
				title: "Context Window",
				icon: "📏",
				description:
					"A large context window doesn't mean uniform attention. Models systematically underweight information in the middle of long contexts.",
				tags: ["RoPE", "Lost in Middle", "Position"],
				color: "from-fuchsia-500/20 to-pink-500/20",
				borderColor: "border-fuchsia-500/30",
			},
		],
	},
	{
		title: "AI Engineering",
		description: "Building production systems with LLMs",
		items: [
			{
				to: "/ai-prompt-engineering" as const,
				title: "Prompt Engineering",
				icon: "✍️",
				description:
					"Prompt structure changes how a model interprets instructions, examples, and output constraints.",
				tags: ["Few-Shot", "Hierarchy", "Reasoning"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-embeddings" as const,
				title: "Vector Embeddings",
				icon: "🧭",
				description:
					"Text is mapped to points in high-dimensional space where semantic similarity becomes geometric proximity — the foundation of search, RAG, and clustering.",
				tags: ["Cosine", "Analogy", "Projection"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-vector-search" as const,
				title: "Vector Search",
				icon: "🔍",
				description:
					"Exact kNN over millions of vectors is too slow for production. ANN algorithms like HNSW trade a small recall loss for orders-of-magnitude speedup.",
				tags: ["HNSW", "ANN", "Recall", "kNN"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-rag" as const,
				title: "RAG Pipeline",
				icon: "📚",
				description:
					"Retrieval-Augmented Generation grounds the model in external knowledge at inference time. The pipeline is simple; the failure modes are not.",
				tags: ["Retrieval", "Reranking", "Grounding"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-chunking" as const,
				title: "Chunking Strategies",
				icon: "✂️",
				description:
					"The same document chunked differently produces drastically different retrieval quality. Chunk size and boundary strategy decide if context is coherent or garbage.",
				tags: ["Fixed", "Recursive", "Semantic", "Overlap"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-streaming" as const,
				title: "Streaming & SSE",
				icon: "🌊",
				description:
					"LLM APIs stream tokens over SSE so the UI renders progressively. Handling streams means managing backpressure, partial JSON, and clean cancellation.",
				tags: ["SSE", "Backpressure", "Abort", "Partial JSON"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-tool-calling" as const,
				title: "Tool Calling",
				icon: "🔧",
				description:
					"Tool calling lets the model emit structured function invocations. The application executes them and feeds results back — creating an agentic loop.",
				tags: ["Schema", "Loop", "Parallel", "Failures"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-structured-output" as const,
				title: "Structured Output",
				icon: "📐",
				description:
					'"Just ask for JSON" fails unpredictably. Constrained decoding guarantees valid structure by restricting which tokens are legal at each generation step.',
				tags: ["JSON Mode", "Grammar", "FSM", "Constrained"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-prompt-injection" as const,
				title: "Prompt Injection",
				icon: "🛡️",
				description:
					"Prompt injection exploits the model's inability to distinguish instructions from data. Attacker-controlled content in the context window can hijack behavior.",
				tags: ["Jailbreak", "Indirect", "Exfiltration", "Guardrails"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-fine-tuning" as const,
				title: "Fine-Tuning vs. RAG",
				icon: "⚖️",
				description:
					"Choose whether to teach the model how to behave, retrieve what it should know, or combine both.",
				tags: ["Weights", "Retrieval", "Hybrid"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-agent-loops" as const,
				title: "Agent Loops",
				icon: "🔄",
				description:
					"Agents alternate between reasoning, tool actions, and observations until they complete or hit a safety limit.",
				tags: ["ReAct", "Recovery", "Planning"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
			{
				to: "/ai-evals-guardrails" as const,
				title: "Evaluation & Guardrails",
				icon: "🛡️",
				description:
					"Measure quality continuously and intercept unsafe inputs or invalid outputs before they reach users.",
				tags: ["Judge", "Safety", "Regression"],
				color: "from-indigo-500/20 to-violet-500/20",
				borderColor: "border-indigo-500/30",
			},
		],
	},
];

function Index() {
	return (
		<div className="max-w-6xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<h2 className="text-3xl font-bold mb-2">
					<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
						Under the Hood
					</span>
				</h2>
				<p className="text-zinc-400 mb-8 text-lg">
					Interactive visualizations to understand how things actually work —
					from browser internals and React to databases and system design.
				</p>
			</motion.div>

			<div className="space-y-12">
				{CONCEPT_GROUPS.map((group, groupIndex) => (
					<div key={group.title}>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.1 + groupIndex * 0.1 }}
							className="mb-4"
						>
							<h3 className="text-xl font-bold text-white mb-1">
								{group.title}
							</h3>
							<p className="text-zinc-400 text-sm">{group.description}</p>
						</motion.div>

						<div className="grid gap-4 sm:grid-cols-2">
							{group.items.map((concept, i) => (
								<motion.div
									key={concept.to}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										duration: 0.4,
										delay: 0.2 + groupIndex * 0.1 + i * 0.1,
									}}
								>
									<Link
										to={concept.to}
										className={`
											block p-5 rounded-xl border ${concept.borderColor}
											bg-linear-to-br ${concept.color}
											hover:scale-[1.02] transition-transform duration-200
											group
										`}
									>
										<div className="text-2xl mb-3">{concept.icon}</div>
										<h3 className="text-lg font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">
											{concept.title}
										</h3>
										<p className="text-sm text-zinc-400 mb-3">
											{concept.description}
										</p>
										<div className="flex flex-wrap gap-1.5">
											{concept.tags.map((tag) => (
												<span
													key={tag}
													className="px-2 py-0.5 text-xs rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/50"
												>
													{tag}
												</span>
											))}
										</div>
									</Link>
								</motion.div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
