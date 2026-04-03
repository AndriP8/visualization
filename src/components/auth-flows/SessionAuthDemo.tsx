import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { ShikiCode } from "../shared/ShikiCode";
import { AuthFlowSequence } from "./AuthFlowSequence";
import { InspectPanel } from "./InspectPanel";
import type { SequenceStep } from "./types";

type Phase =
	| "idle"
	| "logging-in"
	| "logged-in"
	| "making-request"
	| "logged-out";

const SESSION_ID = "abc123xyz789";
const USER_ID = 123;

export function SessionAuthDemo() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [currentStep, setCurrentStep] = useState(-1);
	const [inspecting, setInspecting] = useState(false);
	const [sessionExpiry, setSessionExpiry] = useState(30);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimeouts = useCallback(() => {
		for (const t of timeoutsRef.current) clearTimeout(t);
		timeoutsRef.current = [];
	}, []);

	const schedule = useCallback((fn: () => void, delay: number) => {
		const id = setTimeout(fn, delay);
		timeoutsRef.current.push(id);
	}, []);

	useEffect(() => clearTimeouts, [clearTimeouts]);

	const loginSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "server",
			label: "POST /login (credentials)",
			color: "violet",
			data: [
				{ key: "username", value: "user@example.com" },
				{ key: "password", value: "••••••••" },
			],
		},
		{
			from: "server",
			to: "db",
			label: "Validate credentials",
			color: "cyan",
		},
		{
			from: "db",
			to: "server",
			label: "User found",
			color: "amber",
			data: [{ key: "userId", value: String(USER_ID) }],
		},
		{
			from: "server",
			to: "db",
			label: "Store session",
			color: "cyan",
			data: [
				{ key: "sessionId", value: SESSION_ID },
				{ key: "userId", value: String(USER_ID) },
			],
		},
		{
			from: "db",
			to: "server",
			label: "Session stored",
			color: "amber",
		},
		{
			from: "server",
			to: "browser",
			label: "Set-Cookie: sessionId",
			color: "violet",
			data: [
				{ key: "sessionId", value: SESSION_ID },
				{ key: "HttpOnly", value: "true" },
			],
		},
	];

	const requestSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "server",
			label: "GET /api/profile",
			color: "violet",
			data: [{ key: "Cookie", value: `sessionId=${SESSION_ID}` }],
		},
		{
			from: "server",
			to: "db",
			label: "Lookup session",
			color: "cyan",
			data: [{ key: "sessionId", value: SESSION_ID }],
		},
		{
			from: "db",
			to: "server",
			label: "Session valid",
			color: "amber",
			data: [{ key: "userId", value: String(USER_ID) }],
		},
		{
			from: "server",
			to: "browser",
			label: "200 OK (profile data)",
			color: "violet",
		},
	];

	const logoutSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "server",
			label: "POST /logout",
			color: "violet",
			data: [{ key: "Cookie", value: `sessionId=${SESSION_ID}` }],
		},
		{
			from: "server",
			to: "db",
			label: "Delete session",
			color: "cyan",
			data: [{ key: "sessionId", value: SESSION_ID }],
		},
		{
			from: "db",
			to: "server",
			label: "Session deleted",
			color: "amber",
		},
		{
			from: "server",
			to: "browser",
			label: "Clear cookie",
			color: "violet",
		},
	];

	const handleAction = useCallback(() => {
		clearTimeouts();
		match(phase)
			.with("idle", () => {
				setPhase("logging-in");
				setCurrentStep(-1);
				setSessionExpiry(30);
				// Animate login steps
				for (let i = 0; i <= loginSteps.length - 1; i++) {
					schedule(() => setCurrentStep(i), i * 600);
				}
				schedule(() => setPhase("logged-in"), loginSteps.length * 600);
			})
			.with("logged-in", () => {
				setPhase("making-request");
				setCurrentStep(-1);
				// Animate request steps
				for (let i = 0; i <= requestSteps.length - 1; i++) {
					schedule(() => setCurrentStep(i), i * 600);
				}
				schedule(() => setPhase("logged-in"), requestSteps.length * 600);
			})
			.with("making-request", () => {
				// Do nothing while animating
			})
			.with("logging-in", () => {
				// Do nothing while animating
			})
			.with("logged-out", () => {
				setPhase("idle");
				setCurrentStep(-1);
			})
			.exhaustive();
	}, [phase, clearTimeouts, schedule, loginSteps.length, requestSteps.length]);

	const handleLogout = useCallback(() => {
		clearTimeouts();
		setPhase("logged-out");
		setCurrentStep(-1);
		// Animate logout steps
		for (let i = 0; i <= logoutSteps.length - 1; i++) {
			schedule(() => setCurrentStep(i), i * 600);
		}
	}, [clearTimeouts, schedule, logoutSteps.length]);

	useEffect(() => {
		if (phase !== "logged-in") return;
		const interval = setInterval(() => {
			setSessionExpiry((prev) => Math.max(0, prev - 1));
		}, 1000);
		return () => clearInterval(interval);
	}, [phase]);

	const getSteps = (): SequenceStep[] => {
		if (phase === "logging-in") return loginSteps;
		if (phase === "making-request") return requestSteps;
		if (phase === "logged-out") return logoutSteps;
		return [];
	};

	const getButtonLabel = (): string => {
		if (phase === "idle") return "Start: Login";
		if (phase === "logging-in") return "Logging in...";
		if (phase === "logged-in") return "Make API Request (as logged-in user)";
		if (phase === "making-request") return "Loading...";
		return "Reset Demo";
	};

	const expiryColor =
		sessionExpiry > 20
			? "text-accent-emerald-soft"
			: sessionExpiry > 10
				? "text-accent-amber-soft"
				: "text-accent-rose-soft";

	return (
		<div className="space-y-8">
			{/* Controls */}
			<div className="flex flex-wrap items-center gap-4">
				<button
					type="button"
					onClick={handleAction}
					disabled={phase === "logging-in" || phase === "making-request"}
					className="px-6 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:bg-surface-tertiary disabled:text-text-muted text-text-primary font-medium transition-colors"
				>
					{getButtonLabel()}
				</button>
				{phase === "logged-in" && (
					<motion.button
						type="button"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						onClick={handleLogout}
						className="px-6 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-text-primary font-medium transition-colors"
					>
						Logout
					</motion.button>
				)}
			</div>

			{/* Visual State */}
			{(phase === "logged-in" || phase === "making-request") && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="grid md:grid-cols-2 gap-4"
				>
					{/* Browser Cookie */}
					<div className="bg-surface-primary border border-border-primary rounded-lg p-4">
						<h4 className="text-sm font-semibold text-accent-violet mb-3">
							Browser (Cookie Storage)
						</h4>
						<button
							type="button"
							onClick={() => setInspecting(true)}
							className="w-full text-left bg-surface-secondary border border-violet-500/30 rounded p-3 hover:border-violet-500/50 transition-colors"
						>
							<div className="text-xs text-text-muted mb-1">Cookie</div>
							<div className="font-mono text-sm text-accent-violet break-all">
								sessionId={SESSION_ID}
							</div>
							<div className="text-xs text-text-faint mt-2 space-x-2">
								<span>HttpOnly</span>
								<span>•</span>
								<span>Secure</span>
								<span>•</span>
								<span>SameSite=Strict</span>
							</div>
						</button>
						<p className="text-xs text-text-muted mt-2">
							Click to inspect cookie flags
						</p>
					</div>

					{/* Server Session */}
					<div className="bg-surface-primary border border-border-primary rounded-lg p-4">
						<h4 className="text-sm font-semibold text-accent-cyan mb-3">
							Server (Session Store)
						</h4>
						<div className="bg-surface-secondary border border-cyan-500/30 rounded p-3">
							<div className="text-xs text-text-muted mb-1">Session Data</div>
							<div className="font-mono text-sm text-accent-cyan space-y-1">
								<div>sessionId: {SESSION_ID}</div>
								<div>userId: {USER_ID}</div>
								<div className="flex items-center gap-2">
									<span>expiresIn:</span>
									<span className={expiryColor}>{sessionExpiry}s</span>
									{sessionExpiry <= 10 && (
										<motion.span
											animate={{ opacity: [1, 0.5, 1] }}
											transition={{
												duration: 1,
												repeat: Number.POSITIVE_INFINITY,
											}}
											className="text-accent-rose-soft"
										>
											⚠️
										</motion.span>
									)}
								</div>
							</div>
						</div>
					</div>
				</motion.div>
			)}

			{/* Sequence Diagram */}
			{(phase === "logging-in" ||
				phase === "making-request" ||
				phase === "logged-out") && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="bg-surface-primary border border-border-primary rounded-lg overflow-hidden"
				>
					<AuthFlowSequence
						steps={getSteps()}
						currentStep={currentStep}
						actors={["browser", "server", "db"]}
					/>
				</motion.div>
			)}

			{/* Security Callout */}
			<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
				<h4 className="text-sm font-semibold text-accent-emerald mb-2">
					✓ Security Benefits
				</h4>
				<p className="text-sm text-emerald-200">
					Session stored server-side. Stateful but more secure than client-side
					tokens. HttpOnly cookies prevent XSS attacks. SameSite=Strict protects
					against CSRF.
				</p>
			</div>

			{/* Code Example */}
			<div>
				<h4 className="text-sm font-semibold text-text-primary mb-3">
					Server Implementation
				</h4>
				<ShikiCode
					language="typescript"
					code={`import { db } from './db'
import { users, sessions } from './schema'
import { eq } from 'drizzle-orm'

app.post('/login', async (req, res) => {
  const { username, password } = req.body

  // Query user with Drizzle
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Store session in DB
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  })

  // Set httpOnly cookie
  res.cookie('sessionId', sessionId, {
    httpOnly: true,     // Prevents XSS
    secure: true,       // HTTPS only
    sameSite: 'strict', // CSRF protection
    maxAge: 30 * 60 * 1000,
  })

  res.json({ success: true })
})

app.post('/logout', async (req, res) => {
  const sessionId = req.cookies.sessionId

  await db.delete(sessions).where(eq(sessions.id, sessionId))

  res.clearCookie('sessionId')
  res.json({ success: true })
})`}
					className="text-xs"
				/>
			</div>

			{/* Inspect Panel */}
			<InspectPanel
				isOpen={inspecting}
				onClose={() => setInspecting(false)}
				type="cookie"
				title="Session Cookie Inspector"
				data={{
					value: SESSION_ID,
					httpOnly: true,
					secure: true,
					sameSite: "Strict",
					maxAge: 1800,
				}}
			/>
		</div>
	);
}
