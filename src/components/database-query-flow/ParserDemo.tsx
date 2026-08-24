import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type ASTNode = {
	type: string;
	tokens?: string[];
	children?: ASTNode[];
};

const TEMPLATES = [
	{
		label: "Simple Select",
		query: "SELECT id, name FROM users;",
	},
	{
		label: "Filter Query",
		query: "SELECT name FROM users WHERE age > 18;",
	},
	{
		label: "Join Query",
		query:
			"SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;",
	},
	{
		label: "Syntax Error (Missing FROM)",
		query: "SELECT id, name users WHERE age > 18;",
	},
];

// Extremely simplified pseudo-parser specialized for the templates above to ensure bug-free visualization
function parseSQL(sql: string) {
	const clean = sql.trim().replace(/;$/, "");
	const tokens = clean.split(/\s+/).filter(Boolean);

	const ast: ASTNode = { type: "Query", children: [] };
	let currentClause: ASTNode | null = null;
	let errorToken: string | null = null;
	let errorMessage =
		"Syntax Error: Unexpected token or missing required clauses.";

	const keywords = ["SELECT", "FROM", "WHERE", "JOIN", "ON"];

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i].toUpperCase();

		if (keywords.includes(token)) {
			currentClause = { type: token, tokens: [], children: [] };
			ast.children?.push(currentClause);
		} else if (currentClause) {
			currentClause.tokens?.push(tokens[i].replace(/,$/, ""));
		} else {
			// Tokens before SELECT are invalid
			errorToken = tokens[i];
			errorMessage = "Syntax Error: Unexpected token before SELECT.";
			break;
		}
	}

	// Final validation check: Needs at least SELECT and FROM
	const hasSelect = ast.children?.some((c) => c.type === "SELECT");
	const hasFrom = ast.children?.some((c) => c.type === "FROM");

	if (!hasSelect || !hasFrom) {
		return {
			error: errorMessage,
			errorToken: errorToken || tokens[tokens.length - 1] || "Query",
			ast: null,
		};
	}

	return { error: null, errorToken: null, ast };
}

function ASTNodeVisualizer({ node }: { node: ASTNode }) {
	return (
		<div className="flex flex-col items-center">
			<div className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300 shadow-md">
				<span className="text-emerald-400 font-bold">{node.type}</span>
				{node.tokens && node.tokens.length > 0 && (
					<span className="text-zinc-400 ml-2">[{node.tokens.join(", ")}]</span>
				)}
			</div>

			{node.children && node.children.length > 0 && (
				<div className="flex flex-col items-center mt-2">
					<div className="w-px h-4 bg-zinc-700" />
					<div className="flex gap-4 border-t border-zinc-700 pt-2">
						{node.children.map((child, idx) => (
							<ASTNodeVisualizer key={`${child.type}-${idx}`} node={child} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export function ParserDemo() {
	const [query, setQuery] = useState(TEMPLATES[0].query);

	const { error, errorToken, ast } = useMemo(() => parseSQL(query), [query]);

	return (
		<DemoSection
			title="Demo 2: The Parser (SQL to AST)"
			description="The engine first checks syntax and translates your text query into a structured 'Parse Tree' (Abstract Syntax Tree) that it can understand."
		>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex gap-2">
						{TEMPLATES.map((t) => (
							<button
								key={t.label}
								type="button"
								onClick={() => setQuery(t.query)}
								className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
									query === t.query
										? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
										: "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-zinc-200"
								}`}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
					<div className="space-y-3">
						<div className="flex justify-between items-center text-sm">
							<span className="text-zinc-400 font-medium">SQL Input</span>
							{error ? (
								<span className="text-red-400 text-xs px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
									Syntax Error
								</span>
							) : (
								<span className="text-green-400 text-xs px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
									Valid Syntax
								</span>
							)}
						</div>

						{/* Fake Syntax Highlighting Input */}
						<div className="relative font-mono text-sm leading-relaxed overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
							<textarea
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none outline-none z-10"
								spellCheck={false}
							/>
							<div className="w-full h-full p-4 pointer-events-none whitespace-pre-wrap wrap-break-word">
								{query.split(/(\s+)/).map((token, i) => {
									if (!token.trim())
										return (
											<span key={`space-${i}-${token.length}`}>{token}</span>
										);

									// Error highlighting
									if (
										errorToken &&
										token.replace(/[,;.]$/, "") === errorToken
									) {
										return (
											<span
												key={`err-${i}-${token}`}
												className="text-red-400 bg-red-500/20 border-b border-red-500 rounded-sm"
											>
												{token}
											</span>
										);
									}

									const isKeyword = [
										"SELECT",
										"FROM",
										"WHERE",
										"JOIN",
										"ON",
										"AND",
										"OR",
										"ORDER",
										"BY",
										"GROUP",
									].includes(token.toUpperCase());

									return (
										<span
											key={`tok-${i}-${token}`}
											className={
												isKeyword
													? "text-emerald-400 font-bold"
													: "text-cyan-200"
											}
										>
											{token}
										</span>
									);
								})}
							</div>
						</div>

						{error && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="text-xs text-red-400 mt-2 p-3 bg-red-500/5 rounded-lg border border-red-500/10"
							>
								{error}
								<br />
								<span className="text-zinc-500 mt-1 block">
									Database engines immediately reject invalid queries at the
									Parser stage before any execution planning begins.
								</span>
							</motion.div>
						)}
					</div>

					<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col min-h-75 overflow-x-auto">
						<h4 className="text-sm font-medium text-zinc-400 mb-6 text-center">
							Abstract Syntax Tree (AST)
						</h4>

						<div className="flex-1 flex items-center justify-center">
							{ast ? (
								<motion.div
									key={query}
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									className="origin-top"
								>
									<ASTNodeVisualizer node={ast} />
								</motion.div>
							) : (
								<motion.div
									key="error"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="text-zinc-600 text-sm flex flex-col items-center gap-2"
								>
									<span className="text-3xl">🛑</span>
									<span>Parse Tree cannot be generated</span>
								</motion.div>
							)}
						</div>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
