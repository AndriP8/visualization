import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
	component: Index,
});

interface ConceptItem {
	to: string;
	title: string;
	icon: string;
	description: string;
	tags: string[];
}

interface ConceptGroup {
	title: string;
	description: string;
	hoverBorder: string;
	hoverText: string;
	items: ConceptItem[];
}

const CONCEPT_GROUPS: ConceptGroup[] = [
	{
		title: "React",
		description: "Deep dive into React's internal workings",
		hoverBorder: "hover:border-cyan-500/40",
		hoverText: "group-hover:text-cyan-300",
		items: [
			{
				to: "/reconciliation",
				title: "Reconciliation",
				icon: "🌳",
				description:
					"How React diffs the virtual tree and decides what to update in the real DOM.",
				tags: ["Fiber", "Diffing", "Keys", "Phases"],
			},
			{
				to: "/react-state",
				title: "State & Re-renders",
				icon: "⚡",
				description:
					"What triggers re-renders, how they cascade through the tree, and when memo/useCallback actually help.",
				tags: ["Re-renders", "Batching", "Context", "Memoization"],
			},
			{
				to: "/react-concurrent",
				title: "Concurrent Features",
				icon: "⚛️",
				description:
					"How React 18 transitions, deferred values, and Suspense keep UIs responsive by interleaving work and prioritizing urgent updates.",
				tags: ["useTransition", "useDeferredValue", "Suspense", "Scheduler"],
			},
			{
				to: "/state-machines",
				title: "State Machines",
				icon: "🤖",
				description:
					"Eliminate impossible states and race conditions with XState. See why explicit state machines prevent bugs that plague boolean-based approaches.",
				tags: ["FSM", "XState", "Type Safety", "Concurrency"],
			},
			{
				to: "/react-server-components",
				title: "Server Components",
				icon: "🌊",
				description:
					"Understand the boundary between Server and Client Components, serialization format, and streaming hydration.",
				tags: ["RSC", "Flight", "Streaming", "Zero-Bundle"],
			},
		],
	},
	{
		title: "JavaScript",
		description: "Core language mechanics and runtime internals",
		hoverBorder: "hover:border-amber-500/40",
		hoverText: "group-hover:text-amber-300",
		items: [
			{
				to: "/closure-scope",
				title: "Closure & Lexical Scope",
				icon: "🔍",
				description:
					"How JavaScript resolves variable names and the bugs that emerge when closures aren't fully understood.",
				tags: ["Closures", "Scope Chain", "Stale Closures", "React"],
			},
			{
				to: "/js-memory",
				title: "Memory & Garbage Collection",
				icon: "🧠",
				description:
					"How V8 allocates memory, traces live objects from GC roots, and why memory leaks are just unintended references.",
				tags: ["Stack", "Heap", "Mark-and-Sweep", "Memory Leaks"],
			},
			{
				to: "/event-loop",
				title: "Event Loop",
				icon: "🔄",
				description:
					"How JavaScript handles async code with a single thread — call stack, task queues, microtasks, and rAF.",
				tags: ["Call Stack", "Queues", "Microtasks", "rAF"],
			},
			{
				to: "/web-workers",
				title: "Web Workers",
				icon: "⚙️",
				description:
					"How JavaScript achieves true parallelism — running code on separate threads without blocking the UI.",
				tags: ["Threads", "postMessage", "Transferable", "SharedWorker"],
			},
			{
				to: "/async-patterns",
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
			},
		],
	},
	{
		title: "Browser",
		description: "How browsers transform code into pixels on screen",
		hoverBorder: "hover:border-orange-500/40",
		hoverText: "group-hover:text-orange-300",
		items: [
			{
				to: "/critical-rendering-path",
				title: "Critical Rendering Path",
				icon: "🎨",
				description:
					"How the browser converts HTML & CSS into rendered pixels — parsing, CSSOM, layout, paint, and compositing.",
				tags: ["DOM", "CSSOM", "Layout", "Paint"],
			},
			{
				to: "/web-performance-metrics",
				title: "Web Performance Metrics",
				icon: "📊",
				description:
					"Core Web Vitals measure real-world user experience. LCP, CLS, INP, FCP, and TTFB — what they measure and how to optimize.",
				tags: ["LCP", "CLS", "INP", "FCP", "TTFB"],
			},
			{
				to: "/resource-priority",
				title: "Resource Loading Priority",
				icon: "🚦",
				description:
					"How browsers prioritize resources and how developer hints (preload, prefetch, async, defer) affect the loading waterfall.",
				tags: ["Preload", "Prefetch", "async", "defer", "Priority"],
			},
		],
	},
	{
		title: "Web",
		description: "Rendering approaches and patterns",
		hoverBorder: "hover:border-indigo-500/40",
		hoverText: "group-hover:text-indigo-300",
		items: [
			{
				to: "/rendering-strategies",
				title: "Rendering Strategies",
				icon: "🌍",
				description:
					"CSR, SSR, SSG, ISR, Streaming SSR — when HTML is generated, where, and when the page becomes interactive.",
				tags: ["CSR", "SSR", "SSG", "ISR"],
			},
		],
	},
	{
		title: "Database",
		description: "How databases store and retrieve data efficiently",
		hoverBorder: "hover:border-emerald-500/40",
		hoverText: "group-hover:text-emerald-300",
		items: [
			{
				to: "/database-indexing",
				title: "Database Indexing",
				icon: "🗄️",
				description:
					"How B-Tree indexes work, clustered vs non-clustered, and when indexes hurt more than they help.",
				tags: ["B-Tree", "Full Scan", "Clustered", "Non-Clustered"],
			},
			{
				to: "/sql-execution-order",
				title: "SQL Execution Order",
				icon: "📋",
				description:
					"How SQL engines actually process queries — FROM before SELECT, WHERE before HAVING, and why execution order differs from written order.",
				tags: ["FROM", "WHERE", "GROUP BY", "SELECT"],
			},
			{
				to: "/database-transactions",
				title: "Database Transactions & Isolation",
				icon: "🔒",
				description:
					"ACID properties, concurrency anomalies, isolation levels, and how MVCC prevents data corruption without blocking readers.",
				tags: ["ACID", "MVCC", "Isolation Levels", "Concurrency"],
			},
			{
				to: "/database-query-flow",
				title: "Query Engine Flow",
				icon: "⚙️",
				description:
					"How a SQL query travels from raw text through parsing, planning, optimization, and execution to return a result set.",
				tags: ["Parser", "Planner", "Optimizer", "Executor"],
			},
		],
	},
	{
		title: "System Design",
		description: "Patterns for building scalable systems",
		hoverBorder: "hover:border-blue-500/40",
		hoverText: "group-hover:text-blue-300",
		items: [
			{
				to: "/caching-strategies",
				title: "Caching Strategies",
				icon: "🏗️",
				description:
					"Client-side, CDN, server, database — where to cache, when to invalidate, and the consistency trade-offs.",
				tags: ["Client Cache", "CDN", "Redis", "Invalidation"],
			},
			{
				to: "/api-patterns",
				title: "API Communication Patterns",
				icon: "🔌",
				description:
					"REST, GraphQL, tRPC, WebSocket, SSE — how different patterns handle data fetching, updates, and real-time communication.",
				tags: ["REST", "GraphQL", "WebSocket", "SSE"],
			},
			{
				to: "/load-balancing",
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
			},
		],
	},
	{
		title: "Network",
		description: "How browsers and servers communicate over the wire",
		hoverBorder: "hover:border-teal-500/40",
		hoverText: "group-hover:text-teal-300",
		items: [
			{
				to: "/http-versions",
				title: "HTTP/1.1 vs HTTP/2",
				icon: "🌐",
				description:
					"How HTTP/2 multiplexing, header compression, and binary framing solve the fundamental performance bottlenecks of HTTP/1.1.",
				tags: ["Multiplexing", "HPACK", "HOL Blocking", "Server Push"],
			},
			{
				to: "/webrtc",
				title: "WebRTC Data & Media",
				icon: "📡",
				description:
					"Peer-to-peer real-time audio, video, and data communication with ICE, STUN, and TURN fallback traversal.",
				tags: ["P2P", "ICE", "STUN/TURN", "SDP", "DataChannel"],
			},
		],
	},
	{
		title: "Web Security",
		description: "Authentication, authorization, and security patterns",
		hoverBorder: "hover:border-rose-500/40",
		hoverText: "group-hover:text-rose-300",
		items: [
			{
				to: "/auth-flows",
				title: "Authentication Flows",
				icon: "🔐",
				description:
					"Session-based, JWT, and OAuth 2.0 + PKCE — how modern web apps verify identity and delegate authorization.",
				tags: ["Sessions", "JWT", "OAuth 2.0", "PKCE"],
			},
			{
				to: "/xss-csrf",
				title: "XSS & CSRF Attacks",
				icon: "🛡️",
				description:
					"How cross-site scripting and forged requests exploit browser trust — reflected XSS, stored XSS, CSRF, and how to stop them.",
				tags: ["XSS", "CSRF", "CSP", "SameSite", "CORS"],
			},
		],
	},
	{
		title: "Data Structures",
		description: "Core data structures visualized from first principles",
		hoverBorder: "hover:border-purple-500/40",
		hoverText: "group-hover:text-purple-300",
		items: [
			{
				to: "/hash-tables",
				title: "Hash Tables",
				icon: "#️⃣",
				description:
					"How hash functions, buckets, and collision resolution turn O(n) lookups into amortized O(1) — and what breaks that guarantee.",
				tags: ["Hashing", "Collision", "Chaining", "Open Addressing"],
			},
			{
				to: "/linked-lists",
				title: "Linked Lists",
				icon: "🔗",
				description:
					"O(1) insert/delete at a known position at the cost of O(n) traversal — singly, doubly, and circular variants compared.",
				tags: ["Singly", "Doubly", "Circular", "Pointer"],
			},
		],
	},
	{
		title: "AI Internals",
		description: "How models actually work under the hood",
		hoverBorder: "hover:border-violet-500/40",
		hoverText: "group-hover:text-violet-300",
		items: [
			{
				to: "/ai-tokenization",
				title: "Tokenization",
				icon: "🔤",
				description:
					"Text isn't what the model sees — it's a sequence of integer IDs. BPE is the lossy compression step that decides what the model can represent.",
				tags: ["BPE", "Vocab", "Token IDs", "Pricing"],
			},
			{
				to: "/ai-attention",
				title: "Attention Mechanism",
				icon: "🧠",
				description:
					"Every token attends to every other token simultaneously via Q/K/V projections. Multi-head attention runs this in parallel across subspaces.",
				tags: ["Q/K/V", "Multi-Head", "Softmax", "O(n²)"],
			},
			{
				to: "/ai-sampling",
				title: "Sampling & Temperature",
				icon: "🎲",
				description:
					"The model outputs a distribution over the vocabulary at each step. Sampling strategy determines how it collapses into a single token — and defines creativity vs. reliability.",
				tags: ["Greedy", "Top-k", "Top-p", "Temperature"],
			},
			{
				to: "/ai-kv-cache",
				title: "KV Cache",
				icon: "💾",
				description:
					"Inference happens in two phases — a parallel prefill burst, then sequential token-by-token decode. KV cache is the memory that makes decode fast.",
				tags: ["Prefill", "Decode", "TTFT", "TPS"],
			},
			{
				to: "/ai-context-window",
				title: "Context Window",
				icon: "📏",
				description:
					"A large context window doesn't mean uniform attention. Models systematically underweight information in the middle of long contexts.",
				tags: ["RoPE", "Lost in Middle", "Position"],
			},
		],
	},
	{
		title: "AI Engineering",
		description: "Building production systems with LLMs",
		hoverBorder: "hover:border-violet-500/40",
		hoverText: "group-hover:text-violet-300",
		items: [
			{
				to: "/ai-prompt-engineering",
				title: "Prompt Engineering",
				icon: "✍️",
				description:
					"Prompt structure changes how a model interprets instructions, examples, and output constraints.",
				tags: ["Few-Shot", "Hierarchy", "Reasoning"],
			},
			{
				to: "/ai-embeddings",
				title: "Vector Embeddings",
				icon: "🧭",
				description:
					"Text is mapped to points in high-dimensional space where semantic similarity becomes geometric proximity — the foundation of search, RAG, and clustering.",
				tags: ["Cosine", "Analogy", "Projection"],
			},
			{
				to: "/ai-vector-search",
				title: "Vector Search",
				icon: "🔍",
				description:
					"Exact kNN over millions of vectors is too slow for production. ANN algorithms like HNSW trade a small recall loss for orders-of-magnitude speedup.",
				tags: ["HNSW", "ANN", "Recall", "kNN"],
			},
			{
				to: "/ai-rag",
				title: "RAG Pipeline",
				icon: "📚",
				description:
					"Retrieval-Augmented Generation grounds the model in external knowledge at inference time. The pipeline is simple; the failure modes are not.",
				tags: ["Retrieval", "Reranking", "Grounding"],
			},
			{
				to: "/ai-chunking",
				title: "Chunking Strategies",
				icon: "✂️",
				description:
					"The same document chunked differently produces drastically different retrieval quality. Chunk size and boundary strategy decide if context is coherent or garbage.",
				tags: ["Fixed", "Recursive", "Semantic", "Overlap"],
			},
			{
				to: "/ai-streaming",
				title: "Streaming & SSE",
				icon: "🌊",
				description:
					"LLM APIs stream tokens over SSE so the UI renders progressively. Handling streams means managing backpressure, partial JSON, and clean cancellation.",
				tags: ["SSE", "Backpressure", "Abort", "Partial JSON"],
			},
			{
				to: "/ai-tool-calling",
				title: "Tool Calling",
				icon: "🔧",
				description:
					"Tool calling lets the model emit structured function invocations. The application executes them and feeds results back — creating an agentic loop.",
				tags: ["Schema", "Loop", "Parallel", "Failures"],
			},
			{
				to: "/ai-structured-output",
				title: "Structured Output",
				icon: "📐",
				description:
					'"Just ask for JSON" fails unpredictably. Constrained decoding guarantees valid structure by restricting which tokens are legal at each generation step.',
				tags: ["JSON Mode", "Grammar", "FSM", "Constrained"],
			},
			{
				to: "/ai-prompt-injection",
				title: "Prompt Injection",
				icon: "🛡️",
				description:
					"Prompt injection exploits the model's inability to distinguish instructions from data. Attacker-controlled content in the context window can hijack behavior.",
				tags: ["Jailbreak", "Indirect", "Exfiltration", "Guardrails"],
			},
			{
				to: "/ai-fine-tuning",
				title: "Fine-Tuning vs. RAG",
				icon: "⚖️",
				description:
					"Choose whether to teach the model how to behave, retrieve what it should know, or combine both.",
				tags: ["Weights", "Retrieval", "Hybrid"],
			},
			{
				to: "/ai-agent-loops",
				title: "Agent Loops",
				icon: "🔄",
				description:
					"Agents alternate between reasoning, tool actions, and observations until they complete or hit a safety limit.",
				tags: ["ReAct", "Recovery", "Planning"],
			},
			{
				to: "/ai-evals-observability",
				title: "Evals & Observability",
				icon: "🚥",
				description:
					"Instrument LLM workflows with traces, token metrics, and latency spans to pinpoint latency bottlenecks and regression sources.",
				tags: ["OpenTelemetry", "Tracing", "Metrics", "Cost"],
			},
			{
				to: "/ai-evals-guardrails",
				title: "Evaluation & Guardrails",
				icon: "🛡️",
				description:
					"Measure quality continuously and intercept unsafe inputs or invalid outputs before they reach users.",
				tags: ["Judge", "Safety", "Regression"],
			},
		],
	},
];

function Index() {
	return (
		<div className="max-w-6xl mx-auto pb-12">
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
							transition={{ duration: 0.4, delay: 0.1 + groupIndex * 0.05 }}
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
										delay: 0.15 + groupIndex * 0.05 + i * 0.02,
									}}
									className="h-full flex"
								>
									<Link
										to={concept.to}
										className={`
											w-full h-full flex flex-col justify-between p-5 rounded-xl
											border border-zinc-800/80 bg-zinc-900/60
											${group.hoverBorder} hover:bg-zinc-900/90
											hover:scale-[1.01] transition-all duration-200
											group
										`}
									>
										<div>
											<div className="text-2xl mb-3">{concept.icon}</div>
											<h4
												className={`text-base font-semibold text-zinc-100 mb-2 ${group.hoverText} transition-colors`}
											>
												{concept.title}
											</h4>
											<p className="text-sm text-zinc-400 mb-4 leading-relaxed line-clamp-3">
												{concept.description}
											</p>
										</div>
										<div className="mt-auto pt-3 flex flex-wrap gap-1.5 border-t border-zinc-800/50">
											{concept.tags.map((tag) => (
												<span
													key={tag}
													className="px-2 py-0.5 text-xs rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
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
