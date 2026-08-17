import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

interface TaskPrompt {
	id: string;
	title: string;
	prompt: string;
	candidateA: {
		label: string;
		code: string;
		explanation: string;
		correctnessScore: number;
		edgeCaseScore: number;
		clarityScore: number;
	};
	candidateB: {
		label: string;
		code: string;
		explanation: string;
		correctnessScore: number;
		edgeCaseScore: number;
		clarityScore: number;
	};
	winnerId: "A" | "B";
	rationale: string;
}

const TASKS: TaskPrompt[] = [
	{
		id: "sorting",
		title: "Numeric Array Sorting",
		prompt:
			"How do you sort an array of numbers in ascending order in JavaScript?",
		candidateA: {
			label: "Model A (Default Sort)",
			code: "const numbers = [10, 5, 40, 25, 1000, 1];\nnumbers.sort();\n// Output: [1, 10, 1000, 25, 40, 5]",
			explanation: "Uses default Array.prototype.sort() without comparator.",
			correctnessScore: 3,
			edgeCaseScore: 2,
			clarityScore: 8,
		},
		candidateB: {
			label: "Model B (Numeric Comparator)",
			code: "const numbers = [10, 5, 40, 25, 1000, 1];\nnumbers.sort((a, b) => a - b);\n// Output: [1, 5, 10, 25, 40, 1000]",
			explanation:
				"Supplies a subtraction comparator (a - b) to ensure numerical sorting instead of UTF-16 string conversion.",
			correctnessScore: 10,
			edgeCaseScore: 9,
			clarityScore: 9,
		},
		winnerId: "B",
		rationale:
			"Model B correctly identifies the JavaScript standard quirk where array.sort() converts numbers to strings before comparison. Model A produces broken output on multi-digit numbers.",
	},
	{
		id: "async-fetch",
		title: "Robust API Fetcher",
		prompt: "Write a function in TypeScript to fetch user profile data by ID.",
		candidateA: {
			label: "Model A (Basic Fetch)",
			code: "async function getUser(id: string) {\n  const res = await fetch('/api/users/' + id);\n  return await res.json();\n}",
			explanation:
				"Direct fetch call without HTTP status check or URL encoding.",
			correctnessScore: 6,
			edgeCaseScore: 4,
			clarityScore: 8,
		},
		candidateB: {
			label: "Model B (Checked Fetch with Sanitization)",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: demonstration code string
			code: "async function getUser(id: string): Promise<UserProfile> {\n  const safeId = encodeURIComponent(id.trim());\n  const res = await fetch(`/api/users/${safeId}`);\n  if (!res.ok) {\n    throw new Error(`Failed to fetch user (${res.status} ${res.statusText})`);\n  }\n  return res.json() as Promise<UserProfile>;\n}",
			explanation:
				"Encodes URI parameter, asserts res.ok status before parsing JSON, and returns typed Promise.",
			correctnessScore: 10,
			edgeCaseScore: 9,
			clarityScore: 8,
		},
		winnerId: "B",
		rationale:
			"Model B handles non-200 HTTP responses (which fetch does not reject by default) and encodes user input against malformed URI components.",
	},
	{
		id: "sql-security",
		title: "Parameterized Database Query",
		prompt:
			"Write a SQL query in Node.js to find a user by their email address.",
		candidateA: {
			label: "Model A (String Interpolation)",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: demonstration code string
			code: "async function findUserByEmail(email: string) {\n  const sql = `SELECT * FROM users WHERE email = '${email}'`;\n  return await db.query(sql);\n}",
			explanation: "Concatenates user input directly into SQL statement.",
			correctnessScore: 1,
			edgeCaseScore: 1,
			clarityScore: 7,
		},
		candidateB: {
			label: "Model B (Parameterized Query)",
			code: "async function findUserByEmail(email: string) {\n  const sql = 'SELECT id, email, name FROM users WHERE email = $1';\n  const result = await db.query(sql, [email.toLowerCase().trim()]);\n  return result.rows[0] ?? null;\n}",
			explanation:
				"Uses parameterized query placeholder ($1) to prevent SQL injection vulnerabilities and selects explicit columns.",
			correctnessScore: 10,
			edgeCaseScore: 10,
			clarityScore: 9,
		},
		winnerId: "B",
		rationale:
			"Model A contains a catastrophic SQL Injection vulnerability (CWE-89). Model B uses parameterized queries and avoids SELECT * leakage.",
	},
];

export function PairwiseArenaDemo() {
	const [activeTaskId, setActiveTaskId] = useState("sorting");
	const [isSwapped, setIsSwapped] = useState(false);
	const [evaluating, setEvaluating] = useState(false);
	const [judged, setJudged] = useState(true);

	const task = TASKS.find((t) => t.id === activeTaskId) ?? TASKS[0];

	// Presentation order: either [A, B] or [B, A]
	const firstCandidate = isSwapped ? task.candidateB : task.candidateA;
	const secondCandidate = isSwapped ? task.candidateA : task.candidateB;
	const firstSlotLabel = isSwapped
		? "Candidate Slot 1 (Model B)"
		: "Candidate Slot 1 (Model A)";
	const secondSlotLabel = isSwapped
		? "Candidate Slot 2 (Model A)"
		: "Candidate Slot 2 (Model B)";

	const runJudge = () => {
		setEvaluating(true);
		setJudged(false);
		window.setTimeout(() => {
			setEvaluating(false);
			setJudged(true);
		}, 450);
	};

	const scoreA =
		task.candidateA.correctnessScore * 0.5 +
		task.candidateA.edgeCaseScore * 0.3 +
		task.candidateA.clarityScore * 0.2;

	const scoreB =
		task.candidateB.correctnessScore * 0.5 +
		task.candidateB.edgeCaseScore * 0.3 +
		task.candidateB.clarityScore * 0.2;

	return (
		<DemoSection
			title="Demo 3: LLM-as-a-Judge Pairwise Arena & Position Debiasing"
			description="A judge model compares two candidate outputs against weighted evaluation rubrics. Swapping candidate presentation order (A ↔ B) detects and neutralizes position bias."
		>
			<div className="space-y-6">
				{/* Task Switcher & Controls */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap gap-2">
						{TASKS.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => {
									setActiveTaskId(t.id);
									setJudged(true);
								}}
								className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
									activeTaskId === t.id
										? "border-violet-500/60 bg-violet-500/10 text-violet-200"
										: "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
								}`}
							>
								{t.title}
							</button>
						))}
					</div>

					<div className="flex items-center gap-2">
						{/* Position Swap Toggle */}
						<button
							type="button"
							onClick={() => {
								setIsSwapped((v) => !v);
								runJudge();
							}}
							className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
								isSwapped
									? "border-amber-500/50 bg-amber-500/10 text-amber-200"
									: "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500"
							}`}
						>
							Order: {isSwapped ? "Swapped [B then A]" : "Standard [A then B]"}
						</button>

						<button
							type="button"
							disabled={evaluating}
							onClick={runJudge}
							className="rounded-lg border border-violet-500/40 bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-200 transition-colors hover:bg-violet-500/30 disabled:opacity-50"
						>
							{evaluating ? "Evaluating…" : "Re-evaluate"}
						</button>
					</div>
				</div>

				{/* Prompt banner */}
				<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
					<span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] mr-2">
						Evaluation Prompt:
					</span>
					"{task.prompt}"
				</div>

				{/* Side-by-side candidate comparison */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
						<div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
							<span>{firstSlotLabel}</span>
							<span className="font-mono text-zinc-400">
								{firstCandidate.label}
							</span>
						</div>
						<ShikiCode
							code={firstCandidate.code}
							language="typescript"
							showLineNumbers={false}
							className="max-h-48 overflow-y-auto"
						/>
						<p className="text-[11px] text-zinc-400">
							{firstCandidate.explanation}
						</p>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
						<div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
							<span>{secondSlotLabel}</span>
							<span className="font-mono text-zinc-400">
								{secondCandidate.label}
							</span>
						</div>
						<ShikiCode
							code={secondCandidate.code}
							language="typescript"
							showLineNumbers={false}
							className="max-h-48 overflow-y-auto"
						/>
						<p className="text-[11px] text-zinc-400">
							{secondCandidate.explanation}
						</p>
					</div>
				</div>

				{/* Judge Scorecard & Verdict */}
				{judged && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-5 space-y-4"
					>
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-500/20 pb-3">
							<div className="flex items-center gap-2">
								<span className="text-xs uppercase tracking-wider font-semibold text-violet-300">
									Judge Verdict:
								</span>
								<span className="font-mono text-sm font-bold text-emerald-400">
									Model {task.winnerId} Wins
								</span>
							</div>

							<div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
								<span>
									Model A Score:{" "}
									<strong className="text-zinc-200">
										{scoreA.toFixed(1)}/10
									</strong>
								</span>
								<span>
									Model B Score:{" "}
									<strong className="text-emerald-300">
										{scoreB.toFixed(1)}/10
									</strong>
								</span>
							</div>
						</div>

						{/* Rubric scorecard table */}
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs font-mono">
								<thead>
									<tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase">
										<th className="pb-2 font-normal">Rubric Dimension</th>
										<th className="pb-2 font-normal">Weight</th>
										<th className="pb-2 font-normal">Model A</th>
										<th className="pb-2 font-normal">Model B</th>
										<th className="pb-2 font-normal">Advantage</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-800/60 text-zinc-300">
									<tr>
										<td className="py-2">Correctness & Security</td>
										<td className="py-2 text-zinc-500">50%</td>
										<td className="py-2">
											{task.candidateA.correctnessScore}/10
										</td>
										<td className="py-2 text-emerald-400">
											{task.candidateB.correctnessScore}/10
										</td>
										<td className="py-2 text-emerald-300 font-semibold">
											Model B (+
											{task.candidateB.correctnessScore -
												task.candidateA.correctnessScore}
											)
										</td>
									</tr>
									<tr>
										<td className="py-2">Edge Case Handling</td>
										<td className="py-2 text-zinc-500">30%</td>
										<td className="py-2">{task.candidateA.edgeCaseScore}/10</td>
										<td className="py-2 text-emerald-400">
											{task.candidateB.edgeCaseScore}/10
										</td>
										<td className="py-2 text-emerald-300 font-semibold">
											Model B (+
											{task.candidateB.edgeCaseScore -
												task.candidateA.edgeCaseScore}
											)
										</td>
									</tr>
									<tr>
										<td className="py-2">Clarity & Brevity</td>
										<td className="py-2 text-zinc-500">20%</td>
										<td className="py-2">{task.candidateA.clarityScore}/10</td>
										<td className="py-2 text-emerald-400">
											{task.candidateB.clarityScore}/10
										</td>
										<td className="py-2 text-zinc-400">Tied / Close</td>
									</tr>
								</tbody>
							</table>
						</div>

						{/* Judge Critique text */}
						<div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 space-y-1">
							<div className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">
								Judge Rationale & Synthesis
							</div>
							<p className="leading-relaxed">{task.rationale}</p>
						</div>

						{/* Metrics */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
							<Metric label="Pair Winner" value={`Model ${task.winnerId}`} />
							<Metric
								label="Position Swap Bias"
								value="Invariant (0.00)"
								sub="Checked"
							/>
							<Metric label="Judge Confidence" value="98.4%" />
							<Metric label="Rubrics Evaluated" value="3 Criteria" />
						</div>
					</motion.div>
				)}
			</div>
		</DemoSection>
	);
}

function Metric({
	label,
	value,
	sub,
}: {
	label: string;
	value: string;
	sub?: string;
}) {
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className="font-mono text-sm sm:text-base font-semibold text-zinc-200 mt-0.5">
				{value} {sub && <span className="text-[10px] text-emerald-400">✓</span>}
			</div>
		</div>
	);
}
