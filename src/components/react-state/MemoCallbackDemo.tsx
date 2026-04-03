import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { useColorScheme } from "../../hooks/useColorScheme";
import { THEME_COLORS } from "../../theme/tokens";
import { DemoSection } from "../shared/DemoSection";

// ─── Types ────────────────────────────────────────────────────────────────────

type CallbackMode = "without" | "with";

interface Dep {
	name: string;
	value: string;
	changed: boolean;
}

// ─── Dep Badge ────────────────────────────────────────────────────────────────

function DepBadge({ dep }: { dep: Dep }) {
	const t = THEME_COLORS[useColorScheme()];
	return (
		<motion.div
			className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono"
			animate={{
				backgroundColor: dep.changed ? "#450a0a" : t.svgBg,
				borderColor: dep.changed ? "#dc2626" : t.svgBorder,
				color: dep.changed ? "#fca5a5" : t.svgTextMuted,
			}}
			transition={{ duration: 0.25 }}
		>
			<motion.span
				className="w-2 h-2 rounded-full flex-shrink-0"
				animate={{ backgroundColor: dep.changed ? "#dc2626" : t.svgBorder }}
				transition={{ duration: 0.25 }}
			/>
			<span className="text-text-muted">{dep.name}:</span>
			<span className="font-semibold">{dep.value}</span>
			{dep.changed && (
				<motion.span
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					className="ml-1 text-accent-red-soft font-bold"
				>
					↑ changed
				</motion.span>
			)}
		</motion.div>
	);
}

// ─── Link Line ────────────────────────────────────────────────────────────────

interface LinkLineProps {
	broken: boolean;
	isActive: boolean;
}

function LinkLine({ broken, isActive }: LinkLineProps) {
	if (!isActive) {
		return (
			<div className="flex items-center justify-center py-2">
				<div className="flex-1 h-px bg-surface-tertiary" />
				<span className="mx-2 text-xs text-text-faint font-mono">
					callback prop
				</span>
				<div className="flex-1 h-px bg-surface-tertiary" />
			</div>
		);
	}

	if (broken) {
		return (
			<div className="flex items-center justify-center py-2">
				<motion.div
					className="flex-1 h-0.5"
					animate={{ backgroundColor: "#dc2626", opacity: [1, 0.3, 1] }}
					transition={{ duration: 0.4, repeat: 3 }}
				/>
				<motion.span
					className="mx-2 text-xs font-mono font-bold text-accent-red-soft"
					animate={{ scale: [1, 1.2, 1] }}
					transition={{ duration: 0.4, repeat: 3 }}
				>
					⚡ new ref!
				</motion.span>
				<motion.div
					className="flex-1 h-0.5 bg-red-500"
					animate={{ backgroundColor: "#dc2626", opacity: [1, 0.3, 1] }}
					transition={{ duration: 0.4, repeat: 3 }}
				/>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center py-2">
			<motion.div
				className="flex-1 h-0.5"
				animate={{ backgroundColor: "#22c55e" }}
				transition={{ duration: 0.3 }}
			/>
			<motion.span
				className="mx-2 text-xs font-mono font-bold text-accent-green-soft"
				initial={{ scale: 0.8 }}
				animate={{ scale: 1 }}
			>
				✓ same ref
			</motion.span>
			<motion.div
				className="flex-1 h-0.5"
				animate={{ backgroundColor: "#22c55e" }}
				transition={{ duration: 0.3 }}
			/>
		</div>
	);
}

// ─── Component Box ─────────────────────────────────────────────────────────────

interface ComponentBoxProps {
	name: string;
	subtitle: string;
	isFlashing: boolean;
	isSkipped: boolean;
	isActive: boolean;
	borderColorFlash: string;
	bgColorFlash: string;
	textColorFlash: string;
}

function ComponentBox({
	name,
	subtitle,
	isFlashing,
	isSkipped,
	isActive,
	borderColorFlash,
	bgColorFlash,
	textColorFlash,
}: ComponentBoxProps) {
	const t = THEME_COLORS[useColorScheme()];
	const active = isFlashing || isSkipped;
	const borderColor = active ? borderColorFlash : t.svgBorder;
	const bgColor = active ? bgColorFlash : t.svgBg;
	const textColor = active ? textColorFlash : t.svgText;

	return (
		<motion.div
			className="rounded-xl border-2 p-4 flex flex-col items-center gap-1 min-h-[80px] justify-center"
			animate={{ borderColor, backgroundColor: bgColor }}
			transition={{ duration: 0.2 }}
		>
			<span
				className="font-mono font-bold text-sm"
				style={{ color: textColor }}
			>
				{name}
			</span>
			<span className="text-xs text-text-faint">{subtitle}</span>
			<AnimatePresence mode="wait">
				{isFlashing && isActive && (
					<motion.span
						key="flash"
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="text-xs font-semibold mt-1"
						style={{ color: textColorFlash }}
					>
						🔄 re-rendering
					</motion.span>
				)}
				{isSkipped && isActive && (
					<motion.span
						key="skip"
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="text-xs font-semibold mt-1 text-accent-green-soft"
					>
						✓ skipped (memo held)
					</motion.span>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

// ─── Main Demo ────────────────────────────────────────────────────────────────

// Simulated deps state
interface DepsState {
	count: number; // changes on each parent render
	step: number; // stays stable  (never changes in this demo)
}

export function MemoCallbackDemo() {
	const t = THEME_COLORS[useColorScheme()];
	const [callbackMode, setCallbackMode] = useState<CallbackMode>("without");
	const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
	const [deps, setDeps] = useState<DepsState>({ count: 0, step: 1 });
	const [prevDeps, setPrevDeps] = useState<DepsState>({ count: 0, step: 1 });
	const [parentFlash, setParentFlash] = useState(false);
	const [childFlash, setChildFlash] = useState(false);
	const [childSkipped, setChildSkipped] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimers = useCallback(() => {
		for (const t of timerRef.current) clearTimeout(t);
		timerRef.current = [];
	}, []);

	const triggerRender = useCallback(() => {
		if (phase === "running") return;
		clearTimers();

		const newDeps: DepsState = { count: deps.count + 1, step: deps.step };
		setPrevDeps(deps);
		setDeps(newDeps);
		setPhase("running");
		setParentFlash(false);
		setChildFlash(false);
		setChildSkipped(false);

		// T=0: parent flashes
		const t1 = setTimeout(() => setParentFlash(true), 0);
		// T=300: link / child animation
		const t2 = setTimeout(() => {
			setParentFlash(false);
			if (callbackMode === "without") {
				// new function ref → child re-renders
				setChildFlash(true);
			} else {
				// deps [count] changed → new ref (if count in deps); but here we demonstrate
				// useCallback with [step] as dep (step is stable) → same ref → child skipped
				setChildSkipped(true);
			}
		}, 400);

		const t3 = setTimeout(() => {
			setChildFlash(false);
			setChildSkipped(false);
			setPhase("done");
		}, 1400);

		timerRef.current = [t1, t2, t3];
	}, [phase, deps, callbackMode, clearTimers]);

	const reset = useCallback(() => {
		clearTimers();
		setPhase("idle");
		setParentFlash(false);
		setChildFlash(false);
		setChildSkipped(false);
		setDeps({ count: 0, step: 1 });
		setPrevDeps({ count: 0, step: 1 });
	}, [clearTimers]);

	// Build dep badges for the dependency array visualizer
	const depBadges: Dep[] =
		callbackMode === "without"
			? [] // no useCallback — no dep array
			: [
					{
						name: "step",
						value: String(deps.step),
						changed: prevDeps.step !== deps.step,
					},
				];

	const withoutCodeSnippet = `// ❌ Without useCallback
function Parent() {
  const [count, setCount] = useState(0);

  // New function object on EVERY render
  const handleClick = () => console.log(count);

  return <MemoChild onClick={handleClick} />;
}`;

	const withCodeSnippet = `// ✅ With useCallback
function Parent() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  // Same reference as long as 'step' hasn't changed
  const handleClick = useCallback(() => {
    console.log(step);
  }, [step]); // ← dep array

  return <MemoChild onClick={handleClick} />;
}`;

	const isActive = phase !== "idle";
	const linkBroken = callbackMode === "without";

	return (
		<DemoSection
			title="Demo 4: useCallback & Reference Stability"
			description="React.memo compares props by reference. Without useCallback, every parent render creates a NEW function object — memo is invalidated. With useCallback and stable deps, the reference stays the same — memo holds and the child is skipped."
		>
			{/* Mode toggle */}
			<div className="flex gap-2 mb-6">
				<button
					type="button"
					onClick={() => {
						setCallbackMode("without");
						reset();
					}}
					className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
					style={
						callbackMode === "without"
							? {
									backgroundColor: "#450a0a",
									color: "#f87171",
									border: "1px solid #dc2626",
								}
							: {
									backgroundColor: t.svgBg,
									color: t.svgTextMuted,
									border: `1px solid ${t.svgBorder}`,
								}
					}
				>
					❌ Without useCallback
				</button>
				<button
					type="button"
					onClick={() => {
						setCallbackMode("with");
						reset();
					}}
					className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
					style={
						callbackMode === "with"
							? {
									backgroundColor: "#052e16",
									color: "#4ade80",
									border: "1px solid #16a34a",
								}
							: {
									backgroundColor: t.svgBg,
									color: t.svgTextMuted,
									border: `1px solid ${t.svgBorder}`,
								}
					}
				>
					✅ With useCallback
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left: component diagram */}
				<div className="space-y-2">
					<ComponentBox
						name="<Parent />"
						subtitle="calls setState on re-render"
						isFlashing={parentFlash}
						isSkipped={false}
						isActive={isActive}
						borderColorFlash="#f97316"
						bgColorFlash="#431407"
						textColorFlash="#fb923c"
					/>

					<LinkLine broken={linkBroken} isActive={isActive && !parentFlash} />

					<ComponentBox
						name="<MemoChild />"
						subtitle="wrapped in React.memo"
						isFlashing={childFlash}
						isSkipped={childSkipped}
						isActive={isActive}
						borderColorFlash={linkBroken ? "#f97316" : "#22c55e"}
						bgColorFlash={linkBroken ? "#431407" : "#052e16"}
						textColorFlash={linkBroken ? "#fb923c" : "#4ade80"}
					/>

					{/* Controls */}
					<div className="flex gap-2 pt-3">
						<button
							type="button"
							onClick={triggerRender}
							disabled={phase === "running"}
							className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-violet-500/10 text-accent-violet border border-violet-500/30 hover:bg-violet-500/20 transition-colors disabled:opacity-40"
						>
							{phase === "running" ? "Running…" : "▶ Re-render Parent"}
						</button>
						<button
							type="button"
							onClick={reset}
							className="px-3 py-2 rounded-md text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors"
						>
							Reset
						</button>
					</div>

					{/* Dep array visualizer */}
					{callbackMode === "with" && (
						<div className="mt-3 p-3 rounded-lg bg-surface-primary border border-border-primary">
							<p className="text-xs text-text-muted mb-2 font-mono">
								useCallback deps:{" "}
								<code className="text-accent-violet-soft">[step]</code>
							</p>
							<div className="flex flex-wrap gap-2">
								{depBadges.map((dep) => (
									<DepBadge key={dep.name} dep={dep} />
								))}
							</div>
							{deps.count > 0 && (
								<p className="text-[11px] text-text-faint mt-2">
									<code className="text-text-tertiary">count</code> changed (
									{prevDeps.count} → {deps.count}) but it's <em>not</em> in the
									dep array — irrelevant to the callback.{" "}
									<code className="text-text-tertiary">step</code> = {deps.step}{" "}
									(stable) → same function ref.
								</p>
							)}
						</div>
					)}
				</div>

				{/* Right: code snippet */}
				<div className="rounded-xl bg-surface-base border border-border-primary overflow-hidden">
					<div className="px-4 py-2 border-b border-border-primary flex items-center gap-2">
						<span
							className="w-2 h-2 rounded-full"
							style={{
								backgroundColor:
									callbackMode === "without" ? "#dc2626" : "#16a34a",
							}}
						/>
						<span className="text-xs text-text-muted font-mono">
							{callbackMode === "without"
								? "without-callback.tsx"
								: "with-callback.tsx"}
						</span>
					</div>
					<pre className="text-xs font-mono text-text-tertiary p-4 overflow-x-auto whitespace-pre leading-relaxed">
						{callbackMode === "without" ? withoutCodeSnippet : withCodeSnippet}
					</pre>
				</div>
			</div>

			{/* Key insight */}
			<div className="mt-4 p-3 rounded-lg bg-surface-secondary/50 border border-border-secondary/50 text-xs text-text-tertiary space-y-1.5">
				<p>
					<span className="text-accent-red-soft font-semibold">
						❌ Without useCallback:
					</span>{" "}
					Every time the parent renders, JavaScript evaluates{" "}
					<code className="text-accent-orange">{"() => {}"}</code> and creates a{" "}
					<strong>new function object</strong>. Two function references are
					never equal (
					<code className="text-accent-orange">
						{"(() => {}) === (() => {})"}
					</code>{" "}
					is <code>false</code>). React.memo sees a changed prop → child
					re-renders.
				</p>
				<p>
					<span className="text-accent-green-soft font-semibold">
						✅ With useCallback:
					</span>{" "}
					React memoizes the function and only creates a new reference when the
					specified dependencies change. If deps are stable,{" "}
					<code className="text-accent-green">
						{"handleClick === handleClick"}
					</code>{" "}
					across renders → memo holds.
				</p>
				<p>
					<span className="text-accent-yellow-soft font-semibold">
						⚠️ Pitfall:
					</span>{" "}
					Including the wrong deps (or omitting needed ones) leads to stale
					closures or unnecessary re-creation. Always list every reactive value
					the callback reads.
				</p>
			</div>
		</DemoSection>
	);
}
