import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type QueryNode = {
	label: string;
	value: string;
	unresolved?: boolean;
};

type RewriteNote = {
	id: string;
	kind: "alias" | "cast" | "view" | "ok";
	message: string;
};

type QueryExample = {
	label: string;
	raw: string;
	inputTree: QueryNode[];
	resolvedTree: QueryNode[];
	notes: RewriteNote[];
	status: "valid" | "rewritten";
};

const QUERIES: QueryExample[] = [
	{
		label: "Alias + Type Cast",
		raw: "SELECT u.name FROM users u WHERE u.age > '18'",
		inputTree: [
			{ label: "SELECT", value: "u.name", unresolved: true },
			{ label: "FROM", value: "users u", unresolved: true },
			{ label: "WHERE", value: "u.age > '18'", unresolved: true },
		],
		resolvedTree: [
			{ label: "SELECT", value: "users.name" },
			{ label: "FROM", value: "users" },
			{ label: "WHERE", value: "users.age > 18  -- implicit cast" },
		],
		notes: [
			{
				id: "alias-u",
				kind: "alias",
				message: 'Alias "u" resolved → table "users"',
			},
			{
				id: "alias-col",
				kind: "alias",
				message: '"u.name" → "users.name", "u.age" → "users.age"',
			},
			{
				id: "cast",
				kind: "cast",
				message: "Implicit cast: string '18' → integer 18 (age is INT4)",
			},
		],
		status: "rewritten",
	},
	{
		label: "View Expansion",
		raw: "SELECT * FROM user_summary",
		inputTree: [
			{ label: "SELECT", value: "*" },
			{ label: "FROM", value: "user_summary", unresolved: true },
		],
		resolvedTree: [
			{ label: "SELECT", value: "users.id, users.name, COUNT(orders.id)" },
			{
				label: "FROM",
				value: "users LEFT JOIN orders ON users.id = orders.user_id",
			},
			{ label: "GROUP BY", value: "users.id, users.name" },
		],
		notes: [
			{
				id: "view",
				kind: "view",
				message: '"user_summary" is a VIEW — expanded into base SELECT',
			},
			{
				id: "star",
				kind: "alias",
				message: '"*" expanded to explicit column list from view definition',
			},
		],
		status: "rewritten",
	},
	{
		label: "Clean Pass",
		raw: "SELECT id FROM orders WHERE status = 'shipped'",
		inputTree: [
			{ label: "SELECT", value: "id" },
			{ label: "FROM", value: "orders" },
			{ label: "WHERE", value: "status = 'shipped'" },
		],
		resolvedTree: [
			{ label: "SELECT", value: "orders.id" },
			{ label: "FROM", value: "orders" },
			{ label: "WHERE", value: "orders.status = 'shipped'" },
		],
		notes: [
			{
				id: "col-id",
				kind: "ok",
				message: '"id" resolved → "orders.id" (INT4) — type OK',
			},
			{
				id: "col-status",
				kind: "ok",
				message: '"status" resolved → "orders.status" (VARCHAR) — type OK',
			},
		],
		status: "valid",
	},
];

const NOTE_COLORS: Record<RewriteNote["kind"], string> = {
	alias: "text-amber-300 bg-amber-500/10 border-amber-500/30",
	cast: "text-orange-300 bg-orange-500/10 border-orange-500/30",
	view: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30",
	ok: "text-green-300 bg-green-500/10 border-green-500/30",
};

const NOTE_ICONS: Record<RewriteNote["kind"], string> = {
	alias: "~",
	cast: "C",
	view: "V",
	ok: "OK",
};

function QueryTree({
	nodes,
	resolved,
}: {
	nodes: QueryNode[];
	resolved: boolean;
}) {
	return (
		<div className="space-y-2">
			{nodes.map((node, idx) => (
				<motion.div
					key={`${node.label}-${node.value}`}
					initial={{ scale: 0.85, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: idx * 0.07, duration: 0.25 }}
					className={`rounded-lg border px-3 py-2 ${
						resolved
							? "bg-cyan-500/10 border-cyan-500/30"
							: node.unresolved
								? "bg-amber-500/10 border-amber-500/30"
								: "bg-zinc-800 border-zinc-700"
					}`}
				>
					<span
						className={`text-xs font-bold tracking-wider mr-2 ${
							resolved ? "text-cyan-400" : "text-violet-400"
						}`}
					>
						{node.label}
					</span>
					<span
						className={`font-mono text-xs ${
							resolved
								? "text-cyan-200"
								: node.unresolved
									? "text-amber-200"
									: "text-zinc-300"
						}`}
					>
						{node.value}
					</span>
				</motion.div>
			))}
		</div>
	);
}

export function AnalyzerRewriterDemo() {
	const [activeIdx, setActiveIdx] = useState(0);
	const active = QUERIES[activeIdx];

	return (
		<div className="space-y-6">
			{/* Tab selector */}
			<div className="flex gap-2 flex-wrap">
				{QUERIES.map((q, idx) => (
					<button
						key={q.label}
						type="button"
						onClick={() => setActiveIdx(idx)}
						className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
							activeIdx === idx
								? "bg-violet-500/20 border-violet-500/50 text-violet-300"
								: "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						{q.label}
					</button>
				))}
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key={activeIdx}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 }}
					transition={{ duration: 0.2 }}
					className="space-y-4"
				>
					{/* SQL display */}
					<div className="font-mono text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300">
						<span className="text-zinc-600 select-none mr-2">SQL</span>
						{active.raw}
					</div>

					{/* Two-panel query trees */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-medium text-zinc-400">
									Query Tree (from Parser)
								</h4>
								<span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
									Unresolved
								</span>
							</div>
							<QueryTree nodes={active.inputTree} resolved={false} />
						</div>

						<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-medium text-zinc-400">
									Resolved Query Tree
								</h4>
								{active.status === "valid" ? (
									<span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400">
										Semantically Valid
									</span>
								) : (
									<span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
										Rewrite Applied
									</span>
								)}
							</div>
							<QueryTree nodes={active.resolvedTree} resolved={true} />
						</div>
					</div>

					{/* Rewrite notes */}
					<div className="space-y-2">
						<h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
							Analyzer Notes
						</h4>
						<AnimatePresence>
							{active.notes.map((note, idx) => (
								<motion.div
									key={note.id}
									initial={{ opacity: 0, x: -12 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 12 }}
									transition={{ delay: idx * 0.08, duration: 0.2 }}
									className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${NOTE_COLORS[note.kind]}`}
								>
									<span className="font-bold font-mono shrink-0 w-6 text-center">
										{NOTE_ICONS[note.kind]}
									</span>
									<span>{note.message}</span>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
