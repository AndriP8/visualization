import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

type Mode = "constrained" | "unconstrained";

const VOCAB = [
	"{",
	"}",
	`"name"`,
	`"age"`,
	`"color"`,
	":",
	",",
	`"Ada"`,
	`"Bob"`,
	"36",
	"42",
	" hello",
	"```",
	"null",
	"true",
] as const;

type Token = (typeof VOCAB)[number];

interface Step {
	emittedAfter: string;
	logits: Partial<Record<Token, number>>;
	allowed: Token[];
	naivePick: Token;
	constrainedPick: Token;
	stateNote: string;
}

const BASE_LOGIT = 0.5;

const STEPS: Step[] = [
	{
		emittedAfter: "{",
		logits: {
			"{": 4.2,
			"```": 2.1,
			" hello": 1.4,
			null: 0.9,
		},
		allowed: ["{"],
		naivePick: "{",
		constrainedPick: "{",
		stateNote:
			"Start of generation. Schema demands an object → only '{' is legal.",
	},
	{
		emittedAfter: `{"name"`,
		logits: {
			"```": 3.0,
			'"name"': 2.4,
			'"color"': 1.8,
			'"age"': 1.6,
			"}": 0.4,
		},
		allowed: [`"name"`, `"age"`],
		naivePick: "```",
		constrainedPick: `"name"`,
		stateNote:
			"Unconstrained model defaults to emitting a markdown code fence (```). The grammar mask sets '```' logit to -∞ and restricts sampling exclusively to declared schema keys.",
	},
	{
		emittedAfter: `{"name":`,
		logits: {
			":": 3.8,
			",": 1.2,
			"}": 0.6,
		},
		allowed: [":"],
		naivePick: ":",
		constrainedPick: ":",
		stateNote:
			"Immediately after an object key, only ':' is syntactically legal in JSON.",
	},
	{
		emittedAfter: `{"name":"Ada"`,
		logits: {
			'"Ada"': 2.6,
			'"Bob"': 2.1,
			"36": 1.9,
			"42": 1.5,
			null: 1.3,
		},
		allowed: [`"Ada"`, `"Bob"`],
		naivePick: `"Ada"`,
		constrainedPick: `"Ada"`,
		stateNote:
			"Schema declares 'name' as a string. Integer numbers and null tokens are masked out completely.",
	},
	{
		emittedAfter: `{"name":"Ada",`,
		logits: {
			"}": 2.9,
			",": 2.0,
			'"age"': 1.7,
		},
		allowed: [","],
		naivePick: "}",
		constrainedPick: ",",
		stateNote:
			"Unconstrained model would close the object with '}' (highest raw logit), omitting the required 'age' property. Grammar mask enforces ',' to continue parsing.",
	},
	{
		emittedAfter: `{"name":"Ada","age":36`,
		logits: {
			"36": 2.7,
			"42": 2.2,
			'"Ada"': 0.8,
			null: 1.1,
		},
		allowed: ["36", "42"],
		naivePick: "36",
		constrainedPick: "36",
		stateNote:
			"Schema specifies integer type for 'age'. String and null tokens are masked.",
	},
	{
		emittedAfter: `{"name":"Ada","age":36}`,
		logits: {
			"}": 3.4,
			",": 1.9,
			'"color"': 1.5,
		},
		allowed: ["}"],
		naivePick: "}",
		constrainedPick: "}",
		stateNote:
			"All required keys are satisfied and additionalProperties: false is active. Comma ',' and new keys are masked. Only '}' is allowed.",
	},
];

function softmax(values: number[], temperature = 1.0) {
	const temp = Math.max(0.01, temperature);
	const scaled = values.map((v) => v / temp);
	const max = Math.max(...scaled);
	const exps = scaled.map((v) => Math.exp(v - max));
	const sum = exps.reduce((a, b) => a + b, 0);
	return exps.map((e) => e / sum);
}

export function ConstrainedMaskingDemo() {
	const [mode, setMode] = useState<Mode>("constrained");
	const [stepIdx, setStepIdx] = useState(0);
	const [temperature, setTemperature] = useState(1.0);
	const [hoveredToken, setHoveredToken] = useState<Token | null>(null);

	const step = STEPS[stepIdx];

	const rawLogits = VOCAB.map((t) => step.logits[t] ?? BASE_LOGIT);
	const rawProbs = softmax(rawLogits, temperature);

	const masked = VOCAB.map((t) =>
		mode === "constrained" && !step.allowed.includes(t)
			? -Infinity
			: (step.logits[t] ?? BASE_LOGIT),
	);

	const renormalized =
		mode === "constrained"
			? (() => {
					const finite = masked.map((v) => (v === -Infinity ? 0 : v));
					const validIdx = masked
						.map((v, i) => (v === -Infinity ? -1 : i))
						.filter((i) => i >= 0);
					const sm = softmax(
						validIdx.map((i) => finite[i]),
						temperature,
					);
					const out = new Array(VOCAB.length).fill(0);
					validIdx.forEach((idx, k) => {
						out[idx] = sm[k];
					});
					return out;
				})()
			: rawProbs;

	const picked = mode === "constrained" ? step.constrainedPick : step.naivePick;
	const wouldDiverge = step.naivePick !== step.constrainedPick;

	// Keyboard arrow navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;
			if (e.key === "ArrowRight") {
				setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
			} else if (e.key === "ArrowLeft") {
				setStepIdx((i) => Math.max(0, i - 1));
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const selectedInspectorToken = hoveredToken ?? picked;
	const inspectedIdx = VOCAB.indexOf(selectedInspectorToken);
	const inspectedLogit = step.logits[selectedInspectorToken] ?? BASE_LOGIT;
	const inspectedAllowed =
		mode === "unconstrained" || step.allowed.includes(selectedInspectorToken);
	const inspectedRawProb = rawProbs[inspectedIdx];
	const inspectedFinalProb = renormalized[inspectedIdx];

	return (
		<DemoSection
			title="3. Token-level mask at each decode step"
			description="Same logits, two policies. Constrained decoding zeroes out grammar-illegal tokens and renormalizes — invalid tokens become mathematically impossible."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="inline-flex rounded-md border border-zinc-800 overflow-hidden text-xs">
							{(["unconstrained", "constrained"] as Mode[]).map((m) => (
								<button
									type="button"
									key={m}
									onClick={() => setMode(m)}
									className={`px-3 py-1.5 font-medium transition-colors ${
										mode === m
											? match(m)
													.with(
														"constrained",
														() =>
															"bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
													)
													.with(
														"unconstrained",
														() =>
															"bg-rose-500/20 text-rose-200 border-rose-500/40",
													)
													.exhaustive()
											: "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
									}`}
								>
									{m === "constrained"
										? "✓ Constrained (Masked)"
										: "✗ Unconstrained (Raw)"}
								</button>
							))}
						</div>

						{/* Temperature Slider */}
						<div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-md text-xs">
							<span className="text-zinc-400">Temp:</span>
							<input
								type="range"
								min={0.1}
								max={2.0}
								step={0.1}
								value={temperature}
								onChange={(e) => setTemperature(Number(e.target.value))}
								className="w-20 accent-emerald-400 cursor-pointer"
								title={`Temperature: ${temperature.toFixed(1)}`}
							/>
							<span className="font-mono text-emerald-300 tabular-nums">
								{temperature.toFixed(1)}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
							disabled={stepIdx === 0}
							className="px-3 py-1 rounded-md text-xs font-medium border border-zinc-700 bg-zinc-900 text-zinc-300 disabled:opacity-40 hover:text-white"
						>
							← Prev
						</button>
						<div className="text-xs text-zinc-400 tabular-nums font-mono px-1">
							Step {stepIdx + 1}/{STEPS.length}
						</div>
						<button
							type="button"
							onClick={() =>
								setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))
							}
							disabled={stepIdx === STEPS.length - 1}
							className="px-3 py-1 rounded-md text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 disabled:opacity-40 hover:bg-emerald-500/20"
						>
							Next →
						</button>
						<button
							type="button"
							onClick={() => setStepIdx(0)}
							className="px-3 py-1 rounded-md text-xs font-medium border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
						>
							Reset
						</button>
					</div>
				</div>

				<div>
					<div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
						Prefix Generated (After Step #{stepIdx + 1} Selection)
					</div>
					<div className="rounded-md border border-zinc-800 bg-[#121212] p-3 font-mono text-sm">
						<span className="text-emerald-200 font-semibold">
							{step.emittedAfter}
						</span>
					</div>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="text-[11px] uppercase tracking-wider text-zinc-500">
							Vocabulary Distribution (Hover token to inspect math)
						</div>
						<div className="text-xs text-zinc-400 font-mono">
							Active Pick:{" "}
							<span className="text-emerald-300 font-semibold">{picked}</span>
						</div>
					</div>

					<div className="space-y-1.5">
						{VOCAB.map((tok, i) => {
							const isAllowed =
								mode === "unconstrained" || step.allowed.includes(tok);
							const prob = renormalized[i];
							const rawProb = rawProbs[i];
							const isPick = tok === picked;
							const barWidth = isAllowed ? Math.max(prob * 100, 0.5) : 0;
							const rawBarWidth = rawProb * 100;
							const isHovered = tok === hoveredToken;

							return (
								<button
									type="button"
									key={tok}
									onMouseEnter={() => setHoveredToken(tok)}
									onMouseLeave={() => setHoveredToken(null)}
									onClick={() => setHoveredToken(tok)}
									className={`w-full text-left flex items-center gap-3 text-xs p-1 rounded transition-colors cursor-pointer ${
										isHovered ? "bg-zinc-900/90" : "hover:bg-zinc-900/40"
									} ${isAllowed ? "" : "opacity-40"}`}
								>
									<div
										className={`w-24 font-mono truncate ${
											isPick
												? "text-emerald-300 font-semibold"
												: isAllowed
													? "text-zinc-300"
													: "text-zinc-500 line-through"
										}`}
									>
										{tok === " hello" ? "·hello" : tok}
									</div>
									<div className="flex-1 relative h-4 bg-zinc-900 rounded overflow-hidden">
										<div
											className="absolute inset-y-0 left-0 bg-zinc-700/50"
											style={{ width: `${rawBarWidth}%` }}
											title="Raw model probability"
										/>
										<motion.div
											className={`absolute inset-y-0 left-0 ${
												isPick
													? "bg-emerald-400"
													: isAllowed
														? "bg-cyan-500/60"
														: "bg-zinc-800"
											}`}
											initial={false}
											animate={{ width: `${barWidth}%` }}
											transition={{ duration: 0.2 }}
										/>
									</div>
									<div className="w-16 text-right tabular-nums font-mono text-zinc-400">
										{isAllowed ? `${(prob * 100).toFixed(1)}%` : "masked (-∞)"}
									</div>
								</button>
							);
						})}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-zinc-900 text-[10px] text-zinc-500">
						<div className="flex gap-4">
							<span className="inline-flex items-center gap-1.5">
								<span className="inline-block w-3 h-2 bg-zinc-700/50 rounded-sm" />
								Raw Logits Softmax
							</span>
							<span className="inline-flex items-center gap-1.5">
								<span className="inline-block w-3 h-2 bg-cyan-500/60 rounded-sm" />
								After Grammar Mask &amp; Renormalize
							</span>
							<span className="inline-flex items-center gap-1.5">
								<span className="inline-block w-3 h-2 bg-emerald-400 rounded-sm" />
								Selected Token
							</span>
						</div>
						<span className="hidden md:inline text-zinc-500">
							Press ← / → for navigation
						</span>
					</div>
				</div>

				{/* Math & Token Inspector */}
				<div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
					<div>
						<div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
							Inspected Token
						</div>
						<div className="font-mono text-sm text-cyan-300 font-semibold">
							{selectedInspectorToken}
						</div>
					</div>
					<div>
						<div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
							Raw Logit / Raw Prob
						</div>
						<div className="font-mono text-zinc-300">
							{inspectedLogit.toFixed(1)} →{" "}
							{(inspectedRawProb * 100).toFixed(1)}%
						</div>
					</div>
					<div>
						<div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
							Grammar Status
						</div>
						<div
							className={`font-mono font-medium ${
								inspectedAllowed ? "text-emerald-300" : "text-rose-400"
							}`}
						>
							{inspectedAllowed ? "✓ Valid Production" : "✗ Masked (-∞ logit)"}
						</div>
					</div>
					<div>
						<div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
							Final Sample Prob
						</div>
						<div className="font-mono text-emerald-300 font-semibold">
							{(inspectedFinalProb * 100).toFixed(1)}%
						</div>
					</div>
				</div>

				<div
					className={`rounded-md border p-3.5 text-xs ${
						wouldDiverge
							? "border-amber-500/40 bg-amber-500/5 text-amber-100"
							: "border-zinc-800 bg-zinc-900/60 text-zinc-300"
					}`}
				>
					<div className="font-semibold text-zinc-200 mb-1 flex items-center justify-between">
						<span>
							{wouldDiverge
								? "⚠ Divergence: Unconstrained and constrained produce different tokens"
								: "✓ Agreement: Both policies pick the same token at this step"}
						</span>
						<span className="font-mono text-[11px] text-zinc-400">
							Constrained:{" "}
							<span className="text-emerald-300 font-bold">
								{step.constrainedPick}
							</span>{" "}
							vs Naive:{" "}
							<span className="text-rose-300 font-bold">{step.naivePick}</span>
						</span>
					</div>
					<div className="text-zinc-300 leading-relaxed">{step.stateNote}</div>
				</div>

				<div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-400 leading-relaxed">
					<span className="text-zinc-300 font-medium">
						Mathematical Guarantee:
					</span>{" "}
					Because illegal transitions have masked logits set to -infinity, their
					exponential term equals zero (exp(-inf) = 0), making their probability
					strictly 0.0%. The model cannot emit malformed JSON or violate the
					schema, regardless of temperature or random sampling.
				</div>
			</div>
		</DemoSection>
	);
}
