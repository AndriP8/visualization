import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { ShikiCode } from "../shared/ShikiCode";

type Pattern = "rest-waterfall" | "rest-embed" | "graphql" | "trpc";

interface Request {
	id: number;
	label: string;
	depth: number;
	delay: number;
	bytes: number;
	color: string;
	status: "pending" | "in-flight" | "completed";
}

interface PatternDef {
	id: Pattern;
	label: string;
	icon: string;
	color: string;
	requestCount: number;
	totalBytes: number;
	waterfallDepth: number;
	description: string;
}

const PATTERNS: PatternDef[] = [
	{
		id: "rest-waterfall",
		label: "REST (Waterfall)",
		icon: "🌊",
		color: "rose",
		requestCount: 4,
		totalBytes: 12,
		waterfallDepth: 4,
		description: "Sequential requests - each depends on the previous",
	},
	{
		id: "rest-embed",
		label: "REST (Embed)",
		icon: "📦",
		color: "amber",
		requestCount: 1,
		totalBytes: 45,
		waterfallDepth: 1,
		description: "Single request with embedded data - over-fetching",
	},
	{
		id: "graphql",
		label: "GraphQL",
		icon: "◈",
		color: "cyan",
		requestCount: 1,
		totalBytes: 12,
		waterfallDepth: 1,
		description: "Single query requesting exact fields needed",
	},
	{
		id: "trpc",
		label: "tRPC",
		icon: "⚡",
		color: "violet",
		requestCount: 1,
		totalBytes: 12,
		waterfallDepth: 1,
		description: "Type-safe procedure call - like REST but with inference",
	},
];

const REQUEST_CONFIGS: Record<Pattern, Request[]> = {
	"rest-waterfall": [
		{
			id: 1,
			label: "GET /user",
			depth: 0,
			delay: 0,
			bytes: 3,
			color: "#fb7185",
			status: "pending",
		},
		{
			id: 2,
			label: "GET /user/posts",
			depth: 1,
			delay: 500,
			bytes: 4,
			color: "#fbbf24",
			status: "pending",
		},
		{
			id: 3,
			label: "GET /posts/likes",
			depth: 2,
			delay: 1000,
			bytes: 3,
			color: "#60a5fa",
			status: "pending",
		},
		{
			id: 4,
			label: "GET /posts/authors",
			depth: 3,
			delay: 1500,
			bytes: 2,
			color: "#a78bfa",
			status: "pending",
		},
	],
	"rest-embed": [
		{
			id: 1,
			label: "GET /user?embed=posts,likes,authors",
			depth: 0,
			delay: 0,
			bytes: 45,
			color: "#fbbf24",
			status: "pending",
		},
	],
	graphql: [
		{
			id: 1,
			label: "POST /graphql",
			depth: 0,
			delay: 0,
			bytes: 12,
			color: "#22d3ee",
			status: "pending",
		},
	],
	trpc: [
		{
			id: 1,
			label: "getUserProfile.query()",
			depth: 0,
			delay: 0,
			bytes: 12,
			color: "#a78bfa",
			status: "pending",
		},
	],
};

export function RequestPatternComparisonDemo() {
	const [selected, setSelected] = useState<Pattern>("rest-waterfall");
	const [running, setRunning] = useState(false);
	const [requests, setRequests] = useState<Request[]>([]);
	const [completedCount, setCompletedCount] = useState(0);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimeouts = useCallback(() => {
		for (const t of timeoutsRef.current) clearTimeout(t);
		timeoutsRef.current = [];
	}, []);

	const reset = useCallback(() => {
		clearTimeouts();
		setRunning(false);
		setRequests([]);
		setCompletedCount(0);
	}, [clearTimeouts]);

	const schedule = useCallback((fn: () => void, delay: number) => {
		const t = setTimeout(fn, delay);
		timeoutsRef.current.push(t);
	}, []);

	const runAnimation = useCallback(() => {
		reset();
		setRunning(true);

		const config = REQUEST_CONFIGS[selected];
		setRequests(config.map((r) => ({ ...r, status: "pending" as const })));

		config.forEach((req) => {
			// Start request
			schedule(() => {
				setRequests((prev) =>
					prev.map((r) =>
						r.id === req.id ? { ...r, status: "in-flight" as const } : r,
					),
				);
			}, req.delay);

			// Complete request
			schedule(() => {
				setRequests((prev) =>
					prev.map((r) =>
						r.id === req.id ? { ...r, status: "completed" as const } : r,
					),
				);
				setCompletedCount((prev) => prev + 1);
			}, req.delay + 400);
		});

		// End animation
		const lastRequest = config[config.length - 1];
		schedule(() => {
			setRunning(false);
		}, lastRequest.delay + 600);
	}, [selected, reset, schedule]);

	// Reset animation when pattern changes
	useEffect(() => {
		reset();
	}, [reset]);

	useEffect(() => () => clearTimeouts(), [clearTimeouts]);

	const pattern = PATTERNS.find((p) => p.id === selected) ?? PATTERNS[0];

	return (
		<div className="space-y-6">
			{/* Pattern selector */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{PATTERNS.map((p) => {
					const isSelected = selected === p.id;
					const className = match({ isSelected, color: p.color })
						.with(
							{ isSelected: true, color: "rose" },
							() => "bg-rose-500/15 text-accent-rose border-rose-500/40",
						)
						.with(
							{ isSelected: true, color: "amber" },
							() => "bg-amber-500/15 text-accent-amber border-amber-500/40",
						)
						.with(
							{ isSelected: true, color: "cyan" },
							() => "bg-cyan-500/15 text-accent-cyan border-cyan-500/40",
						)
						.with(
							{ isSelected: true, color: "violet" },
							() => "bg-violet-500/15 text-accent-violet border-violet-500/40",
						)
						.otherwise(
							() =>
								"bg-surface-secondary text-text-tertiary border-border-secondary hover:border-border-tertiary",
						);

					return (
						<button
							key={p.id}
							type="button"
							onClick={() => setSelected(p.id)}
							className={`px-4 py-3 rounded-lg text-sm font-semibold border transition-all ${className}`}
						>
							<div className="text-lg mb-1">{p.icon}</div>
							<div>{p.label}</div>
						</button>
					);
				})}
			</div>

			<p className="text-sm text-text-tertiary">{pattern.description}</p>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Animation */}
				<div className="space-y-4">
					{/* Metrics */}
					<div className="grid grid-cols-3 gap-3">
						<div className="bg-surface-primary border border-border-secondary rounded-lg p-3">
							<div className="text-xs text-text-muted mb-1">Requests</div>
							<div className="text-2xl font-bold text-text-primary">
								{pattern.requestCount}
							</div>
						</div>
						<div className="bg-surface-primary border border-border-secondary rounded-lg p-3">
							<div className="text-xs text-text-muted mb-1">Data (KB)</div>
							<div className="text-2xl font-bold text-text-primary">
								{pattern.totalBytes}
							</div>
						</div>
						<div className="bg-surface-primary border border-border-secondary rounded-lg p-3">
							<div
								className="text-xs text-text-muted mb-1"
								title="Number of sequential round trips required"
							>
								Waterfall Depth
							</div>
							<div className="text-2xl font-bold text-text-primary">
								{pattern.waterfallDepth}
							</div>
						</div>
					</div>

					{/* Waterfall visualization */}
					<div className="bg-surface-primary border border-border-secondary rounded-xl p-6 min-h-75">
						<div className="flex items-center justify-between mb-4">
							<div className="text-xs text-text-muted font-mono">
								Network Waterfall
							</div>
							{selected === "rest-waterfall" && requests.length > 0 && (
								<div className="text-xs text-text-tertiary flex items-center gap-1">
									<span>→</span>
									<span>Indentation = Sequential dependency</span>
								</div>
							)}
						</div>

						<div className="space-y-3">
							{requests.map((req) => (
								<div
									key={req.id}
									className="flex items-center gap-3"
									style={{ paddingLeft: `${req.depth * 20}px` }}
								>
									<div className="flex-1 relative h-8 bg-surface-secondary rounded overflow-hidden">
										<div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono text-text-tertiary z-10">
											{req.label}
										</div>

										<AnimatePresence>
											{req.status !== "pending" && (
												<motion.div
													initial={{ width: 0 }}
													animate={{
														width: req.status === "completed" ? "100%" : "60%",
														opacity: req.status === "completed" ? 0.8 : 1,
													}}
													transition={{ duration: 0.4 }}
													className="absolute inset-y-0 left-0"
													style={{ backgroundColor: req.color }}
												/>
											)}
										</AnimatePresence>

										{req.status === "in-flight" && (
											<motion.div
												className="absolute inset-y-0 right-0 w-2 bg-white"
												animate={{ opacity: [1, 0.3, 1] }}
												transition={{
													duration: 0.8,
													repeat: Number.POSITIVE_INFINITY,
												}}
											/>
										)}
									</div>

									<div className="text-xs text-text-muted font-mono w-12">
										{req.bytes}KB
									</div>
								</div>
							))}
						</div>

						{requests.length > 0 && (
							<div className="mt-4 pt-4 border-t border-border-primary text-sm text-text-tertiary">
								{completedCount === requests.length ? (
									<span className="text-accent-green-soft">
										✓ All requests completed
									</span>
								) : running ? (
									<span>
										Loading... ({completedCount}/{requests.length})
									</span>
								) : (
									<span className="text-text-muted">Ready to simulate</span>
								)}
							</div>
						)}
					</div>

					<button
						type="button"
						onClick={running ? reset : runAnimation}
						className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
							running
								? "bg-surface-tertiary text-text-secondary"
								: "bg-violet-600 hover:bg-violet-500 text-text-primary"
						}`}
					>
						{running
							? "⏹ Stop"
							: requests.length > 0
								? "↺ Replay"
								: "▶ Animate"}
					</button>
				</div>

				{/* Code example */}
				<div className="space-y-4">
					<h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
						Implementation
					</h4>

					{selected === "rest-waterfall" && (
						<div className="space-y-3">
							<ShikiCode
								language="typescript"
								code={`// Each request depends on previous response
const user = await fetch('/api/user/123');
const posts = await fetch(\`/api/users/\${user.id}/posts\`);
const likes = await fetch(\`/api/posts/\${posts[0].id}/likes\`);
const authors = await fetch(\`/api/posts/authors?ids=\${posts.map(p => p.authorId)}\`);

// Total time: 4 × RTT (round-trip time)
// Problem: N+1 queries, slow, sequential`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-accent-rose text-xs">
								⚠️ Each request waits for the previous one. Depth-4 waterfall
								kills performance.
							</div>
						</div>
					)}

					{selected === "rest-embed" && (
						<div className="space-y-3">
							<ShikiCode
								language="typescript"
								code={`// Single request with query params
const data = await fetch('/api/user/123?embed=posts,likes,authors');

// Returns ALL fields for embedded resources
// {
//   user: { id, name, email, avatar, bio, createdAt, ... },
//   posts: [{ id, title, content, tags, metadata, ... }],
//   likes: [{ userId, postId, timestamp, ... }],
//   authors: [{ id, name, email, avatar, ... }]
// }

// Total time: 1 × RTT
// Problem: Over-fetching — 75% of data unused`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-accent-amber text-xs">
								⚠️ Fast but wastes bandwidth. Returns 45KB when you only need
								12KB.
							</div>
						</div>
					)}

					{selected === "graphql" && (
						<div className="space-y-3">
							<ShikiCode
								language="graphql"
								code={`# Request exactly the fields you need
query GetUserProfile($id: ID!) {
  user(id: $id) {
    name
    avatar
    posts {
      id
      title
      likeCount
      author {
        name
      }
    }
  }
}

# Total time: 1 × RTT
# Returns: 12KB (exactly what you need)`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-accent-cyan text-xs">
								✓ Solves both over-fetching and under-fetching. Single request,
								exact data.
							</div>
						</div>
					)}

					{selected === "trpc" && (
						<div className="space-y-3">
							<ShikiCode
								language="typescript"
								code={`// Type-safe RPC call (no codegen needed)
const data = await trpc.getUserProfile.query({ userId: '123' });
//    ^? { name: string, avatar: string, posts: Post[] }

// Server-side procedure:
export const appRouter = router({
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.user.findUnique({
        where: { id: input.userId },
        select: { name: true, avatar: true, posts: true }
      });
    }),
});

// Total time: 1 × RTT, 12KB, full type safety`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-accent-violet text-xs">
								✓ Perfect for TS monorepos. No GraphQL schema, no codegen. Just
								functions.
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
