import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const FLOW_COLORS: Record<
	string,
	{
		bg: string;
		border: string;
		borderDark: string;
		text: string;
		numberBg: string;
		numberBorder: string;
		numberText: string;
		divider: string;
	}
> = {
	violet: {
		bg: "rgba(167, 139, 250, 0.05)",
		border: "rgba(167, 139, 250, 0.2)",
		borderDark: "rgba(167, 139, 250, 0.2)",
		text: "#c4b5fd",
		numberBg: "rgba(167, 139, 250, 0.2)",
		numberBorder: "rgba(167, 139, 250, 0.4)",
		numberText: "#c4b5fd",
		divider: "rgba(167, 139, 250, 0.2)",
	},
	cyan: {
		bg: "rgba(34, 211, 238, 0.05)",
		border: "rgba(34, 211, 238, 0.2)",
		borderDark: "rgba(34, 211, 238, 0.2)",
		text: "#67e8f9",
		numberBg: "rgba(34, 211, 238, 0.2)",
		numberBorder: "rgba(34, 211, 238, 0.4)",
		numberText: "#67e8f9",
		divider: "rgba(34, 211, 238, 0.2)",
	},
	amber: {
		bg: "rgba(251, 191, 36, 0.05)",
		border: "rgba(251, 191, 36, 0.2)",
		borderDark: "rgba(251, 191, 36, 0.2)",
		text: "#fcd34d",
		numberBg: "rgba(251, 191, 36, 0.2)",
		numberBorder: "rgba(251, 191, 36, 0.4)",
		numberText: "#fcd34d",
		divider: "rgba(251, 191, 36, 0.2)",
	},
};

type Answer = "yes" | "no" | null;

interface Question {
	id: string;
	text: string;
	yesNext: string | "result";
	noNext: string | "result";
	yesResult?: string;
	noResult?: string;
}

interface AuthResult {
	technology: string;
	icon: string;
	color: string;
	description: string;
	useCases: string[];
}

const QUESTIONS: Record<string, Question> = {
	start: {
		id: "start",
		text: "Need third-party identity (Google, GitHub, SSO)?",
		yesNext: "result",
		noNext: "mobile",
		yesResult: "oauth",
		noResult: undefined,
	},
	mobile: {
		id: "mobile",
		text: "Building a mobile app or microservices architecture?",
		yesNext: "result",
		noNext: "revocation",
		yesResult: "jwt",
		noResult: undefined,
	},
	revocation: {
		id: "revocation",
		text: "Need immediate server-side token revocation?",
		yesNext: "result",
		noNext: "result",
		yesResult: "session",
		noResult: "jwt",
	},
};

const RESULTS: Record<string, AuthResult> = {
	oauth: {
		technology: "OAuth 2.0",
		icon: "🔑",
		color: "amber",
		description: "Delegated authentication via trusted identity providers",
		useCases: [
			"Third-party login (Google, GitHub)",
			"API access delegation",
			"Enterprise SSO",
			"Fine-grained permissions",
			"Multi-tenant applications",
		],
	},
	jwt: {
		technology: "JWT",
		icon: "🪙",
		color: "cyan",
		description: "Stateless, self-contained tokens verified by signature",
		useCases: [
			"Microservices architecture",
			"Mobile / native apps",
			"Horizontal scaling",
			"Cross-domain requests",
			"Public APIs",
		],
	},
	session: {
		technology: "Session-Based",
		icon: "🗄️",
		color: "violet",
		description: "Server-stored sessions with full revocation control",
		useCases: [
			"Traditional web apps",
			"Server-side rendering",
			"Immediate revocation needed",
			"Simple deployments",
			"High-security admin panels",
		],
	},
};

export function ComparisonTableDemo() {
	const [showFlows, setShowFlows] = useState(false);
	const [currentQuestion, setCurrentQuestion] = useState("start");
	const [answers, setAnswers] = useState<Record<string, Answer>>({});
	const [finalResult, setFinalResult] = useState<string | null>(null);

	const handleAnswer = (answer: Answer) => {
		if (!answer) return;
		const question = QUESTIONS[currentQuestion];
		setAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));
		const nextKey = answer === "yes" ? question.yesNext : question.noNext;
		if (nextKey === "result") {
			const resultKey =
				answer === "yes" ? question.yesResult : question.noResult;
			if (resultKey) setFinalResult(resultKey);
		} else {
			setCurrentQuestion(nextKey);
		}
	};

	const reset = () => {
		setCurrentQuestion("start");
		setAnswers({});
		setFinalResult(null);
	};

	const question = QUESTIONS[currentQuestion];
	const result = finalResult ? RESULTS[finalResult] : null;

	return (
		<div className="space-y-8">
			{/* Comparison Table */}
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-b border-border-secondary">
							<th className="text-left p-4 text-sm font-semibold text-text-tertiary">
								Feature
							</th>
							<th className="text-left p-4 text-sm font-semibold text-accent-violet">
								Session-Based
							</th>
							<th className="text-left p-4 text-sm font-semibold text-accent-cyan">
								JWT
							</th>
							<th className="text-left p-4 text-sm font-semibold text-accent-amber">
								OAuth 2.0
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border-primary">
						<tr>
							<td className="p-4 text-sm text-text-muted">Storage</td>
							<td className="p-4 text-sm text-text-secondary">
								Server (DB/Redis)
							</td>
							<td className="p-4 text-sm text-text-secondary">
								Client (depends on impl)
							</td>
							<td className="p-4 text-sm text-text-secondary">
								Delegated (provider)
							</td>
						</tr>
						<tr className="bg-surface-primary/50">
							<td className="p-4 text-sm text-text-muted">Stateful?</td>
							<td className="p-4 text-sm text-text-secondary">Yes</td>
							<td className="p-4 text-sm text-text-secondary">No</td>
							<td className="p-4 text-sm text-text-secondary">Hybrid</td>
						</tr>
						<tr>
							<td className="p-4 text-sm text-text-muted">Logout</td>
							<td className="p-4 text-sm text-text-secondary">
								Server deletes session
							</td>
							<td className="p-4 text-sm text-text-secondary">
								Client deletes (can't force)
							</td>
							<td className="p-4 text-sm text-text-secondary">
								Revoke at provider
							</td>
						</tr>
						<tr className="bg-surface-primary/50">
							<td className="p-4 text-sm text-text-muted">XSS Safe?</td>
							<td className="p-4 text-sm text-accent-emerald">
								✓ Yes (httpOnly cookie)
							</td>
							<td className="p-4 text-sm text-accent-amber">
								Depends on storage
							</td>
							<td className="p-4 text-sm text-accent-amber">Depends on impl</td>
						</tr>
						<tr>
							<td className="p-4 text-sm text-text-muted">CSRF Safe?</td>
							<td className="p-4 text-sm text-accent-rose">
								No (needs tokens)
							</td>
							<td className="p-4 text-sm text-accent-emerald">
								✓ Yes (manual header)
							</td>
							<td className="p-4 text-sm text-accent-emerald">
								✓ Yes (state param)
							</td>
						</tr>
						<tr className="bg-surface-primary/50">
							<td className="p-4 text-sm text-text-muted">Scalability</td>
							<td className="p-4 text-sm text-text-secondary">
								Harder (session store)
							</td>
							<td className="p-4 text-sm text-text-secondary">
								Easier (stateless)
							</td>
							<td className="p-4 text-sm text-text-secondary">Offloaded</td>
						</tr>
						<tr>
							<td className="p-4 text-sm text-text-muted">Mobile Apps</td>
							<td className="p-4 text-sm text-text-secondary">Poor fit</td>
							<td className="p-4 text-sm text-text-secondary">Good</td>
							<td className="p-4 text-sm text-text-secondary">Excellent</td>
						</tr>
						<tr className="bg-surface-primary/50">
							<td className="p-4 text-sm text-text-muted">Token Rotation</td>
							<td className="p-4 text-sm text-text-secondary">N/A</td>
							<td className="p-4 text-sm text-text-secondary">
								Manual (refresh tokens)
							</td>
							<td className="p-4 text-sm text-text-secondary">Built-in</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Interactive Decision Guide */}
			<div className="bg-surface-primary border border-border-secondary rounded-xl p-6 min-h-95 flex flex-col items-center justify-center">
				<AnimatePresence mode="wait">
					{!finalResult ? (
						<motion.div
							key={currentQuestion}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="w-full max-w-2xl"
						>
							{/* Progress breadcrumbs */}
							<div className="flex items-center justify-center gap-2 mb-8">
								{Object.keys(QUESTIONS).map((qId, idx) => {
									const isAnswered = answers[qId] !== undefined;
									const isCurrent = qId === currentQuestion;
									return (
										<div key={qId} className="flex items-center gap-2">
											<div
												className={`w-2 h-2 rounded-full transition-colors ${
													isAnswered
														? "bg-green-400"
														: isCurrent
															? "bg-violet-400 animate-pulse"
															: "bg-surface-tertiary"
												}`}
											/>
											{idx < Object.keys(QUESTIONS).length - 1 && (
												<div className="w-8 h-0.5 bg-surface-tertiary" />
											)}
										</div>
									);
								})}
							</div>

							{/* Question */}
							<div className="text-center mb-8">
								<p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
									Decision Guide
								</p>
								<h3 className="text-2xl font-semibold text-text-primary">
									{question.text}
								</h3>
							</div>

							{/* Answer buttons */}
							<div className="grid grid-cols-2 gap-4">
								<button
									type="button"
									onClick={() => handleAnswer("yes")}
									className="px-8 py-6 bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/40 hover:border-green-500/60 rounded-xl text-accent-green font-semibold text-lg transition-all"
								>
									✓ Yes
								</button>
								<button
									type="button"
									onClick={() => handleAnswer("no")}
									className="px-8 py-6 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/40 hover:border-rose-500/60 rounded-xl text-accent-rose font-semibold text-lg transition-all"
								>
									✗ No
								</button>
							</div>
						</motion.div>
					) : (
						<motion.div
							key="result"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							className="w-full max-w-2xl"
						>
							{/* Result */}
							<div className="text-center mb-6">
								<div className="text-5xl mb-3">{result?.icon}</div>
								<h3 className="text-3xl font-bold text-text-primary mb-1">
									{result?.technology}
								</h3>
								<p className="text-text-tertiary">{result?.description}</p>
							</div>

							{/* Use cases */}
							<div className="mb-6">
								<h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
									Common Use Cases
								</h4>
								<div className="space-y-2">
									{result?.useCases.map((useCase, idx) => (
										<motion.div
											key={useCase}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: idx * 0.08 }}
											className="flex items-center gap-2 text-sm text-text-secondary"
										>
											<span className="text-accent-green-soft">•</span>
											<span>{useCase}</span>
										</motion.div>
									))}
								</div>
							</div>

							<button
								type="button"
								onClick={reset}
								className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-lg text-text-primary font-semibold transition-colors"
							>
								↺ Start Over
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Quick reference shown while deciding */}
			{!finalResult && (
				<div className="bg-surface-secondary/30 border border-border-secondary rounded-lg p-5">
					<h4 className="text-sm font-semibold text-text-primary mb-3">
						Quick Reference
					</h4>
					<div className="space-y-2 text-sm text-text-tertiary">
						<div className="flex gap-2">
							<span className="text-accent-amber-soft">🔑</span>
							<span>
								<strong className="text-text-primary">OAuth 2.0:</strong>{" "}
								Third-party login, SSO, API delegation
							</span>
						</div>
						<div className="flex gap-2">
							<span className="text-accent-cyan-soft">🪙</span>
							<span>
								<strong className="text-text-primary">JWT:</strong>{" "}
								Microservices, mobile apps, stateless scaling
							</span>
						</div>
						<div className="flex gap-2">
							<span className="text-accent-violet-soft">🗄️</span>
							<span>
								<strong className="text-text-primary">Session-Based:</strong>{" "}
								Traditional web apps, immediate revocation
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Visual Flow Comparison */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-text-primary">
						Flow Comparison
					</h3>
					<button
						type="button"
						onClick={() => setShowFlows(!showFlows)}
						className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-text-primary text-sm font-medium transition-colors"
					>
						{showFlows ? "Hide Flows" : "Show Parallel Flows"}
					</button>
				</div>

				{showFlows && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="grid md:grid-cols-3 gap-4"
					>
						<FlowCard
							title="Session-Based"
							color="violet"
							steps={[
								"Login with credentials",
								"Server creates session",
								"Cookie auto-sent",
								"Server validates session",
								"Authenticated",
							]}
							highlight="Session stored server-side"
						/>
						<FlowCard
							title="JWT"
							color="cyan"
							steps={[
								"Login with credentials",
								"Server signs JWT",
								"Client stores token",
								"Send in Authorization header",
								"Server verifies signature",
							]}
							highlight="Stateless verification"
						/>
						<FlowCard
							title="OAuth 2.0"
							color="amber"
							steps={[
								"Redirect to provider",
								"User approves scopes",
								"Redirect with auth code",
								"Exchange code for token",
								"Access protected resources",
							]}
							highlight="Delegated authentication"
						/>
					</motion.div>
				)}
			</div>
		</div>
	);
}

function FlowCard({
	title,
	color,
	steps,
	highlight,
}: {
	title: string;
	color: string;
	steps: string[];
	highlight: string;
}) {
	const colors = FLOW_COLORS[color] || FLOW_COLORS.cyan;
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.5 }}
			className="rounded-lg p-4 border"
			style={{
				backgroundColor: colors.bg,
				borderColor: colors.border,
			}}
		>
			<h4 className="text-sm font-semibold mb-4" style={{ color: colors.text }}>
				{title}
			</h4>
			<div className="space-y-3">
				{steps.map((step, index) => (
					<motion.div
						key={step}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * 0.1, duration: 0.3 }}
						className="flex items-start gap-3"
					>
						<div
							className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
							style={{
								backgroundColor: colors.numberBg,
								borderColor: colors.numberBorder,
							}}
						>
							<span
								className="text-xs font-bold"
								style={{ color: colors.numberText }}
							>
								{index + 1}
							</span>
						</div>
						<div className="text-sm text-text-secondary">{step}</div>
					</motion.div>
				))}
			</div>
			<div
				className="mt-4 pt-4 border-t text-xs"
				style={{
					borderColor: colors.divider,
					color: colors.text,
				}}
			>
				{highlight}
			</div>
		</motion.div>
	);
}
