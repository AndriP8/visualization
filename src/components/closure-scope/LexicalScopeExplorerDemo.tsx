import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

// ─── Data model ──────────────────────────────────────────────────────────────

interface ScopeLayer {
	id: string;
	label: string;
	color: string;
	bgColor: string;
	borderColor: string;
	variables: string[];
}

const SCOPES: ScopeLayer[] = [
	{
		id: "global",
		label: "Global Scope",
		color: "#f59e0b",
		bgColor: "rgba(245,158,11,0.06)",
		borderColor: "rgba(245,158,11,0.35)",
		variables: ["window", "setTimeout", "console"],
	},
	{
		id: "outer",
		label: "outer() — Function Scope",
		color: "#8b5cf6",
		bgColor: "rgba(139,92,246,0.06)",
		borderColor: "rgba(139,92,246,0.35)",
		variables: ["x", "y", "helper"],
	},
	{
		id: "inner",
		label: "inner() — Function Scope",
		color: "#22d3ee",
		bgColor: "rgba(34,211,238,0.06)",
		borderColor: "rgba(34,211,238,0.35)",
		variables: ["z", "result", "x"],
	},
];

// All variables the user can look up — where they live
const LOOKUP_TARGETS: {
	name: string;
	scopeId: string;
	isShadowed?: boolean;
}[] = [
	{ name: "z", scopeId: "inner" },
	{ name: "result", scopeId: "inner" },
	{ name: "x", scopeId: "inner", isShadowed: true }, // inner's x shadows outer's x
	{ name: "y", scopeId: "outer" },
	{ name: "helper", scopeId: "outer" },
	{ name: "window", scopeId: "global" },
	{ name: "console", scopeId: "global" },
	{ name: "secret", scopeId: "NOT_FOUND" }, // triggers ReferenceError
];

type LookupPhase =
	| { kind: "idle" }
	| { kind: "searching"; currentScopeId: string; varName: string }
	| {
			kind: "found";
			foundInScopeId: string;
			varName: string;
			isShadowed?: boolean;
	  }
	| { kind: "error"; varName: string };

// ─── Component ───────────────────────────────────────────────────────────────

export function LexicalScopeExplorerDemo() {
	const [phase, setPhase] = useState<LookupPhase>({ kind: "idle" });
	const [selectedVar, setSelectedVar] = useState<string | null>(null);

	async function runLookup(
		varName: string,
		scopeId: string,
		isShadowed?: boolean,
	) {
		setSelectedVar(varName);

		const scopeOrder = ["inner", "outer", "global"];

		// If target is "NOT_FOUND", traverse all then error
		const targetIdx =
			scopeId === "NOT_FOUND" ? scopeOrder.length : scopeOrder.indexOf(scopeId);

		// Animate up through each scope until we find it
		for (let i = 0; i <= targetIdx; i++) {
			const currentScopeId = scopeOrder[i];

			if (currentScopeId === undefined) break;

			setPhase({ kind: "searching", currentScopeId, varName });
			await sleep(700);

			if (i === targetIdx && scopeId !== "NOT_FOUND") {
				setPhase({
					kind: "found",
					foundInScopeId: scopeId,
					varName,
					isShadowed,
				});
				return;
			}
		}

		// Not found in any scope
		setPhase({ kind: "error", varName });
	}

	function reset() {
		setPhase({ kind: "idle" });
		setSelectedVar(null);
	}

	const activeScopeId =
		phase.kind === "searching"
			? phase.currentScopeId
			: phase.kind === "found"
				? phase.foundInScopeId
				: null;

	return (
		<DemoSection
			title="Demo 1: Lexical Scope Chain Explorer"
			description="Click a variable reference below (from inside the innermost scope). Watch the JS engine walk up the scope chain to find where it's declared."
		>
			{/* Nested Scope Boxes */}
			<div className="mb-6">
				{SCOPES.map((scope, i) => {
					const isActive = activeScopeId === scope.id;
					const isFound =
						phase.kind === "found" && phase.foundInScopeId === scope.id;

					return (
						<div
							key={scope.id}
							className="rounded-xl p-4 transition-all duration-300 relative"
							style={{
								marginLeft: `${i * 20}px`,
								marginTop: i === 0 ? 0 : 8,
								border: `2px solid ${isFound ? scope.color : scope.borderColor}`,
								background: isActive ? `${scope.color}14` : scope.bgColor,
								boxShadow: isFound
									? `0 0 16px 2px ${scope.color}40`
									: undefined,
							}}
						>
							{/* Scope label */}
							<div
								className="text-xs font-semibold mb-2 flex items-center gap-2"
								style={{ color: scope.color }}
							>
								<span
									className="w-2 h-2 rounded-full inline-block"
									style={{ background: scope.color }}
								/>
								{scope.label}
								{isFound && (
									<motion.span
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
										style={{
											background: `${scope.color}22`,
											color: scope.color,
											border: `1px solid ${scope.color}`,
										}}
									>
										✓ Found here
									</motion.span>
								)}
								{isActive && phase.kind === "searching" && (
									<motion.span
										initial={{ opacity: 0, x: -8 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0 }}
										className="absolute right-4 top-4 text-sm"
										style={{ color: scope.color }}
									>
										🔍 Searching…
									</motion.span>
								)}
							</div>

							{/* Variables in this scope */}
							<div className="flex flex-wrap gap-2">
								{scope.variables.map((v) => {
									const isTarget =
										selectedVar === v &&
										(isActive ||
											(isFound && phase.foundInScopeId === scope.id));
									return (
										<span
											key={v}
											className="px-2 py-1 rounded-md text-xs font-mono transition-all duration-200"
											style={{
												border: `1px solid ${isTarget ? scope.color : scope.borderColor}`,
												background: isTarget
													? `${scope.color}22`
													: "transparent",
												color: isTarget ? scope.color : "#a1a1aa",
											}}
										>
											{v}
										</span>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>

			{/* Lookup trigger buttons */}
			<div className="space-y-3">
				<p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
					Inside inner() — click a variable reference to look it up:
				</p>
				<div className="flex flex-wrap gap-2">
					{LOOKUP_TARGETS.map(({ name, scopeId, isShadowed }) => (
						<button
							key={name}
							type="button"
							disabled={phase.kind === "searching"}
							onClick={() => runLookup(name, scopeId, isShadowed)}
							className="px-3 py-1.5 rounded-lg text-xs font-mono border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
							style={
								selectedVar === name
									? {
											color: "#22d3ee",
											borderColor: "rgba(34,211,238,0.5)",
											background: "rgba(34,211,238,0.1)",
										}
									: {
											color: "#a1a1aa",
											borderColor: "#3f3f46",
											background: "transparent",
										}
							}
						>
							{name}
							{scopeId === "NOT_FOUND" && (
								<span className="ml-1 text-red-400">?</span>
							)}
							{isShadowed && (
								<span
									className="ml-1 text-violet-400"
									title="Shadows outer scope"
								>
									🔒
								</span>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Status / result callout */}
			<AnimatePresence mode="wait">
				{phase.kind !== "idle" && (
					<motion.div
						key={phase.kind}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						className="mt-5 p-4 rounded-xl border text-sm"
						style={
							phase.kind === "error"
								? {
										background: "rgba(239,68,68,0.07)",
										borderColor: "rgba(239,68,68,0.3)",
										color: "#fca5a5",
									}
								: phase.kind === "found"
									? {
											background: "rgba(34,197,94,0.07)",
											borderColor: "rgba(34,197,94,0.3)",
											color: "#86efac",
										}
									: {
											background: "rgba(139,92,246,0.07)",
											borderColor: "rgba(139,92,246,0.3)",
											color: "#c4b5fd",
										}
						}
					>
						{phase.kind === "searching" && (
							<>
								<strong>Looking up </strong>
								<code className="font-mono">{phase.varName}</code>
								<strong> in {phase.currentScopeId} scope…</strong>
								<p className="mt-1 text-xs opacity-70">
									JS checks the current scope first. If not found, it walks up
									to the parent — all the way to global.
								</p>
							</>
						)}
						{phase.kind === "found" && (
							<>
								<strong>✓ Found </strong>
								<code className="font-mono">{phase.varName}</code>
								<strong>
									{" "}
									in {SCOPES.find((s) => s.id === phase.foundInScopeId)?.label}
								</strong>
								<p className="mt-1 text-xs opacity-70">
									The scope chain stopped here — the engine returns this binding
									without looking further.
								</p>
								{phase.isShadowed && (
									<p className="mt-2 text-xs bg-violet-500/10 border border-violet-500/30 rounded p-2">
										<strong className="text-violet-300">🔒 Shadowing: </strong>
										There's also an <code className="font-mono">x</code> in the
										outer scope, but it's invisible from inside{" "}
										<code className="font-mono">inner()</code> because the
										lookup stopped at the first match. The outer{" "}
										<code className="font-mono">x</code> is{" "}
										<em className="text-violet-300">shadowed</em>.
									</p>
								)}
							</>
						)}
						{phase.kind === "error" && (
							<>
								<strong>✗ ReferenceError: </strong>
								<code className="font-mono">{phase.varName}</code>
								<strong> is not defined</strong>
								<p className="mt-1 text-xs opacity-70">
									The engine reached the global scope and still found nothing.
									This throws a <code>ReferenceError</code> at runtime.
								</p>
							</>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Reset */}
			{phase.kind !== "idle" && (
				<button
					type="button"
					onClick={reset}
					className="mt-3 px-4 py-2 rounded-lg text-sm bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors"
				>
					↺ Reset
				</button>
			)}

			{/* Key insight */}
			<div className="mt-6 p-4 rounded-lg bg-zinc-800/40 border border-zinc-700/40 text-xs text-zinc-500 space-y-1">
				<p>
					<strong className="text-zinc-300">Lexical scoping</strong> means the
					scope is determined by where a function is{" "}
					<em>written in source code</em>, not where it is called. The nested
					boxes above represent the scope chain as it exists at{" "}
					<strong className="text-violet-400">parse time</strong>.
				</p>
				<p>
					<strong className="text-zinc-300">Shadowing:</strong> when{" "}
					<code className="font-mono">inner()</code> declares its own{" "}
					<code className="font-mono">x</code>, the lookup stops there — the
					outer <code className="font-mono">x</code> becomes <em>shadowed</em>{" "}
					and completely invisible inside{" "}
					<code className="font-mono">inner()</code>. Click the{" "}
					<code className="font-mono">x 🔒</code> button above to see this in
					action.
				</p>
			</div>
		</DemoSection>
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
