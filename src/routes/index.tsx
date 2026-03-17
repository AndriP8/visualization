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
		],
	},
	{
		title: "Web",
		description: "Full-stack rendering approaches and patterns",
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
					Full-Stack Concepts{" "}
					<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
						Under the Hood
					</span>
				</h2>
				<p className="text-zinc-400 mb-8 text-lg">
					Interactive visualizations to understand how the full stack actually
					works — from browser internals and React to databases and system
					design.
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
