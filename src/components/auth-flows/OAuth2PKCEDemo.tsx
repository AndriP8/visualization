import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";
import { AuthFlowSequence } from "./AuthFlowSequence";
import { InspectPanel } from "./InspectPanel";
import type { SequenceStep } from "./types";

type Phase =
	| "idle"
	| "generating-pkce"
	| "redirecting"
	| "authorizing"
	| "exchanging"
	| "fetching-profile"
	| "complete";

const CODE_VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CODE_CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
const STATE = "xyz789";
const AUTH_CODE = "4/0AY0e-g7...";
const ACCESS_TOKEN = "ya29.a0AfH6...";

const PHASE_COLORS: Record<
	string,
	{
		bg: string;
		bgActive: string;
		border: string;
		borderActive: string;
		text: string;
		textActive: string;
	}
> = {
	violet: {
		bg: "rgba(167, 139, 250, 0.2)",
		bgActive: "rgba(167, 139, 250, 0.3)",
		border: "rgba(167, 139, 250, 0.5)",
		borderActive: "#a78bfa",
		text: "#c4b5fd",
		textActive: "#ddd6fe",
	},
	rose: {
		bg: "rgba(251, 113, 133, 0.2)",
		bgActive: "rgba(251, 113, 133, 0.3)",
		border: "rgba(251, 113, 133, 0.5)",
		borderActive: "#fb7185",
		text: "#fda4af",
		textActive: "#fecdd3",
	},
	cyan: {
		bg: "rgba(34, 211, 238, 0.2)",
		bgActive: "rgba(34, 211, 238, 0.3)",
		border: "rgba(34, 211, 238, 0.5)",
		borderActive: "#22d3ee",
		text: "#67e8f9",
		textActive: "#a5f3fc",
	},
	emerald: {
		bg: "rgba(52, 211, 153, 0.2)",
		bgActive: "rgba(52, 211, 153, 0.3)",
		border: "rgba(52, 211, 153, 0.5)",
		borderActive: "#34d399",
		text: "#6ee7b7",
		textActive: "#a7f3d0",
	},
};

export function OAuth2PKCEDemo() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [currentStep, setCurrentStep] = useState(-1);
	const [inspecting, setInspecting] = useState(false);
	const [urlBar, setUrlBar] = useState("");
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

	const pkceSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "browser",
			label: "Generate code_verifier",
			color: "violet",
			data: [
				{ key: "code_verifier", value: `${CODE_VERIFIER.slice(0, 30)}...` },
			],
		},
		{
			from: "browser",
			to: "browser",
			label: "SHA256 → code_challenge",
			color: "cyan",
			data: [{ key: "code_challenge", value: CODE_CHALLENGE }],
		},
	];

	const authSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "oauth-provider",
			label: "Redirect to /authorize",
			color: "rose",
			data: [
				{ key: "client_id", value: "your-app" },
				{ key: "code_challenge", value: `${CODE_CHALLENGE.slice(0, 20)}...` },
				{ key: "state", value: STATE },
			],
		},
		{
			from: "oauth-provider",
			to: "oauth-provider",
			label: "User approves scopes",
			color: "rose",
		},
		{
			from: "oauth-provider",
			to: "browser",
			label: "Redirect with code + state",
			color: "rose",
			data: [
				{ key: "code", value: AUTH_CODE },
				{ key: "state", value: STATE },
			],
		},
	];

	const exchangeSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "server",
			label: "Send auth code",
			color: "cyan",
			data: [{ key: "code", value: AUTH_CODE }],
		},
		{
			from: "server",
			to: "oauth-provider",
			label: "POST /token",
			color: "rose",
			data: [
				{ key: "code", value: AUTH_CODE },
				{ key: "code_verifier", value: `${CODE_VERIFIER.slice(0, 25)}...` },
			],
		},
		{
			from: "oauth-provider",
			to: "oauth-provider",
			label: "Verify PKCE",
			color: "rose",
		},
		{
			from: "oauth-provider",
			to: "server",
			label: "Return access_token",
			color: "rose",
			data: [{ key: "access_token", value: ACCESS_TOKEN }],
		},
		{
			from: "server",
			to: "browser",
			label: "Set session/token",
			color: "cyan",
		},
	];

	const profileSteps: SequenceStep[] = [
		{
			from: "browser",
			to: "server",
			label: "Request profile",
			color: "cyan",
		},
		{
			from: "server",
			to: "resource-api",
			label: "GET /userinfo",
			color: "emerald",
			data: [
				{
					key: "Authorization",
					value: `Bearer ${ACCESS_TOKEN.slice(0, 15)}...`,
				},
			],
		},
		{
			from: "resource-api",
			to: "server",
			label: "User profile",
			color: "emerald",
			data: [
				{ key: "email", value: "user@example.com" },
				{ key: "name", value: "John Doe" },
			],
		},
		{
			from: "server",
			to: "browser",
			label: "Profile data",
			color: "cyan",
		},
	];

	const handleStart = useCallback(() => {
		clearTimeouts();
		setPhase("generating-pkce");
		setCurrentStep(-1);
		setUrlBar("https://yourapp.com");

		// PKCE generation
		for (let i = 0; i <= pkceSteps.length - 1; i++) {
			schedule(() => setCurrentStep(i), i * 800);
		}

		schedule(() => {
			setPhase("redirecting");
			setCurrentStep(-1);
			setUrlBar(
				"https://accounts.google.com/o/oauth2/v2/auth?client_id=...&code_challenge=...",
			);
		}, pkceSteps.length * 800);

		// Authorization
		const authDelay = pkceSteps.length * 800;
		for (let i = 0; i <= authSteps.length - 1; i++) {
			schedule(() => setCurrentStep(i), authDelay + i * 800);
		}

		schedule(
			() => {
				setPhase("exchanging");
				setCurrentStep(-1);
				setUrlBar(
					"https://yourapp.com/callback?code=4/0AY0e-g7...&state=xyz789",
				);
			},
			authDelay + authSteps.length * 800,
		);

		// Token exchange
		const exchangeDelay = authDelay + authSteps.length * 800;
		for (let i = 0; i <= exchangeSteps.length - 1; i++) {
			schedule(() => setCurrentStep(i), exchangeDelay + i * 800);
		}

		schedule(
			() => {
				setPhase("fetching-profile");
				setCurrentStep(-1);
			},
			exchangeDelay + exchangeSteps.length * 800,
		);

		// Profile fetch
		const profileDelay = exchangeDelay + exchangeSteps.length * 800;
		for (let i = 0; i <= profileSteps.length - 1; i++) {
			schedule(() => setCurrentStep(i), profileDelay + i * 800);
		}

		schedule(
			() => {
				setPhase("complete");
				setUrlBar("https://yourapp.com/dashboard");
			},
			profileDelay + profileSteps.length * 800,
		);
	}, [
		clearTimeouts,
		schedule,
		pkceSteps.length,
		authSteps.length,
		exchangeSteps.length,
		profileSteps.length,
	]);

	const handleReset = useCallback(() => {
		clearTimeouts();
		setPhase("idle");
		setCurrentStep(-1);
		setUrlBar("");
	}, [clearTimeouts]);

	const getSteps = (): SequenceStep[] => {
		if (phase === "generating-pkce") return pkceSteps;
		if (phase === "redirecting" || phase === "authorizing") return authSteps;
		if (phase === "exchanging") return exchangeSteps;
		if (phase === "fetching-profile") return profileSteps;
		return [];
	};

	const getActors = () => {
		if (phase === "generating-pkce") return ["browser"];
		if (phase === "redirecting" || phase === "authorizing")
			return ["browser", "oauth-provider"];
		if (phase === "exchanging") return ["browser", "server", "oauth-provider"];
		if (phase === "fetching-profile")
			return ["browser", "server", "resource-api"];
		return [];
	};

	return (
		<div className="space-y-8">
			{/* Controls */}
			<div className="flex flex-wrap items-center gap-4">
				{phase === "idle" && (
					<button
						type="button"
						onClick={handleStart}
						className="px-6 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors flex items-center gap-2"
					>
						<span className="text-lg">🔐</span>
						<span>Login with Google</span>
					</button>
				)}
				{phase === "complete" && (
					<button
						type="button"
						onClick={handleReset}
						className="px-6 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
					>
						Reset Demo
					</button>
				)}
			</div>

			{/* URL Bar */}
			{urlBar && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
				>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5">
							<div className="w-3 h-3 rounded-full bg-rose-500" />
							<div className="w-3 h-3 rounded-full bg-amber-500" />
							<div className="w-3 h-3 rounded-full bg-emerald-500" />
						</div>
						<div className="flex-1 bg-zinc-800 rounded px-3 py-2">
							<div className="font-mono text-xs text-zinc-300 truncate">
								{urlBar}
							</div>
						</div>
					</div>
				</motion.div>
			)}

			{/* Phase Indicators */}
			{phase !== "idle" && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="flex flex-wrap gap-2"
				>
					{[
						{
							key: "generating-pkce",
							label: "1. Generate PKCE",
							color: "violet",
						},
						{
							key: "redirecting",
							label: "2. Redirect to Google",
							color: "rose",
						},
						{ key: "exchanging", label: "3. Exchange Code", color: "cyan" },
						{
							key: "fetching-profile",
							label: "4. Fetch Profile",
							color: "emerald",
						},
						{ key: "complete", label: "5. Complete", color: "emerald" },
					].map((step) => {
						const isPast =
							[
								"generating-pkce",
								"redirecting",
								"exchanging",
								"fetching-profile",
								"complete",
							].indexOf(phase) >
							[
								"generating-pkce",
								"redirecting",
								"exchanging",
								"fetching-profile",
								"complete",
							].indexOf(step.key as Phase);
						const isCurrent = phase === step.key;
						const colors = PHASE_COLORS[step.color];
						return (
							<div
								key={step.key}
								className={`px-3 py-1.5 rounded-full text-xs font-medium border ${isCurrent ? "animate-pulse" : ""}`}
								style={{
									backgroundColor:
										isPast || isCurrent
											? isCurrent
												? colors.bgActive
												: colors.bg
											: "#27272a",
									borderColor:
										isPast || isCurrent
											? isCurrent
												? colors.borderActive
												: colors.border
											: "#3f3f46",
									color:
										isPast || isCurrent
											? isCurrent
												? colors.textActive
												: colors.text
											: "#71717a",
								}}
							>
								{step.label}
							</div>
						);
					})}
				</motion.div>
			)}

			{/* PKCE Visual */}
			{(phase === "generating-pkce" || phase === "redirecting") && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
				>
					<h4 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
						<span>PKCE Parameters</span>
						<button
							type="button"
							onClick={() => setInspecting(true)}
							className="text-xs text-amber-400 hover:text-amber-300 underline"
						>
							Inspect
						</button>
					</h4>
					<div className="space-y-3">
						<div className="bg-zinc-800 border border-amber-500/30 rounded p-3">
							<div className="text-xs text-zinc-500 mb-1">code_verifier</div>
							<div className="font-mono text-xs text-amber-300 break-all">
								{CODE_VERIFIER}
							</div>
							<div className="text-xs text-zinc-600 mt-1">
								Random string (stored in browser)
							</div>
						</div>
						<div className="flex items-center justify-center">
							<div className="text-cyan-400">↓ SHA256</div>
						</div>
						<div className="bg-zinc-800 border border-cyan-500/30 rounded p-3">
							<div className="text-xs text-zinc-500 mb-1">code_challenge</div>
							<div className="font-mono text-xs text-cyan-300 break-all">
								{CODE_CHALLENGE}
							</div>
							<div className="text-xs text-zinc-600 mt-1">
								Sent to OAuth provider (S256 method)
							</div>
						</div>
					</div>
				</motion.div>
			)}

			{/* Consent Screen Mockup */}
			{phase === "redirecting" && currentStep === 1 && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="bg-zinc-900 border-2 border-rose-500/30 rounded-lg p-6 max-w-md mx-auto"
				>
					<div className="text-center mb-4">
						<div className="text-4xl mb-2">G</div>
						<h3 className="text-lg font-semibold text-white">
							Sign in with Google
						</h3>
					</div>
					<div className="bg-zinc-800 border border-zinc-700 rounded p-4 mb-4">
						<div className="text-xs text-zinc-500 mb-2">
							YourApp wants to access:
						</div>
						<div className="space-y-1.5 text-sm">
							<div className="flex items-center gap-2 text-zinc-300">
								<span>✓</span>
								<span>View your email address</span>
							</div>
							<div className="flex items-center gap-2 text-zinc-300">
								<span>✓</span>
								<span>View your basic profile info</span>
							</div>
						</div>
					</div>
					<div className="flex gap-3">
						<button
							type="button"
							className="flex-1 px-4 py-2 rounded bg-zinc-700 text-zinc-400 text-sm"
							disabled
						>
							Cancel
						</button>
						<button
							type="button"
							className="flex-1 px-4 py-2 rounded bg-rose-500 text-white text-sm font-medium animate-pulse"
							disabled
						>
							Allow
						</button>
					</div>
				</motion.div>
			)}

			{/* Sequence Diagram */}
			{phase !== "idle" && phase !== "complete" && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
				>
					<AuthFlowSequence
						steps={getSteps()}
						currentStep={currentStep}
						actors={
							getActors() as (
								| "browser"
								| "server"
								| "db"
								| "oauth-provider"
								| "resource-api"
							)[]
						}
					/>
				</motion.div>
			)}

			{/* Success State */}
			{phase === "complete" && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6"
				>
					<div className="text-center">
						<div className="text-4xl mb-3">✓</div>
						<h3 className="text-lg font-semibold text-emerald-300 mb-2">
							Authentication Complete
						</h3>
						<p className="text-sm text-emerald-200">
							User successfully authenticated via Google OAuth 2.0 with PKCE
						</p>
					</div>
				</motion.div>
			)}

			{/* Security Callouts */}
			<div className="space-y-3">
				<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
					<h4 className="text-sm font-semibold text-emerald-300 mb-2">
						✓ PKCE Security
					</h4>
					<p className="text-sm text-emerald-200">
						PKCE prevents authorization code interception attacks. Required for
						SPAs since OAuth 2.1 (2019). The verifier stays on the client, only
						the challenge is sent to the provider.
					</p>
				</div>
				<div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
					<h4 className="text-sm font-semibold text-cyan-300 mb-2">
						State Parameter
					</h4>
					<p className="text-sm text-cyan-200">
						The state parameter protects against CSRF attacks by ensuring the
						authorization response matches the original request.
					</p>
				</div>
			</div>

			{/* Code Example */}
			<div>
				<h4 className="text-sm font-semibold text-white mb-3">
					OAuth 2.0 + PKCE Implementation
				</h4>
				<ShikiCode
					language="typescript"
					code={`import crypto from 'crypto'

// 1. Generate PKCE parameters (browser)
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')

  return { verifier, challenge }
}

// 2. Redirect to OAuth provider
const { verifier, challenge } = generatePKCE()
sessionStorage.setItem('pkce_verifier', verifier)

const state = crypto.randomBytes(16).toString('hex')
sessionStorage.setItem('oauth_state', state)

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', 'your-client-id')
authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback')
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', 'email profile')
authUrl.searchParams.set('code_challenge', challenge)
authUrl.searchParams.set('code_challenge_method', 'S256')
authUrl.searchParams.set('state', state)

window.location.href = authUrl.toString()

// 3. Exchange code for token (backend)
app.get('/callback', async (req, res) => {
  const { code, state } = req.query

  // Verify state (CSRF protection)
  if (state !== sessionStorage.getItem('oauth_state')) {
    return res.status(400).send('Invalid state')
  }

  const verifier = sessionStorage.getItem('pkce_verifier')

  // Exchange authorization code
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: 'your-client-id',
      client_secret: 'your-client-secret',
      redirect_uri: 'https://yourapp.com/callback',
      grant_type: 'authorization_code',
      code_verifier: verifier
    })
  })

  const { access_token } = await tokenResponse.json()

  // Fetch user profile
  const profile = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: \`Bearer \${access_token}\` }
  }).then(r => r.json())

  // Create session for user
  req.session.userId = profile.id
  res.redirect('/dashboard')
})`}
					className="text-xs"
				/>
			</div>

			{/* Inspect Panel */}
			<InspectPanel
				isOpen={inspecting}
				onClose={() => setInspecting(false)}
				type="pkce"
				title="PKCE Inspector"
				data={{
					code_verifier: CODE_VERIFIER,
					code_challenge: CODE_CHALLENGE,
					method: "S256 (SHA256)",
				}}
			/>
		</div>
	);
}
