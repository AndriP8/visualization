import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

// ─── Variants ────────────────────────────────────────────────────────────────

type FixVariant = "var" | "let" | "iife" | "foreach";

interface Variant {
	id: FixVariant;
	label: string;
	tag: string;
	tagColor: string;
	code: string;
	output: number[];
	explanation: string;
	scopeExplanation: string;
}

const VARIANTS: Variant[] = [
	{
		id: "var",
		label: "var (buggy)",
		tag: "❌ Bug",
		tagColor: "#ef4444",
		code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // always 3
  }, 1000);
}
// Prints: 3, 3, 3
//
// 'var' is function-scoped — there is ONE
// shared 'i' in the enclosing scope.
// By the time the callbacks fire, the loop
// has finished and i = 3. All 3 callbacks
// close over the SAME variable binding.`,
		output: [3, 3, 3],
		explanation:
			"All 3 callbacks share a single `var i` binding in the enclosing function scope. The loop runs synchronously to completion (i = 3) before any callback fires.",
		scopeExplanation:
			"var i lives in the function scope — hoisted above the loop. Every iteration's callback closes over the exact same memory location.",
	},
	{
		id: "let",
		label: "let (fix)",
		tag: "✅ Fix",
		tagColor: "#22c55e",
		code: `for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 0, 1, 2 ✓
  }, 1000);
}
// Prints: 0, 1, 2
//
// 'let' is block-scoped. Each loop iteration
// creates a FRESH binding of 'i'. The JS engine
// conceptually does this behind the scenes:
//   { let i = 0; callback captures i=0 }
//   { let i = 1; callback captures i=1 }
//   { let i = 2; callback captures i=2 }`,
		output: [0, 1, 2],
		explanation:
			"Each `for` iteration creates a brand new `let i` binding (block scope). Each callback closes over its own independent binding — they cannot affect each other.",
		scopeExplanation:
			"The spec requires the JS engine to create a new `i` binding per iteration for `let`/`const` in `for` headers. Each block `{ }` gets its own environment record.",
	},
	{
		id: "iife",
		label: "IIFE (fix)",
		tag: "✅ Fix",
		tagColor: "#22c55e",
		code: `for (var i = 0; i < 3; i++) {
  (function(capturedValue) {
    setTimeout(() => {
      console.log(capturedValue); // 0, 1, 2 ✓
    }, 1000);
  })(i); // pass current i as argument
}
// Prints: 0, 1, 2
//
// The IIFE (Immediately Invoked Function Expression)
// creates a new function scope PER iteration. When you
// pass 'i' as an argument, it's copied into a fresh
// 'capturedValue' parameter — a completely different
// binding from the outer 'i'. Each setTimeout callback
// closes over its own capturedValue.`,
		output: [0, 1, 2],
		explanation:
			"An Immediately Invoked Function Expression (IIFE) creates a new function scope per iteration. The current value of `i` is passed as an argument, becoming a fresh `capturedValue` parameter binding — completely independent of the outer `var i`.",
		scopeExplanation:
			"Each IIFE call creates a new activation record with its own `capturedValue` parameter. When `i=0`, capturedValue=0 is frozen in that scope; when `i=1`, a new scope has capturedValue=1, and so on. The outer `var i` reaching 3 doesn't affect these frozen parameters.",
	},
	{
		id: "foreach",
		label: "forEach (fix)",
		tag: "✅ Fix",
		tagColor: "#22c55e",
		code: `Array.from({ length: 3 }, (_, i) => i)
  .forEach((i) => {
    setTimeout(() => {
      console.log(i); // 0, 1, 2 ✓
    }, 1000);
  });
// Prints: 0, 1, 2
//
// forEach passes each element as a fresh
// parameter 'i' to the callback. Each callback
// invocation gets its own parameter binding —
// a new scope is created for each element.
// Functionally equivalent to the IIFE approach.`,
		output: [0, 1, 2],
		explanation:
			"Array.forEach calls the callback once per element, passing the value as a fresh parameter. The parameter `i` in each invocation is a separate binding — equivalent to the IIFE approach but much cleaner.",
		scopeExplanation:
			"Function parameters create new bindings per call. Each forEach callback invocation produces a distinct activation record with its own `i` parameter.",
	},
];

// ─── Scope animation boxes ────────────────────────────────────────────────────

interface ScopeBoxesProps {
	variant: FixVariant;
	outputs: (number | null)[];
}

function ScopeBoxes({ variant, outputs }: ScopeBoxesProps) {
	const isBuggy = variant === "var";

	if (isBuggy) {
		// One shared scope box for all 3 callbacks
		return (
			<div className="space-y-2">
				<p className="text-xs text-text-muted">Scope structure:</p>
				<div className="rounded-xl border-2 border-dashed border-red-500/40 p-4 bg-red-500/05 space-y-3">
					<div className="text-xs font-semibold text-accent-red-soft">
						Function scope (shared)
					</div>
					<div className="flex items-center gap-2 font-mono text-xs">
						<span className="text-text-tertiary">var i =</span>
						<motion.span
							key={outputs[0] ?? "?"}
							initial={{ scale: 1.3 }}
							animate={{ scale: 1 }}
							className="text-accent-red-soft font-bold"
						>
							{outputs[0] !== null ? outputs[0] : "…"}
						</motion.span>
					</div>
					<div className="flex gap-2">
						{[0, 1, 2].map((idx) => (
							<div
								key={idx}
								className="flex-1 rounded-lg border border-red-500/30 bg-red-500/08 p-2 text-center"
							>
								<div className="text-[10px] text-text-muted">cb{idx + 1}</div>
								<div className="text-xs font-mono text-accent-red">
									reads i →{" "}
									<span className="font-bold">
										{outputs[idx] !== null ? outputs[idx] : "?"}
									</span>
								</div>
							</div>
						))}
					</div>
					<p className="text-[10px] text-accent-red-soft/70">
						↑ All callbacks point to the same <code>i</code> binding
					</p>
				</div>
			</div>
		);
	}

	// Fix variants: 3 independent scope boxes
	const colors = ["#8b5cf6", "#22d3ee", "#f59e0b"];
	const green = "#22c55e";
	const scopeLabel: Record<FixVariant, string> = {
		var: "Function scope",
		let: "Block scope (iteration)",
		iife: "IIFE function scope",
		foreach: "forEach callback scope",
	};

	return (
		<div className="space-y-2">
			<p className="text-xs text-text-muted">Scope structure:</p>
			<div className="flex gap-2">
				{[0, 1, 2].map((idx) => {
					const color = colors[idx] ?? green;
					return (
						<div
							key={idx}
							className="flex-1 rounded-xl border-2 p-3 space-y-2"
							style={{
								borderColor: `${color}44`,
								background: `${color}08`,
							}}
						>
							<div className="text-[10px] font-semibold" style={{ color }}>
								{scopeLabel[variant]} #{idx + 1}
							</div>
							<div className="font-mono text-xs">
								<span className="text-text-tertiary">i = </span>
								<motion.span
									key={outputs[idx] ?? "?"}
									initial={{ scale: 1.3 }}
									animate={{ scale: 1 }}
									className="font-bold"
									style={{ color }}
								>
									{idx}
								</motion.span>
							</div>
							<div
								className="text-xs rounded p-1.5 font-mono"
								style={{
									border: `1px solid ${color}30`,
									background: `${color}0f`,
								}}
							>
								cb output:{" "}
								<span className="font-bold" style={{ color: green }}>
									{outputs[idx] !== null ? outputs[idx] : "?"}
								</span>
							</div>
						</div>
					);
				})}
			</div>
			<p className="text-[10px] text-accent-green-soft/70">
				↑ Each callback has its own independent binding
			</p>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ForLoopBugDemo() {
	const [activeVariant, setActiveVariant] = useState<FixVariant>("var");
	const [outputs, setOutputs] = useState<(number | null)[]>([null, null, null]);
	const [running, setRunning] = useState(false);

	const variant = VARIANTS.find((v) => v.id === activeVariant) ?? VARIANTS[0];

	function runLoop() {
		if (running) return;
		setRunning(true);
		setOutputs([null, null, null]);

		// Simulate the setTimeout delay — reveal outputs one by one
		const expectedOutputs = variant.output;
		setTimeout(() => {
			setOutputs([expectedOutputs[0] ?? null, null, null]);
		}, 800);
		setTimeout(() => {
			setOutputs([
				expectedOutputs[0] ?? null,
				expectedOutputs[1] ?? null,
				null,
			]);
		}, 1000);
		setTimeout(() => {
			setOutputs([
				expectedOutputs[0] ?? null,
				expectedOutputs[1] ?? null,
				expectedOutputs[2] ?? null,
			]);
			setRunning(false);
		}, 1200);
	}

	function handleTabChange(id: FixVariant) {
		setActiveVariant(id);
		setOutputs([null, null, null]);
		setRunning(false);
	}

	const isBuggy = activeVariant === "var";

	return (
		<DemoSection
			title='Demo 4: The Classic "for" Loop setTimeout Bug'
			description="All 3 callbacks print 3 — not 0, 1, 2. This is one of the most common JavaScript closure gotchas. Select a fix below to see why each one works."
		>
			{/* Tabs */}
			<div className="flex flex-wrap gap-2 mb-6">
				{VARIANTS.map((v) => (
					<button
						key={v.id}
						type="button"
						onClick={() => handleTabChange(v.id)}
						className="px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-150"
						style={
							activeVariant === v.id
								? {
										background: `${v.tagColor}20`,
										borderColor: `${v.tagColor}60`,
										color: v.tagColor,
									}
								: {
										background: "transparent",
										borderColor: "var(--svg-border)",
										color: "var(--svg-text)",
									}
						}
					>
						{v.label}
					</button>
				))}
			</div>

			<div className="flex flex-col xl:flex-row gap-6">
				{/* Code panel */}
				<div className="xl:w-96 shrink-0 space-y-3">
					<p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
						Code
					</p>
					<ShikiCode
						code={variant.code}
						language="javascript"
						showLineNumbers={false}
					/>

					{/* Run button */}
					<button
						type="button"
						onClick={runLoop}
						disabled={running}
						className="w-full py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						style={{
							borderColor: `${variant.tagColor}44`,
							color: variant.tagColor,
							background: `${variant.tagColor}14`,
						}}
					>
						{running ? "⏳ Running loop…" : "▶ Run Loop"}
					</button>
				</div>

				{/* Right panel */}
				<div className="flex-1 min-w-0 space-y-5">
					{/* Console output */}
					<div className="space-y-2">
						<p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
							Console output (after 1s delay)
						</p>
						<div className="rounded-xl bg-surface-base border border-border-primary p-4 font-mono text-sm space-y-1 min-h-24">
							<AnimatePresence>
								{outputs.map((val, idx) =>
									val !== null ? (
										<motion.div
											// biome-ignore lint/suspicious/noArrayIndexKey: fixed 3-element list
											key={idx}
											initial={{ opacity: 0, x: -8 }}
											animate={{ opacity: 1, x: 0 }}
											className="flex items-center gap-3"
										>
											<span className="text-text-faint text-[11px]">
												callback {idx + 1}:
											</span>
											<span
												className="font-bold text-base"
												style={{
													color: isBuggy ? "#ef4444" : "#22c55e",
												}}
											>
												{val}
											</span>
											{isBuggy && (
												<span className="text-accent-red-soft/60 text-xs">
													{" "}
													← stale!
												</span>
											)}
										</motion.div>
									) : null,
								)}
							</AnimatePresence>
							{outputs.every((v) => v === null) && (
								<span className="text-text-secondary">
									Click "Run Loop" to see output…
								</span>
							)}
						</div>
					</div>

					{/* Scope boxes */}
					<ScopeBoxes variant={activeVariant} outputs={outputs} />

					{/* Explanation */}
					<AnimatePresence mode="wait">
						<motion.div
							key={activeVariant}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							className="p-4 rounded-xl border text-xs space-y-2"
							style={{
								background: `${variant.tagColor}08`,
								borderColor: `${variant.tagColor}30`,
								color: "#d4d4d8",
							}}
						>
							<p>
								<strong style={{ color: variant.tagColor }}>
									{variant.tag} — Why:
								</strong>{" "}
								{variant.explanation}
							</p>
							<p className="text-text-muted">{variant.scopeExplanation}</p>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</DemoSection>
	);
}
