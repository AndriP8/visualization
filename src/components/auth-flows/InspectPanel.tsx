import { AnimatePresence, motion } from "motion/react";

interface InspectPanelProps {
	isOpen: boolean;
	onClose: () => void;
	type: "cookie" | "token" | "pkce";
	data: Record<string, unknown>;
	title: string;
}

export function InspectPanel({
	isOpen,
	onClose,
	type,
	data,
	title,
}: InspectPanelProps) {
	return (
		<AnimatePresence mode="wait">
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
					/>

					{/* Panel */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-auto"
					>
						<div className="bg-surface-primary border border-border-secondary rounded-lg shadow-2xl">
							{/* Header */}
							<div className="flex items-center justify-between p-4 border-b border-border-secondary">
								<h3 className="text-lg font-semibold text-text-primary">
									{title}
								</h3>
								<button
									type="button"
									onClick={onClose}
									className="text-text-tertiary hover:text-text-primary transition-colors"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Close</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							{/* Content */}
							<div className="p-6 space-y-4">
								{type === "token" && renderJWT(data)}
								{type === "cookie" && renderCookie(data)}
								{type === "pkce" && renderPKCE(data)}
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

function renderJWT(data: Record<string, unknown>) {
	const header = data.header as Record<string, unknown>;
	const payload = data.payload as Record<string, unknown>;
	const signature = data.signature as string;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<div className="w-3 h-3 rounded-full bg-rose-400" />
					<h4 className="text-sm font-semibold text-accent-rose uppercase tracking-wide">
						Header
					</h4>
				</div>
				<div className="bg-surface-secondary border border-border-secondary rounded p-4 font-mono text-sm">
					<pre className="text-text-secondary">
						{JSON.stringify(header, null, 2)}
					</pre>
				</div>
			</div>

			{/* Payload */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<div className="w-3 h-3 rounded-full bg-violet-400" />
					<h4 className="text-sm font-semibold text-accent-violet uppercase tracking-wide">
						Payload
					</h4>
				</div>
				<div className="bg-surface-secondary border border-border-secondary rounded p-4 font-mono text-sm">
					<pre className="text-text-secondary">
						{JSON.stringify(payload, null, 2)}
					</pre>
				</div>
			</div>

			{/* Signature */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<div className="w-3 h-3 rounded-full bg-cyan-400" />
					<h4 className="text-sm font-semibold text-accent-cyan uppercase tracking-wide">
						Signature
					</h4>
				</div>
				<div className="bg-surface-secondary border border-border-secondary rounded p-4 font-mono text-sm break-all">
					<span className="text-accent-cyan">{signature}</span>
				</div>
				<p className="text-xs text-text-muted mt-2">
					Verifies token integrity using server's secret key
				</p>
			</div>
		</div>
	);
}

function renderCookie(data: Record<string, unknown>) {
	return (
		<div className="space-y-4">
			{/* Cookie value */}
			<div>
				<h4 className="text-sm font-semibold text-accent-violet mb-2">Value</h4>
				<div className="bg-surface-secondary border border-border-secondary rounded p-4 font-mono text-sm break-all">
					<span className="text-text-secondary">{data.value as string}</span>
				</div>
			</div>

			{/* Flags */}
			<div>
				<h4 className="text-sm font-semibold text-accent-violet mb-2">
					Security Flags
				</h4>
				<div className="space-y-3">
					<FlagItem
						name="HttpOnly"
						value={data.httpOnly as boolean}
						description="Prevents JavaScript access (XSS protection)"
					/>
					<FlagItem
						name="Secure"
						value={data.secure as boolean}
						description="Only sent over HTTPS connections"
					/>
					<FlagItem
						name="SameSite"
						value={data.sameSite as string}
						description="CSRF protection (Strict/Lax/None)"
					/>
					{data.maxAge !== undefined && (
						<div className="flex items-start gap-3">
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<span className="text-sm text-text-tertiary">Max-Age:</span>
									<span className="text-sm text-text-primary font-mono">
										{String(data.maxAge)}s
									</span>
								</div>
								<p className="text-xs text-text-muted mt-1">
									Cookie lifetime in seconds
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function renderPKCE(data: Record<string, unknown>) {
	return (
		<div className="space-y-6">
			{/* Code Verifier */}
			<div>
				<h4 className="text-sm font-semibold text-accent-amber mb-2">
					Code Verifier
				</h4>
				<div className="bg-surface-secondary border border-border-secondary rounded p-4 font-mono text-sm break-all">
					<span className="text-accent-amber">
						{data.code_verifier as string}
					</span>
				</div>
				<p className="text-xs text-text-muted mt-2">
					Random string (43-128 chars) stored securely in browser
				</p>
			</div>

			{/* Code Challenge */}
			<div>
				<h4 className="text-sm font-semibold text-accent-cyan mb-2">
					Code Challenge
				</h4>
				<div className="bg-surface-secondary border border-border-secondary rounded p-4 font-mono text-sm break-all">
					<span className="text-accent-cyan">
						{data.code_challenge as string}
					</span>
				</div>
				<p className="text-xs text-text-muted mt-2">
					SHA256(code_verifier) - sent to OAuth provider
				</p>
			</div>

			{/* Method */}
			<div>
				<h4 className="text-sm font-semibold text-accent-violet mb-2">
					Method
				</h4>
				<div className="bg-surface-secondary border border-border-secondary rounded p-4">
					<span className="text-text-primary font-mono">
						{data.method as string}
					</span>
				</div>
			</div>

			{/* Explanation */}
			<div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4">
				<p className="text-sm text-emerald-200">
					PKCE prevents authorization code interception attacks. The verifier
					stays on the client, only the challenge is sent to the provider.
				</p>
			</div>
		</div>
	);
}

function FlagItem({
	name,
	value,
	description,
}: {
	name: string;
	value: boolean | string;
	description: string;
}) {
	const isEnabled = typeof value === "boolean" ? value : true;
	return (
		<div className="flex items-start gap-3">
			<div className="flex-1">
				<div className="flex items-center gap-2">
					<div
						className={`w-2 h-2 rounded-full ${isEnabled ? "bg-emerald-400" : "bg-surface-tertiary"}`}
					/>
					<span className="text-sm text-text-tertiary">{name}:</span>
					<span className="text-sm text-text-primary font-mono">
						{typeof value === "boolean" ? (value ? "true" : "false") : value}
					</span>
				</div>
				<p className="text-xs text-text-muted mt-1 ml-4">{description}</p>
			</div>
		</div>
	);
}
