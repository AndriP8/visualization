import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

const VULNERABLE_CODE = `// Vulnerable: no origin verification
app.post('/transfer', requireAuth, (req, res) => {
  const { to, amount } = req.body;
  processTransfer(req.user, to, amount); // accepts requests from any origin
});`;

const SECURE_CODE = `// Secure option 1: CSRF token (synchronizer pattern)
// Token is NOT stored in a cookie — that would defeat the purpose
app.post('/transfer', requireAuth, verifyCsrfToken, (req, res) => {
  const { to, amount } = req.body;
  processTransfer(req.user, to, amount);
});

// Secure option 2: SameSite cookie attribute (modern browsers)
res.cookie('session', token, {
  httpOnly: true,
  sameSite: 'Strict', // browser will NOT send cookie on cross-origin requests
  secure: true,
});`;

const STEPS = [
	{
		title: "User logs into bank.example.com",
		description: "Server sets session cookie. Browser stores it.",
		cookie: "session=abc123 (httpOnly, Secure)",
		actor: "victim",
	},
	{
		title: "User visits evil.com (bank tab still open)",
		description:
			"evil.com loads a hidden form targeting bank.example.com/transfer with fields: to=attacker, amount=5000. JavaScript auto-submits it.",
		cookie: null,
		actor: "attacker",
	},
	{
		title: "Browser sends POST to bank.example.com",
		description:
			"Browser automatically attaches the session cookie — it cannot distinguish which origin triggered the request.",
		cookie: "Cookie: session=abc123  ← attached automatically!",
		actor: "browser",
	},
	{
		title: "Bank processes the transfer",
		description:
			"Bank sees a valid session — it cannot tell if this came from the real user or evil.com.",
		cookie: null,
		actor: "bank",
	},
] as const;

const STEPS_PROTECTED = [
	{
		title: "User logs into bank.example.com",
		description:
			"Server sets session cookie with SameSite=Strict AND generates a CSRF token.",
		cookie: "session=abc123; SameSite=Strict",
		actor: "victim",
	},
	{
		title: "User visits evil.com",
		description:
			"evil.com tries to submit the hidden form. But it cannot read the CSRF token — CORS blocks cross-origin read access, so the token stays secret.",
		cookie: null,
		actor: "attacker",
	},
	{
		title: "Browser sends POST — but cookie is blocked",
		description:
			"SameSite=Strict prevents the browser from attaching the session cookie on cross-origin requests. The request arrives without credentials.",
		cookie: "Cookie: (none — SameSite=Strict blocked it)",
		actor: "browser",
	},
	{
		title: "Bank rejects the request",
		description:
			"No valid session + no CSRF token = request rejected. Transfer never happens.",
		cookie: null,
		actor: "bank",
	},
] as const;

const actorColors: Record<string, string> = {
	victim: "text-sky-400",
	attacker: "text-rose-400",
	browser: "text-zinc-300",
	bank: "text-zinc-300",
};

export function CSRFDemo() {
	const [step, setStep] = useState(-1);
	const [protected_, setProtected] = useState(false);

	const steps = protected_ ? STEPS_PROTECTED : STEPS;
	const isRunning = step >= 0;

	function switchMode(value: boolean) {
		setProtected(value);
		setStep(-1); // reset flow when mode changes — prevents stale step state
	}

	function advance() {
		if (step < steps.length - 1) setStep((s) => s + 1);
	}

	function reset() {
		setStep(-1);
	}

	return (
		<div className="space-y-6">
			{/* Protection toggles */}
			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={() => switchMode(false)}
					className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
						!protected_
							? "bg-red-500/20 text-red-400 border border-red-500"
							: "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
					}`}
				>
					Without CSRF Protection
				</button>
				<button
					type="button"
					onClick={() => switchMode(true)}
					className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
						protected_
							? "bg-emerald-500/20 text-emerald-400 border border-emerald-500"
							: "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
					}`}
				>
					With CSRF Token + SameSite=Strict
				</button>
			</div>

			{/* CSRF token note — shown only in protected mode */}
			{protected_ && (
				<div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
					<strong>CSRF Token Rule:</strong> The token must NOT be stored in a
					cookie — that defeats the purpose. It must be embedded in the HTML
					form or sent in a request header, and verified server-side against the
					user session.
				</div>
			)}

			{/* Attack flow */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<p className="text-sm font-semibold text-zinc-300">
						Attack Flow (Step-Through)
					</p>
					<div className="flex gap-2">
						{!isRunning ? (
							<button
								type="button"
								onClick={() => setStep(0)}
								className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500 rounded text-xs font-medium hover:bg-red-500/30 transition-colors"
							>
								▶ Start
							</button>
						) : (
							<>
								{step < steps.length - 1 && (
									<button
										type="button"
										onClick={advance}
										className="px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded text-xs font-medium hover:bg-zinc-600 transition-colors"
									>
										Next →
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
					{steps.map((s, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static constant arrays, never reordered
						<AnimatePresence key={i}>
							{i <= step && (
								<motion.div
									initial={{ opacity: 0, x: -12 }}
									animate={{ opacity: 1, x: 0 }}
									className={`rounded-lg p-3 border text-sm ${
										protected_ && i >= 2
											? "bg-emerald-500/10 border-emerald-500/40"
											: !protected_ && i === steps.length - 1
												? "bg-red-500/20 border-red-500/60"
												: "bg-zinc-800 border-zinc-700"
									}`}
								>
									<div className="flex items-start justify-between gap-2">
										<p
											className={`font-semibold text-xs ${actorColors[s.actor]}`}
										>
											Step {i + 1}: {s.title}
										</p>
										{protected_ && i === steps.length - 1 && (
											<span className="text-emerald-400 text-xs font-bold shrink-0">
												✓ BLOCKED
											</span>
										)}
										{!protected_ && i === steps.length - 1 && (
											<span className="text-red-400 text-xs font-bold shrink-0">
												🔴 TRANSFER SENT
											</span>
										)}
									</div>
									<p className="text-zinc-400 text-xs mt-1">{s.description}</p>
									{s.cookie && (
										<p
											className={`mt-2 text-xs font-mono px-2 py-1 rounded ${
												protected_ && i === 2
													? "text-emerald-400 bg-emerald-500/10"
													: "text-amber-400 bg-amber-500/10"
											}`}
										>
											{s.cookie}
										</p>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					))}
				</div>
			</div>

			{/* Key distinction */}
			<div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4 text-sm">
				<p className="text-violet-300 font-semibold mb-1">
					XSS vs CSRF — The Core Difference
				</p>
				<p className="text-zinc-300 text-xs">
					<strong className="text-red-400">CSRF</strong> doesn&apos;t steal data
					— it forges actions. It exploits the browser&apos;s automatic cookie
					behavior. <strong className="text-red-400">XSS</strong> exploits the
					browser&apos;s script execution. They are different attack classes —
					do not conflate them with clickjacking.
				</p>
			</div>

			{/* Code */}
			<div>
				<p className="text-xs text-zinc-400 mb-2 font-semibold uppercase tracking-wider">
					{protected_ ? "Secure Implementation" : "Vulnerable Implementation"}
				</p>
				<ShikiCode
					language="typescript"
					code={protected_ ? SECURE_CODE : VULNERABLE_CODE}
					className="text-xs"
				/>
			</div>
		</div>
	);
}
