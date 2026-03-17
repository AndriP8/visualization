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
	| "authenticated"
	| "making-request"
	| "token-expiring"
	| "refreshing"
	| "tampered";

type StorageType = "localStorage" | "httpOnly";

const ACCESS_TOKEN_EXPIRY = 15;

const JWT_HEADER = { alg: "HS256", typ: "JWT" };
const JWT_PAYLOAD = {
	sub: "123",
	email: "user@example.com",
	iat: Math.floor(Date.now() / 1000),
	exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY,
};
const JWT_SIGNATURE = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const ACCESS_TOKEN =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const REFRESH_TOKEN = "rt_abc123xyz789";

export function JWTAuthDemo() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [currentStep, setCurrentStep] = useState(-1);
	const [inspecting, setInspecting] = useState(false);
	const [storageType, setStorageType] = useState<StorageType>("httpOnly");
	const [showRefresh, setShowRefresh] = useState(true);
	const [tokenExpiry, setTokenExpiry] = useState(ACCESS_TOKEN_EXPIRY);
	const [verifying, setVerifying] = useState(false);
	const [verifySuccess, setVerifySuccess] = useState<boolean | null>(null);
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
			color: "cyan",
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
		},
		{
			from: "server",
			to: "server",
			label: "Sign JWT + Refresh Token",
			color: "cyan",
		},
		{
			from: "server",
			to: "browser",
			label: showRefresh ? "Return tokens" : "Return JWT",
			color: "cyan",
			data: showRefresh
				? [
						{ key: "accessToken", value: `${ACCESS_TOKEN.slice(0, 30)}...` },
						{ key: "refreshToken", value: REFRESH_TOKEN },
					]
				: [{ key: "token", value: `${ACCESS_TOKEN.slice(0, 30)}...` }],
		},
	];

	const requestSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "server",
			label: "GET /api/profile",
			color: "cyan",
			data: [
				{
					key: "Authorization",
					value: `Bearer ${ACCESS_TOKEN.slice(0, 20)}...`,
				},
			],
		},
		{
			from: "server",
			to: "server",
			label: "Verify signature",
			color: "cyan",
		},
		{
			from: "server",
			to: "browser",
			label: "200 OK",
			color: "cyan",
		},
	];

	const refreshSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "server",
			label: "POST /refresh",
			color: "amber",
			data: [{ key: "refreshToken", value: REFRESH_TOKEN }],
		},
		{
			from: "server",
			to: "db",
			label: "Validate refresh token",
			color: "cyan",
		},
		{
			from: "db",
			to: "server",
			label: "Token valid",
			color: "amber",
		},
		{
			from: "server",
			to: "server",
			label: "Sign new access token",
			color: "cyan",
		},
		{
			from: "server",
			to: "browser",
			label: "Return new tokens",
			color: "cyan",
			data: [
				{ key: "accessToken", value: `${ACCESS_TOKEN.slice(0, 30)}...` },
				{ key: "refreshToken", value: `rt_new_${Date.now()}` },
			],
		},
	];

	const handleAction = useCallback(() => {
		clearTimeouts();
		match(phase)
			.with("idle", () => {
				setPhase("logging-in");
				setCurrentStep(-1);
				setTokenExpiry(ACCESS_TOKEN_EXPIRY);
				for (let i = 0; i <= loginSteps.length - 1; i++) {
					schedule(() => setCurrentStep(i), i * 600);
				}
				schedule(() => setPhase("authenticated"), loginSteps.length * 600);
			})
			.with("authenticated", () => {
				setPhase("making-request");
				setCurrentStep(-1);
				setVerifying(false);
				setVerifySuccess(null);
				for (let i = 0; i <= requestSteps.length - 1; i++) {
					schedule(() => setCurrentStep(i), i * 600);
					if (i === 1) {
						schedule(() => {
							setVerifying(true);
							schedule(() => {
								setVerifying(false);
								setVerifySuccess(true);
							}, 800);
						}, i * 600);
					}
				}
				schedule(() => setPhase("authenticated"), requestSteps.length * 600);
			})
			.with("token-expiring", () => {
				if (!showRefresh) {
					setPhase("idle");
					setCurrentStep(-1);
					setTokenExpiry(ACCESS_TOKEN_EXPIRY);
					return;
				}
				setPhase("refreshing");
				setCurrentStep(-1);
				setTokenExpiry(ACCESS_TOKEN_EXPIRY);
				for (let i = 0; i <= refreshSteps.length - 1; i++) {
					schedule(() => setCurrentStep(i), i * 600);
				}
				schedule(() => setPhase("authenticated"), refreshSteps.length * 600);
			})
			.with("tampered", () => {
				setPhase("idle");
				setCurrentStep(-1);
				setVerifySuccess(null);
			})
			.with("logging-in", "making-request", "refreshing", () => {
				// Do nothing while animating
			})
			.exhaustive();
	}, [
		phase,
		clearTimeouts,
		schedule,
		loginSteps.length,
		requestSteps.length,
		refreshSteps.length,
		showRefresh,
	]);

	const handleTamper = useCallback(() => {
		clearTimeouts();
		setPhase("making-request");
		setCurrentStep(1);
		setVerifying(true);
		schedule(() => {
			setVerifying(false);
			setVerifySuccess(false);
			setPhase("tampered");
		}, 1000);
	}, [clearTimeouts, schedule]);

	useEffect(() => {
		if (phase !== "authenticated") return;
		const interval = setInterval(() => {
			setTokenExpiry((prev) => {
				const next = Math.max(0, prev - 1);
				if (next <= 5 && prev > 5) {
					setPhase("token-expiring");
				}
				return next;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [phase]);

	const getSteps = (): SequenceStep[] => {
		if (phase === "logging-in") return loginSteps;
		if (phase === "making-request") return requestSteps;
		if (phase === "refreshing") return refreshSteps;
		return [];
	};

	const getButtonLabel = (): string => {
		if (phase === "idle") return "Start: Login";
		if (phase === "logging-in") return "Logging in...";
		if (phase === "authenticated")
			return "Make API Request (as logged-in user)";
		if (phase === "making-request") return "Verifying...";
		if (phase === "token-expiring")
			return showRefresh ? "Refresh Token" : "Token Expired - Reset";
		if (phase === "refreshing") return "Refreshing...";
		if (phase === "tampered") return "Reset Demo";
		return "Start";
	};

	const expiryColor =
		tokenExpiry > 10
			? "text-emerald-400"
			: tokenExpiry > 5
				? "text-amber-400"
				: "text-rose-400";

	return (
		<div className="space-y-8">
			{/* Controls */}
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-4">
					<button
						type="button"
						onClick={handleAction}
						disabled={
							phase === "logging-in" ||
							phase === "making-request" ||
							phase === "refreshing"
						}
						className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-colors"
					>
						{getButtonLabel()}
					</button>
					{phase === "authenticated" && (
						<motion.button
							type="button"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							onClick={handleTamper}
							className="px-6 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors"
						>
							Tamper with Token
						</motion.button>
					)}
				</div>

				{/* Toggles */}
				{phase === "idle" && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex flex-wrap gap-4"
					>
						<div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
							<span className="text-sm text-zinc-400">Storage:</span>
							<button
								type="button"
								onClick={() => setStorageType("localStorage")}
								className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
									storageType === "localStorage"
										? "bg-cyan-500 text-white"
										: "bg-zinc-800 text-zinc-400 hover:text-white"
								}`}
							>
								localStorage
							</button>
							<button
								type="button"
								onClick={() => setStorageType("httpOnly")}
								className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
									storageType === "httpOnly"
										? "bg-cyan-500 text-white"
										: "bg-zinc-800 text-zinc-400 hover:text-white"
								}`}
							>
								httpOnly Cookie
							</button>
						</div>

						<div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
							<label htmlFor="refresh-toggle" className="text-sm text-zinc-400">
								With refresh tokens:
							</label>
							<button
								id="refresh-toggle"
								type="button"
								onClick={() => setShowRefresh(!showRefresh)}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									showRefresh ? "bg-cyan-500" : "bg-zinc-700"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										showRefresh ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</motion.div>
				)}
			</div>

			{/* Visual State */}
			{(phase === "authenticated" ||
				phase === "making-request" ||
				phase === "token-expiring" ||
				phase === "tampered") && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="space-y-4"
				>
					{/* JWT Structure */}
					<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
						<h4 className="text-sm font-semibold text-cyan-300 mb-3">
							JWT Structure
						</h4>
						<button
							type="button"
							onClick={() => setInspecting(true)}
							className="w-full text-left bg-zinc-800 border border-cyan-500/30 rounded p-3 hover:border-cyan-500/50 transition-colors font-mono text-xs break-all"
						>
							<span className="text-rose-300">
								{ACCESS_TOKEN.split(".")[0]}
							</span>
							<span className="text-zinc-600">.</span>
							<span className="text-violet-300">
								{ACCESS_TOKEN.split(".")[1]}
							</span>
							<span className="text-zinc-600">.</span>
							<span className="text-cyan-300">
								{ACCESS_TOKEN.split(".")[2]}
							</span>
						</button>
						<div className="flex items-center gap-4 mt-3 text-xs">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-rose-400" />
								<span className="text-zinc-500">Header</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-violet-400" />
								<span className="text-zinc-500">Payload</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-cyan-400" />
								<span className="text-zinc-500">Signature</span>
							</div>
						</div>
						<p className="text-xs text-zinc-500 mt-2">
							Click to inspect token contents
						</p>
					</div>

					{/* Token Status */}
					<div className="grid md:grid-cols-2 gap-4">
						<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
							<h4 className="text-sm font-semibold text-amber-300 mb-3">
								Access Token
							</h4>
							<div className="bg-zinc-800 rounded p-3">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs text-zinc-500">Expires in:</span>
									<span
										className={`text-sm font-mono font-bold ${expiryColor}`}
									>
										{tokenExpiry}s
									</span>
								</div>
								<div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
									<motion.div
										className={`h-full ${
											tokenExpiry > 10
												? "bg-emerald-400"
												: tokenExpiry > 5
													? "bg-amber-400"
													: "bg-rose-400"
										}`}
										initial={{ width: "100%" }}
										animate={{
											width: `${(tokenExpiry / ACCESS_TOKEN_EXPIRY) * 100}%`,
										}}
										transition={{ duration: 0.3 }}
									/>
								</div>
							</div>
						</div>

						{showRefresh && (
							<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
								<h4 className="text-sm font-semibold text-violet-300 mb-3">
									Refresh Token
								</h4>
								<div className="bg-zinc-800 rounded p-3">
									<div className="font-mono text-xs text-violet-300 break-all mb-2">
										{REFRESH_TOKEN}
									</div>
									<div className="text-xs text-zinc-500">
										Long-lived (7 days), one-time use
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Verification Status */}
					{(verifying || verifySuccess !== null) && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							className={`border rounded-lg p-4 ${
								verifySuccess === null
									? "bg-zinc-900 border-zinc-800"
									: verifySuccess
										? "bg-emerald-500/10 border-emerald-500/30"
										: "bg-rose-500/10 border-rose-500/30"
							}`}
						>
							<div className="flex items-center gap-3">
								{verifying && (
									<motion.div
										animate={{ rotate: 360 }}
										transition={{
											duration: 1,
											repeat: Number.POSITIVE_INFINITY,
											ease: "linear",
										}}
										className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"
									/>
								)}
								{!verifying && verifySuccess === true && (
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{ type: "spring", stiffness: 300, damping: 20 }}
										className="text-2xl"
									>
										✓
									</motion.div>
								)}
								{!verifying && verifySuccess === false && (
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }}
										transition={{
											scale: { type: "spring", stiffness: 300, damping: 20 },
											rotate: { duration: 0.5 },
										}}
										className="text-2xl"
									>
										✗
									</motion.div>
								)}
								<div>
									<div
										className={`text-sm font-semibold ${
											verifying
												? "text-cyan-300"
												: verifySuccess
													? "text-emerald-300"
													: "text-rose-300"
										}`}
									>
										{verifying && "Verifying signature..."}
										{!verifying && verifySuccess === true && "Signature valid"}
										{!verifying &&
											verifySuccess === false &&
											"Signature verification failed"}
									</div>
									{!verifying && verifySuccess === false && (
										<p className="text-xs text-rose-200 mt-1">
											Token has been tampered with. Request rejected.
										</p>
									)}
								</div>
							</div>
						</motion.div>
					)}
				</motion.div>
			)}

			{/* Sequence Diagram */}
			{(phase === "logging-in" ||
				phase === "making-request" ||
				phase === "refreshing") && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
				>
					<AuthFlowSequence
						steps={getSteps()}
						currentStep={currentStep}
						actors={["browser", "server", "db"]}
					/>
				</motion.div>
			)}

			{/* Security Callouts */}
			<div className="grid md:grid-cols-2 gap-4">
				<div
					className={`border rounded-lg p-4 ${
						storageType === "localStorage"
							? "bg-rose-500/10 border-rose-500/30"
							: "bg-zinc-900 border-zinc-800"
					}`}
				>
					<h4
						className={`text-sm font-semibold mb-2 ${
							storageType === "localStorage" ? "text-rose-300" : "text-zinc-500"
						}`}
					>
						{storageType === "localStorage" ? "⚠️" : ""} localStorage Storage
					</h4>
					<p
						className={`text-sm ${
							storageType === "localStorage" ? "text-rose-200" : "text-zinc-600"
						}`}
					>
						Vulnerable to XSS attacks. Any JavaScript can access the token.
						Prefer httpOnly cookies.
					</p>
				</div>

				<div
					className={`border rounded-lg p-4 ${
						storageType === "httpOnly"
							? "bg-emerald-500/10 border-emerald-500/30"
							: "bg-zinc-900 border-zinc-800"
					}`}
				>
					<h4
						className={`text-sm font-semibold mb-2 ${
							storageType === "httpOnly" ? "text-emerald-300" : "text-zinc-500"
						}`}
					>
						{storageType === "httpOnly" ? "✓" : ""} httpOnly Cookie
					</h4>
					<p
						className={`text-sm ${
							storageType === "httpOnly" ? "text-emerald-200" : "text-zinc-600"
						}`}
					>
						XSS-safe. JavaScript cannot access. Use SameSite=Strict for CSRF
						protection.
					</p>
				</div>
			</div>

			{/* Code Example */}
			<div>
				<h4 className="text-sm font-semibold text-white mb-3">
					JWT Implementation
				</h4>
				<ShikiCode
					language="typescript"
					code={`import jwt from 'jsonwebtoken'

// Sign JWT on login
app.post('/login', async (req, res) => {
  const user = await validateCredentials(req.body)

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = crypto.randomUUID()
  await db.storeRefreshToken(refreshToken, user.id, '7d')

  res.json({ accessToken, refreshToken })
})

// Verify JWT middleware
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Refresh endpoint
app.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  const session = await db.getRefreshToken(refreshToken)

  if (!session) return res.status(401).json({ error: 'Invalid' })

  // Rotate tokens (one-time use)
  await db.deleteRefreshToken(refreshToken)

  const newAccessToken = jwt.sign(
    { sub: session.userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const newRefreshToken = crypto.randomUUID()
  await db.storeRefreshToken(newRefreshToken, session.userId, '7d')

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
})`}
					className="text-xs"
				/>
			</div>

			{/* Inspect Panel */}
			<InspectPanel
				isOpen={inspecting}
				onClose={() => setInspecting(false)}
				type="token"
				title="JWT Inspector"
				data={{
					header: JWT_HEADER,
					payload: JWT_PAYLOAD,
					signature: JWT_SIGNATURE,
				}}
			/>
		</div>
	);
}
