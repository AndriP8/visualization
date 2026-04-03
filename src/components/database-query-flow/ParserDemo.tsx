import { motion } from "motion/react";
import { useMemo, useState } from "react";

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
	const hasSelect =
		ast.children?.some((c: ASTNode) => c.type === "SELECT") ?? false;
	const hasFrom =
		ast.children?.some((c: ASTNode) => c.type === "FROM") ?? false;
	const hasWhere =
		ast.children?.some((c: ASTNode) => c.type === "WHERE") ?? false;

	// Check for missing FROM clause when WHERE is present or when SELECT has targets
	if (!errorToken && hasSelect && !hasFrom) {
		// Find the first non-keyword token after SELECT that could be a table name
		const selectClause = ast.children?.find(
			(c: ASTNode) => c.type === "SELECT",
		);

		// If there's a WHERE clause or SELECT has tokens, FROM is required
		if (hasWhere || (selectClause?.tokens && selectClause.tokens.length > 0)) {
			errorMessage =
				"Syntax Error: Missing FROM clause. Expected FROM between column list and WHERE/table name.";
			// Find potential table name token (token that looks like it should follow FROM)
			errorToken =
				selectClause?.tokens?.[selectClause.tokens.length - 1] || null;
		}
	}

	if (
		errorToken ||
		!hasSelect ||
		(!hasFrom && sql.trim().toUpperCase() !== "SELECT")
	) {
		return {
			error: errorMessage,
			errorToken: errorToken || tokens[0],
			ast: null,
		};
	}

	return { error: null, errorToken: null, ast };
}

function ASTNodeVisualizer({
	node,
	level = 0,
}: {
	node: ASTNode | null;
	level?: number;
}) {
	if (!node) return null;

	return (
		<div className="flex flex-col items-center">
			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className={`
					px-4 py-2 border rounded-lg shadow-sm whitespace-nowrap mb-4
					${
						node.type === "Query"
							? "bg-violet-500/20 border-violet-500 text-violet-200"
							: "bg-surface-secondary border-border-tertiary text-text-secondary"
					}
				`}
			>
				<span className="font-bold text-sm tracking-wide">{node.type}</span>
				{node.tokens && node.tokens.length > 0 && (
					<div className="text-xs font-mono text-accent-cyan-soft mt-1">
						{node.tokens.join(" ")}
					</div>
				)}
			</motion.div>

			{node.children && node.children.length > 0 && (
				<div className="flex gap-8 relative mt-2 pt-4">
					<div className="absolute top-0 left-[50%] right-[50%] h-4 border-l border-border-tertiary -translate-y-4" />
					<div className="absolute top-0 left-[10%] right-[10%] border-t border-border-tertiary" />

					{node.children.map((child: ASTNode, idx: number) => (
						<div
							key={`${child.type}-${idx}`}
							className="relative flex flex-col items-center"
						>
							<div className="absolute top-0 w-px h-4 bg-surface-tertiary -translate-y-4" />
							<ASTNodeVisualizer node={child} level={level + 1} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function ParserDemo() {
	const [query, setQuery] = useState(TEMPLATES[0].query);

	const { error, errorToken, ast } = useMemo(() => parseSQL(query), [query]);

	return (
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
									? "bg-violet-500/20 border-violet-500/50 text-accent-violet"
									: "bg-surface-secondary/50 border-border-secondary text-text-tertiary hover:text-text-secondary"
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
						<span className="text-text-tertiary font-medium">SQL Input</span>
						{error ? (
							<span className="text-accent-red-soft text-xs px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
								Syntax Error
							</span>
						) : (
							<span className="text-accent-green-soft text-xs px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
								Valid Syntax
							</span>
						)}
					</div>

					{/* Fake Syntax Highlighting Input */}
					<div className="relative font-mono text-sm leading-relaxed overflow-hidden rounded-xl border border-border-primary bg-surface-base">
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
								if (errorToken && token.replace(/[,;.]$/, "") === errorToken) {
									return (
										<span
											key={`err-${i}-${token}`}
											className="text-accent-red-soft bg-red-500/20 border-b border-red-500 rounded-sm"
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
												? "text-accent-violet-soft font-bold"
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
							className="text-xs text-accent-red-soft mt-2 p-3 bg-red-500/5 rounded-lg border border-red-500/10"
						>
							{error}
							<br />
							<span className="text-text-muted mt-1 block">
								Database engines immediately reject invalid queries at the
								Parser stage before any execution planning begins.
							</span>
						</motion.div>
					)}
				</div>

				<div className="bg-surface-primary border border-border-primary p-6 rounded-xl flex flex-col min-h-75 overflow-x-auto">
					<h4 className="text-sm font-medium text-text-tertiary mb-6 text-center">
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
								className="text-text-faint text-sm flex flex-col items-center gap-2"
							>
								<span className="text-3xl">🛑</span>
								<span>Parse Tree cannot be generated</span>
							</motion.div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
