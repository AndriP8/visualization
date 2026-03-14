import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContextMode = "trap" | "fix";

// In "trap" mode: one Provider, one merged context value object { theme, user }
// In "fix" mode:  two Providers — ThemeContext and UserContext — split apart

interface Consumer {
	id: string;
	label: string;
	reads: "theme" | "user" | "both";
}

const CONSUMERS: Consumer[] = [
	{ id: "c1", label: "NavBar", reads: "theme" },
	{ id: "c2", label: "Avatar", reads: "user" },
	{ id: "c3", label: "ThemeToggle", reads: "theme" },
	{ id: "c4", label: "ProfileCard", reads: "user" },
	{ id: "c5", label: "Sidebar", reads: "theme" },
	{ id: "c6", label: "Feed", reads: "user" },
];

// ─── Consumer Node ────────────────────────────────────────────────────────────

interface ConsumerNodeProps {
	consumer: Consumer;
	rerenderTarget: "theme" | "user" | null;
	mode: ContextMode;
}

function ConsumerNode({ consumer, rerenderTarget, mode }: ConsumerNodeProps) {
	const willRerender =
		rerenderTarget !== null
			? mode === "trap"
				? true // trap: ALL consumers re-render
				: consumer.reads === rerenderTarget // fix: only matching consumers
			: false;

	const readsBadgeColor =
		consumer.reads === "theme"
			? { bg: "#1e1b4b", border: "#6366f1", text: "#a5b4fc" }
			: { bg: "#042f2e", border: "#0d9488", text: "#5eead4" };

	const flashColor =
		rerenderTarget === "user"
			? { bg: "#042f2e", border: "#10b981", text: "#34d399" }
			: { bg: "#431407", border: "#f97316", text: "#fb923c" };

	const stableColor = { bg: "#18181b", border: "#3f3f46", text: "#71717a" };

	const active = willRerender && rerenderTarget !== null;
	const colors = active ? flashColor : stableColor;

	return (
		<motion.div
			className="rounded-lg border flex flex-col items-center justify-center gap-1 p-2 min-h-15 text-center"
			animate={{
				backgroundColor: colors.bg,
				borderColor: colors.border,
			}}
			transition={{ duration: 0.2 }}
		>
			<span
				className="text-xs font-bold"
				style={{ color: active ? colors.text : "#a1a1aa" }}
			>
				{consumer.label}
			</span>
			<span
				className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
				style={{
					backgroundColor: readsBadgeColor.bg,
					color: readsBadgeColor.text,
					border: `1px solid ${readsBadgeColor.border}`,
				}}
			>
				{consumer.reads === "both" ? "theme + user" : `${consumer.reads}`}
			</span>
			{active && (
				<motion.span
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-[10px] font-medium"
					style={{ color: colors.text }}
				>
					🔄 re-rendered
				</motion.span>
			)}
			{!active && rerenderTarget !== null && mode === "fix" && (
				<motion.span
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-[10px] text-zinc-600"
				>
					✓ skipped
				</motion.span>
			)}
		</motion.div>
	);
}

// ─── Provider Box ─────────────────────────────────────────────────────────────

interface ProviderBoxProps {
	label: string;
	borderColor: string;
	bgColor: string;
	textColor: string;
	isActive: boolean;
	children: React.ReactNode;
}

function ProviderBox({
	label,
	borderColor,
	bgColor,
	textColor,
	isActive,
	children,
}: ProviderBoxProps) {
	return (
		<motion.div
			className="rounded-xl border-2 p-3 space-y-2"
			animate={{ borderColor: isActive ? borderColor : "#3f3f46" }}
			transition={{ duration: 0.2 }}
			style={{ backgroundColor: bgColor }}
		>
			<div className="flex items-center gap-2">
				<motion.span
					className="w-2 h-2 rounded-full"
					animate={{ backgroundColor: isActive ? borderColor : "#52525b" }}
					transition={{ duration: 0.2 }}
				/>
				<span
					className="text-xs font-mono font-semibold"
					style={{ color: isActive ? textColor : "#71717a" }}
				>
					{label}
				</span>
				{isActive && (
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-[10px]"
						style={{ color: textColor }}
					>
						value changed!
					</motion.span>
				)}
			</div>
			<div className="grid grid-cols-3 gap-1.5">{children}</div>
		</motion.div>
	);
}

// ─── Main Demo ────────────────────────────────────────────────────────────────

export function ContextRerenderDemo() {
	const [mode, setMode] = useState<ContextMode>("trap");
	const [rerenderTarget, setRerenderTarget] = useState<"theme" | "user" | null>(
		null,
	);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const triggerUpdate = useCallback((field: "theme" | "user") => {
		if (timerRef.current) clearTimeout(timerRef.current);
		setRerenderTarget(field);
		timerRef.current = setTimeout(() => setRerenderTarget(null), 1500);
	}, []);

	const rerenderedCount: number =
		rerenderTarget !== null
			? mode === "trap"
				? CONSUMERS.length
				: CONSUMERS.filter((c) => c.reads === rerenderTarget).length
			: 0;

	return (
		<DemoSection
			title="Demo 3: Context Re-render Trap & Fix"
			description="Every context consumer re-renders when the context value's reference changes — even if the part it reads didn't change. The fix: split your context into smaller, focused providers."
		>
			{/* Mode toggle */}
			<div className="flex gap-2 mb-5">
				{(["trap", "fix"] as const).map((m) => (
					<button
						key={m}
						type="button"
						onClick={() => {
							setMode(m);
							setRerenderTarget(null);
						}}
						className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
						style={
							mode === m
								? {
										backgroundColor: m === "trap" ? "#450a0a" : "#052e16",
										color: m === "trap" ? "#f87171" : "#34d399",
										border: `1px solid ${m === "trap" ? "#dc2626" : "#10b981"}`,
									}
								: {
										backgroundColor: "#27272a",
										color: "#71717a",
										border: "1px solid #3f3f46",
									}
						}
					>
						{m === "trap"
							? "🪤 Trap (merged context)"
							: "✅ Fix (split context)"}
					</button>
				))}
			</div>

			{/* Trigger buttons */}
			<div className="flex gap-2 mb-5">
				<button
					type="button"
					onClick={() => triggerUpdate("user")}
					className="px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 transition-colors"
				>
					Change user field
				</button>
				<button
					type="button"
					onClick={() => triggerUpdate("theme")}
					className="px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-colors"
				>
					Change theme field
				</button>
			</div>

			{/* Counter */}
			<AnimatePresence>
				{rerenderTarget !== null && (
					<motion.div
						key={`${rerenderTarget}-${mode}`}
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="mb-4 px-3 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2"
						style={
							mode === "trap"
								? {
										backgroundColor: "#450a0a44",
										borderColor: "#dc262644",
										color: "#f87171",
									}
								: {
										backgroundColor: "#05202044",
										borderColor: "#10b98144",
										color: "#34d399",
									}
						}
					>
						{mode === "trap" ? "⚠️" : "✅"}
						<span>
							<strong>{rerenderedCount}</strong> of {CONSUMERS.length} consumers
							re-rendered
							{mode === "fix" && (
								<span className="text-zinc-500 font-normal">
									{" "}
									(only those that read{" "}
									<code className="text-teal-400">{rerenderTarget}</code>)
								</span>
							)}
						</span>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Tree */}
			{mode === "trap" ? (
				<ProviderBox
					label="<AppContext.Provider value={{ theme, user }}>"
					borderColor="#f97316"
					bgColor="#1c1008"
					textColor="#fb923c"
					isActive={rerenderTarget !== null}
				>
					{CONSUMERS.map((c) => (
						<ConsumerNode
							key={c.id}
							consumer={c}
							rerenderTarget={rerenderTarget}
							mode="trap"
						/>
					))}
				</ProviderBox>
			) : (
				<div className="space-y-3">
					<ProviderBox
						label="<ThemeContext.Provider value={theme}>"
						borderColor="#f97316"
						bgColor="#1c1008"
						textColor="#fb923c"
						isActive={rerenderTarget === "theme"}
					>
						{CONSUMERS.filter((c) => c.reads === "theme").map((c) => (
							<ConsumerNode
								key={c.id}
								consumer={c}
								rerenderTarget={rerenderTarget}
								mode="fix"
							/>
						))}
					</ProviderBox>
					<ProviderBox
						label="<UserContext.Provider value={user}>"
						borderColor="#0d9488"
						bgColor="#041c1a"
						textColor="#5eead4"
						isActive={rerenderTarget === "user"}
					>
						{CONSUMERS.filter((c) => c.reads === "user").map((c) => (
							<ConsumerNode
								key={c.id}
								consumer={c}
								rerenderTarget={rerenderTarget}
								mode="fix"
							/>
						))}
					</ProviderBox>
				</div>
			)}

			{/* Key insight */}
			<div className="mt-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-400 space-y-1.5">
				<p>
					<span className="text-red-400 font-semibold">🪤 The Trap:</span> When
					you pass an object like{" "}
					<code className="text-orange-300">{"{ theme, user }"}</code> as
					context value, a new object reference is created on every render of
					the Provider's parent. React compares by reference (not deep
					equality), so every consumer sees a "new" value and re-renders — even
					those that only care about{" "}
					<code className="text-orange-300">theme</code>.
				</p>
				<p>
					<span className="text-green-400 font-semibold">✅ The Fix:</span>{" "}
					Split into separate contexts. Each Provider only carries the value its
					consumers actually need. You can also stabilise the value with{" "}
					<code className="text-cyan-300">useMemo</code> to prevent unnecessary
					re-renders when the parent re-renders but the context data hasn't
					changed.
				</p>
			</div>
		</DemoSection>
	);
}
