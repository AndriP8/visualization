import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface Control {
	id: string;
	label: string;
	stopsXSS: "yes" | "no" | "partial";
	stopsCSSRF: "yes" | "no" | "partial";
	explanation: string;
}

const CONTROLS: Control[] = [
	{
		id: "output-encoding",
		label: "Output encoding (HTML escape)",
		stopsXSS: "yes",
		stopsCSSRF: "no",
		explanation:
			"Converts < > & ' \" into HTML entities so the browser renders them as text, not as markup or script tags. Eliminates reflected and stored XSS in server-rendered HTML.",
	},
	{
		id: "avoid-innerhtml",
		label: "Avoid innerHTML / sanitize it (DOMPurify)",
		stopsXSS: "yes",
		stopsCSSRF: "no",
		explanation:
			"React auto-escapes string children, but the unsafe HTML prop bypasses this. DOMPurify strips unsafe tags/attributes before insertion into the DOM. Must run in a browser environment — not Node.js.",
	},
	{
		id: "csp",
		label: "Content-Security-Policy header",
		stopsXSS: "partial",
		stopsCSSRF: "no",
		explanation:
			"CSP script-src 'self' blocks inline scripts, reducing XSS impact. However, DOM-based XSS via innerHTML from same-origin JS can still occur. CSP does NOT prevent CSRF — form POST bypasses it entirely.",
	},
	{
		id: "csrf-token",
		label: "CSRF token (synchronizer pattern)",
		stopsXSS: "no",
		stopsCSSRF: "yes",
		explanation:
			"A random token tied to the user session, embedded in the HTML form (NOT in a cookie — that defeats the purpose). The attacker's origin cannot read it (CORS blocks cross-origin reads), so the forged request is rejected.",
	},
	{
		id: "samesite-strict",
		label: "SameSite=Strict cookie",
		stopsXSS: "no",
		stopsCSSRF: "yes",
		explanation:
			"Browser will NOT send the cookie on ANY cross-origin request — forms, navigations, fetch. Strongest CSRF protection. May break legitimate cross-site navigations (e.g., link from an email).",
	},
	{
		id: "samesite-lax",
		label: "SameSite=Lax cookie (Chrome 80+ default)",
		stopsXSS: "no",
		stopsCSSRF: "partial",
		explanation:
			"Allows the cookie on top-level GET navigations (e.g., user clicks a link). Blocks cross-origin POST form submissions. Default in Chrome since 2020. Stops most CSRF but not GET-based CSRF.",
	},
	{
		id: "origin-referer",
		label: "Origin/Referer header check",
		stopsXSS: "no",
		stopsCSSRF: "yes",
		explanation:
			"Server verifies the Origin or Referer header matches the expected domain. Defense-in-depth only — some older proxies strip these headers. Do NOT rely on this as the sole CSRF protection.",
	},
	{
		id: "cors",
		label: "CORS (Access-Control-Allow-Origin)",
		stopsXSS: "no",
		stopsCSSRF: "no",
		explanation:
			"CORS does NOT prevent CSRF. HTML form POST does not trigger a CORS preflight — the browser sends the request and cookie without asking. CORS only restricts what JS can read from cross-origin responses.",
	},
	{
		id: "httponly",
		label: "httpOnly cookie flag",
		stopsXSS: "partial",
		stopsCSSRF: "no",
		explanation:
			"Prevents document.cookie from being read by JavaScript — so XSS cannot directly steal the cookie value. But the browser still sends the cookie automatically in cross-origin form POSTs. Does NOT prevent CSRF.",
	},
];

const COMPARISON = [
	{
		label: "Attack vector",
		xss: "Injected script in page",
		csrf: "Forged request from another origin",
	},
	{
		label: "Attacker gains",
		xss: "Execute JS as victim",
		csrf: "Perform actions as victim",
	},
	{
		label: "Victim must",
		xss: "Load compromised page",
		csrf: "Be authenticated + visit attacker's page",
	},
	{
		label: "Data access",
		xss: "Yes (reads cookies, DOM)",
		csrf: "No (acts, doesn't read)",
	},
];

type StatusBadge = "yes" | "no" | "partial";

function Badge({ status }: { status: StatusBadge }) {
	if (status === "yes")
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
				YES
			</span>
		);
	if (status === "partial")
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
				Partial
			</span>
		);
	return (
		<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-700 text-zinc-500 border border-zinc-600">
			No
		</span>
	);
}

export function PreventionMatrixDemo() {
	const [activeControls, setActiveControls] = useState<Set<string>>(new Set());
	// Explanation open/close is tracked independently from the active (enabled) state.
	// This prevents the bug where toggling a row off would also close/open its explanation.
	const [expandedId, setExpandedId] = useState<string | null>(null);

	function toggleControl(id: string) {
		setActiveControls((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function toggleExpanded(id: string) {
		setExpandedId((prev) => (prev === id ? null : id));
	}

	const xssBlocked =
		activeControls.has("output-encoding") ||
		activeControls.has("avoid-innerhtml") ||
		activeControls.has("csp");

	const csrfBlocked =
		activeControls.has("csrf-token") ||
		activeControls.has("samesite-strict") ||
		activeControls.has("origin-referer");

	return (
		<div className="space-y-6">
			{/* Comparison table */}
			<div className="overflow-x-auto">
				<table className="w-full text-sm border-collapse">
					<thead>
						<tr className="border-b border-zinc-700">
							<th className="text-left py-2 px-3 text-zinc-400 font-semibold text-xs uppercase tracking-wider w-40">
								&nbsp;
							</th>
							<th className="text-left py-2 px-3 text-red-400 font-semibold text-xs uppercase tracking-wider">
								XSS
							</th>
							<th className="text-left py-2 px-3 text-red-400 font-semibold text-xs uppercase tracking-wider">
								CSRF
							</th>
						</tr>
					</thead>
					<tbody>
						{COMPARISON.map((row) => (
							<tr key={row.label} className="border-b border-zinc-800">
								<td className="py-2 px-3 text-zinc-400 text-xs font-medium">
									{row.label}
								</td>
								<td className="py-2 px-3 text-zinc-300 text-xs">{row.xss}</td>
								<td className="py-2 px-3 text-zinc-300 text-xs">{row.csrf}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Attack status */}
			<div className="grid grid-cols-2 gap-3">
				<div
					className={`rounded-lg p-3 border text-center ${
						xssBlocked
							? "bg-emerald-500/10 border-emerald-500/40"
							: "bg-red-500/10 border-red-500/40"
					}`}
				>
					<p className="text-xs text-zinc-400 mb-1">XSS</p>
					<p
						className={`text-sm font-bold ${xssBlocked ? "text-emerald-400" : "text-red-400"}`}
					>
						{xssBlocked ? "✓ Blocked" : "🔴 Active"}
					</p>
				</div>
				<div
					className={`rounded-lg p-3 border text-center ${
						csrfBlocked
							? "bg-emerald-500/10 border-emerald-500/40"
							: "bg-red-500/10 border-red-500/40"
					}`}
				>
					<p className="text-xs text-zinc-400 mb-1">CSRF</p>
					<p
						className={`text-sm font-bold ${csrfBlocked ? "text-emerald-400" : "text-red-400"}`}
					>
						{csrfBlocked ? "✓ Blocked" : "🔴 Active"}
					</p>
				</div>
			</div>

			{/* Prevention matrix */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
						Toggle to enable — click label for explanation
					</p>
					<div className="flex gap-3 text-xs text-zinc-500">
						<span>XSS</span>
						<span>CSRF</span>
					</div>
				</div>
				<div className="space-y-2">
					{CONTROLS.map((c) => {
						const active = activeControls.has(c.id);
						const expanded = expandedId === c.id;
						return (
							<div
								key={c.id}
								className={`rounded-lg border transition-colors ${
									active
										? "bg-violet-500/10 border-violet-500/40"
										: "bg-zinc-800 border-zinc-700"
								}`}
							>
								<div className="flex items-center gap-3 px-3 py-2.5">
									{/* Checkbox toggle — independent from label/explanation click */}
									<button
										type="button"
										onClick={() => toggleControl(c.id)}
										className="text-xs shrink-0 w-5 h-5 rounded border border-zinc-600 flex items-center justify-center hover:border-violet-400 transition-colors"
										aria-label={`${active ? "Disable" : "Enable"} ${c.label}`}
									>
										{active && <span className="text-violet-400">✓</span>}
									</button>
									{/* Label — clicking opens/closes explanation */}
									<button
										type="button"
										onClick={() => toggleExpanded(c.id)}
										className="flex-1 text-left text-sm text-zinc-200 hover:text-white transition-colors"
									>
										{c.label}
										<span className="ml-2 text-xs text-zinc-500">
											{expanded ? "▲" : "▼"}
										</span>
									</button>
									<div className="flex items-center gap-2 shrink-0">
										<Badge status={c.stopsXSS} />
										<Badge status={c.stopsCSSRF} />
									</div>
								</div>
								<AnimatePresence>
									{expanded && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											className="overflow-hidden"
										>
											<p className="px-3 pb-3 text-xs text-zinc-400 border-t border-zinc-700/50 pt-2">
												{c.explanation}
											</p>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						);
					})}
				</div>
			</div>

			{/* Misconceptions */}
			<div className="space-y-3">
				<p className="text-sm font-semibold text-zinc-300">
					Common Misconceptions
				</p>

				<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-1">
					<p className="text-red-400 font-semibold text-xs uppercase tracking-wider">
						Misconception: CORS prevents CSRF
					</p>
					<p className="text-zinc-300 text-xs">
						CORS does NOT prevent CSRF. HTML form POST does not trigger a CORS
						preflight — the browser sends the request (and attaches the cookie)
						without asking. CORS only restricts what JavaScript can read from
						cross-origin responses via fetch/XHR.
					</p>
				</div>

				<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-1">
					<p className="text-red-400 font-semibold text-xs uppercase tracking-wider">
						Misconception: httpOnly prevents CSRF
					</p>
					<p className="text-zinc-300 text-xs">
						httpOnly prevents JavaScript from reading the cookie value via
						document.cookie — so XSS cannot directly steal it. But the browser
						still automatically sends the cookie in cross-origin form POST
						requests. httpOnly provides no CSRF protection.
					</p>
				</div>

				<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-1">
					<p className="text-red-400 font-semibold text-xs uppercase tracking-wider">
						Misconception: CSP prevents CSRF
					</p>
					<p className="text-zinc-300 text-xs">
						A strong CSP reduces XSS impact by blocking inline scripts. It does
						NOT prevent CSRF — HTML form submissions are unaffected by CSP. The
						two attack classes require different defenses.
					</p>
				</div>
			</div>
		</div>
	);
}
