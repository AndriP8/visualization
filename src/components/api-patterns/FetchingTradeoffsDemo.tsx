import { motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Scenario = "initial" | "add-avatar";

interface Field {
	name: string;
	used: boolean;
	bytes: number;
}

const REST_INITIAL_FIELDS: Field[] = [
	{ name: "id", used: true, bytes: 1 },
	{ name: "title", used: true, bytes: 2 },
	{ name: "content", used: true, bytes: 5 },
	{ name: "author.id", used: true, bytes: 1 },
	{ name: "author.name", used: true, bytes: 1 },
	{ name: "author.email", used: false, bytes: 1 },
	{ name: "author.bio", used: false, bytes: 3 },
	{ name: "author.avatar", used: false, bytes: 2 },
	{ name: "author.location", used: false, bytes: 1 },
	{ name: "tags[]", used: false, bytes: 2 },
	{ name: "metadata", used: false, bytes: 3 },
	{ name: "createdAt", used: true, bytes: 1 },
	{ name: "updatedAt", used: false, bytes: 1 },
	{ name: "viewCount", used: false, bytes: 1 },
	{ name: "shareUrl", used: false, bytes: 1 },
];

const GRAPHQL_INITIAL_FIELDS: Field[] = [
	{ name: "id", used: true, bytes: 1 },
	{ name: "title", used: true, bytes: 2 },
	{ name: "content", used: true, bytes: 5 },
	{ name: "author.id", used: true, bytes: 1 },
	{ name: "author.name", used: true, bytes: 1 },
	{ name: "createdAt", used: true, bytes: 1 },
];

const REST_WITH_AVATAR_FIELDS: Field[] = REST_INITIAL_FIELDS.map((f) =>
	f.name === "author.avatar" ? { ...f, used: true } : f,
);

const GRAPHQL_WITH_AVATAR_FIELDS: Field[] = [
	...GRAPHQL_INITIAL_FIELDS,
	{ name: "author.avatar", used: true, bytes: 2 },
];

export function FetchingTradeoffsDemo() {
	const [scenario, setScenario] = useState<Scenario>("initial");
	const [selectedApproach, setSelectedApproach] = useState<"rest" | "graphql">(
		"rest",
	);

	const restFields =
		scenario === "initial" ? REST_INITIAL_FIELDS : REST_WITH_AVATAR_FIELDS;
	const graphqlFields =
		scenario === "initial"
			? GRAPHQL_INITIAL_FIELDS
			: GRAPHQL_WITH_AVATAR_FIELDS;

	const fields = selectedApproach === "rest" ? restFields : graphqlFields;
	const usedBytes = fields
		.filter((f) => f.used)
		.reduce((sum, f) => sum + f.bytes, 0);
	const totalBytes = fields.reduce((sum, f) => sum + f.bytes, 0);
	const wastedBytes = totalBytes - usedBytes;
	const efficiency = Math.round((usedBytes / totalBytes) * 100);

	const needsExtraRequest =
		selectedApproach === "graphql" && scenario === "add-avatar";

	return (
		<div className="space-y-6">
			{/* Scenario selector */}
			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => setScenario("initial")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
						scenario === "initial"
							? "bg-violet-500/15 text-violet-300 border-violet-500/40"
							: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
					}`}
				>
					📝 Initial Feature
				</button>
				<button
					type="button"
					onClick={() => setScenario("add-avatar")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
						scenario === "add-avatar"
							? "bg-violet-500/15 text-violet-300 border-violet-500/40"
							: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
					}`}
				>
					➕ Add Avatar Feature
				</button>
			</div>

			<div className="text-sm text-zinc-400">
				{scenario === "initial" ? (
					<>
						Social media feed showing post title, content, author name, and
						timestamp.
					</>
				) : (
					<>
						New requirement: show author avatar. REST already has it
						(over-fetched earlier). GraphQL needs query update.
					</>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* REST */}
				<div className="space-y-4">
					<button
						type="button"
						onClick={() => setSelectedApproach("rest")}
						className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
							selectedApproach === "rest"
								? "bg-amber-500/15 text-amber-300 border-amber-500/40"
								: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
						}`}
					>
						<div className="flex items-center gap-2 mb-2">
							<span className="text-xl">📦</span>
							<span className="font-semibold">REST</span>
						</div>
						<div className="text-xs text-zinc-500">
							Fixed response structure
						</div>
					</button>

					{selectedApproach === "rest" && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-4"
						>
							{/* Metrics */}
							<div className="grid grid-cols-3 gap-2">
								<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
									<div className="text-xs text-zinc-500 mb-1">Used</div>
									<div className="text-xl font-bold text-green-400">
										{usedBytes}KB
									</div>
								</div>
								<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
									<div className="text-xs text-zinc-500 mb-1">Wasted</div>
									<div className="text-xl font-bold text-rose-400">
										{wastedBytes}KB
									</div>
								</div>
								<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
									<div className="text-xs text-zinc-500 mb-1">Efficiency</div>
									<div className="text-xl font-bold text-white">
										{efficiency}%
									</div>
								</div>
							</div>

							{/* Fields visualization */}
							<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
								<div className="text-xs text-zinc-500 mb-3 font-mono">
									GET /api/posts/123 ({totalBytes}KB)
								</div>
								<div className="space-y-1">
									{restFields.map((field, i) => (
										<motion.div
											key={field.name}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: i * 0.03 }}
											className={`flex items-center justify-between px-3 py-2 rounded text-xs font-mono ${
												field.used
													? "bg-green-500/10 text-green-300 border border-green-500/20"
													: "bg-rose-500/10 text-rose-300 border border-rose-500/20"
											}`}
										>
											<span>{field.name}</span>
											<div className="flex items-center gap-2">
												<span className="text-zinc-500">{field.bytes}KB</span>
												{field.used ? (
													<span className="text-green-400">✓</span>
												) : (
													<span className="text-rose-400">✗</span>
												)}
											</div>
										</motion.div>
									))}
								</div>
							</div>

							{/* Summary */}
							<div
								className={`p-3 rounded-lg border text-xs ${
									scenario === "add-avatar"
										? "bg-green-500/10 border-green-500/20 text-green-300"
										: "bg-amber-500/10 border-amber-500/20 text-amber-300"
								}`}
							>
								{scenario === "initial" ? (
									<>
										⚠️ Over-fetching {wastedBytes}KB of unused data. But
										future-proof!
									</>
								) : (
									<>
										✓ Avatar already available - no code change needed.
										Over-fetching paid off!
									</>
								)}
							</div>

							{/* Code */}
							<ShikiCode
								language="typescript"
								code={`// REST returns all fields
const post = await fetch('/api/posts/123');
// {
//   id, title, content, author: { ... },
//   tags, metadata, viewCount, ... ← unused
// }`}
								showLineNumbers={false}
								className="text-xs"
							/>
						</motion.div>
					)}
				</div>

				{/* GraphQL */}
				<div className="space-y-4">
					<button
						type="button"
						onClick={() => setSelectedApproach("graphql")}
						className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
							selectedApproach === "graphql"
								? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
								: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
						}`}
					>
						<div className="flex items-center gap-2 mb-2">
							<span className="text-xl">◈</span>
							<span className="font-semibold">GraphQL</span>
						</div>
						<div className="text-xs text-zinc-500">Request exact fields</div>
					</button>

					{selectedApproach === "graphql" && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-4"
						>
							{/* Metrics */}
							<div className="grid grid-cols-3 gap-2">
								<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
									<div className="text-xs text-zinc-500 mb-1">Used</div>
									<div className="text-xl font-bold text-green-400">
										{usedBytes}KB
									</div>
								</div>
								<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
									<div className="text-xs text-zinc-500 mb-1">Wasted</div>
									<div className="text-xl font-bold text-zinc-500">
										{wastedBytes}KB
									</div>
								</div>
								<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
									<div className="text-xs text-zinc-500 mb-1">Efficiency</div>
									<div className="text-xl font-bold text-green-400">
										{efficiency}%
									</div>
								</div>
							</div>

							{/* Fields visualization */}
							<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
								<div className="text-xs text-zinc-500 mb-3 font-mono">
									POST /graphql ({totalBytes}KB)
								</div>
								<div className="space-y-1">
									{graphqlFields.map((field, i) => (
										<motion.div
											key={field.name}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: i * 0.03 }}
											className="flex items-center justify-between px-3 py-2 rounded text-xs font-mono bg-green-500/10 text-green-300 border border-green-500/20"
										>
											<span>{field.name}</span>
											<div className="flex items-center gap-2">
												<span className="text-zinc-500">{field.bytes}KB</span>
												<span className="text-green-400">✓</span>
											</div>
										</motion.div>
									))}
								</div>
							</div>

							{/* Summary */}
							<div
								className={`p-3 rounded-lg border text-xs ${
									needsExtraRequest
										? "bg-amber-500/10 border-amber-500/20 text-amber-300"
										: "bg-green-500/10 border-green-500/20 text-green-300"
								}`}
							>
								{scenario === "initial" ? (
									<>
										✓ Perfect efficiency - zero over-fetching. Optimal bandwidth
										use!
									</>
								) : (
									<>
										⚠️ Need to update query to add avatar field. Code change
										required.
									</>
								)}
							</div>

							{/* Code */}
							<ShikiCode
								language="graphql"
								code={
									scenario === "initial"
										? `query GetPost($id: ID!) {
  post(id: $id) {
    id
    title
    content
    author { id, name }
    createdAt
  }
}

# Returns exactly what you asked for`
										: `query GetPost($id: ID!) {
  post(id: $id) {
    id
    title
    content
    author {
      id
      name
      avatar  # ← Must add this field
    }
    createdAt
  }
}`
								}
								showLineNumbers={false}
								className="text-xs"
							/>
						</motion.div>
					)}
				</div>
			</div>

			{/* Key insights */}
			<div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-5">
				<h4 className="text-sm font-semibold text-white mb-3">Key Insights</h4>
				<div className="space-y-2 text-sm text-zinc-400">
					<div className="flex gap-2">
						<span className="text-amber-300">•</span>
						<span>
							<strong className="text-white">REST over-fetches</strong> - wastes
							bandwidth but future-proof (new UI needs might already be
							satisfied)
						</span>
					</div>
					<div className="flex gap-2">
						<span className="text-cyan-300">•</span>
						<span>
							<strong className="text-white">GraphQL optimal</strong> - zero
							waste but requires query updates for new fields
						</span>
					</div>
					<div className="flex gap-2">
						<span className="text-violet-300">•</span>
						<span>
							<strong className="text-white">Trade-off</strong> - REST:
							bandwidth vs flexibility. GraphQL: efficiency vs maintenance.
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
