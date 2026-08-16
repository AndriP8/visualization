import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type FailureKind =
	| "trailing-comma"
	| "unclosed-brace"
	| "markdown-fence"
	| "hallucinated-key"
	| "wrong-type";

interface Example {
	id: string;
	kind: FailureKind;
	label: string;
	category: "Syntax Error" | "Schema Violation";
	prompt: string;
	targetSchema?: string;
	output: string;
	violatingSnippet: string;
	caughtBy: "strict-parse" | "schema-check";
	explanation: string;
}

const EXAMPLES: Example[] = [
	{
		id: "trailing-comma",
		kind: "trailing-comma",
		label: "Trailing comma",
		category: "Syntax Error",
		prompt: "Return JSON: name + age for Ada Lovelace.",
		output: `{\n  "name": "Ada Lovelace",\n  "age": 36,\n}`,
		violatingSnippet: "36, (trailing comma on line 3)",
		caughtBy: "strict-parse",
		explanation:
			"JSON.parse rejects trailing commas. LLMs trained on JS/TS datasets frequently emit trailing commas in object literals.",
	},
	{
		id: "unclosed-brace",
		kind: "unclosed-brace",
		label: "Unclosed brace (truncation)",
		category: "Syntax Error",
		prompt: "Return JSON describing a product.",
		output: `{\n  "id": "sku-901",\n  "name": "Wireless Mouse",\n  "specs": {\n    "dpi": 1600,\n    "buttons": 6`,
		violatingSnippet: 'Incomplete nested object (missing "}" and "}")',
		caughtBy: "strict-parse",
		explanation:
			"Generation stopped mid-stream due to max_tokens limits or early stop token before all open brackets were closed.",
	},
	{
		id: "markdown-fence",
		kind: "markdown-fence",
		label: "Markdown fences",
		category: "Syntax Error",
		prompt: "Return JSON.",
		output: '```json\n{\n  "status": "ok",\n  "count": 3\n}\n```',
		violatingSnippet: "Markdown fence markers (```json and ```)",
		caughtBy: "strict-parse",
		explanation:
			"Chat models are heavily RLHF'd to output code blocks with markdown fences. These characters cause immediate JSON.parse syntax failures.",
	},
	{
		id: "hallucinated-key",
		kind: "hallucinated-key",
		label: "Hallucinated key",
		category: "Schema Violation",
		prompt:
			'Return JSON matching {"city": string, "country": string} for Paris.',
		targetSchema: `{\n  "type": "object",\n  "properties": {\n    "city": { "type": "string" },\n    "country": { "type": "string" }\n  },\n  "required": ["city", "country"],\n  "additionalProperties": false\n}`,
		output: `{\n  "city": "Paris",\n  "country": "France",\n  "population": 2102650\n}`,
		violatingSnippet: '"population": 2102650 (undeclared property)',
		caughtBy: "schema-check",
		explanation:
			"Parses without error. Standard JSON mode accepts it. Only a strict schema validator with additionalProperties: false detects the unauthorized key.",
	},
	{
		id: "wrong-type",
		kind: "wrong-type",
		label: "Wrong type",
		category: "Schema Violation",
		prompt: 'Return JSON matching {"age": number} for a 36-year-old.',
		targetSchema: `{\n  "type": "object",\n  "properties": {\n    "age": { "type": "integer" }\n  },\n  "required": ["age"],\n  "additionalProperties": false\n}`,
		output: `{\n  "age": "36"\n}`,
		violatingSnippet: '"36" (string instead of numeric integer)',
		caughtBy: "schema-check",
		explanation:
			"Numeric value emitted as a string literal. Passes JSON.parse cleanly; only downstream type validation flags the discrepancy.",
	},
];

function tryParse(src: string): { ok: boolean; error?: string } {
	try {
		JSON.parse(src);
		return { ok: true };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

export function NaivePromptingFailureDemo() {
	const [activeId, setActiveId] = useState(EXAMPLES[0].id);
	const active = EXAMPLES.find((e) => e.id === activeId) ?? EXAMPLES[0];
	const parseResult = tryParse(active.output);

	const caughtByLabel = match(active.caughtBy)
		.with(
			"strict-parse",
			() => "Caught by JSON.parse — JSON mode would also reject.",
		)
		.with(
			"schema-check",
			() =>
				"Passes JSON.parse and JSON mode. Only a strict schema validator catches this.",
		)
		.exhaustive();

	// Keyboard arrow navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;
			const currentIndex = EXAMPLES.findIndex((ex) => ex.id === activeId);
			if (e.key === "ArrowRight") {
				const nextIndex = (currentIndex + 1) % EXAMPLES.length;
				setActiveId(EXAMPLES[nextIndex].id);
			} else if (e.key === "ArrowLeft") {
				const prevIndex =
					(currentIndex - 1 + EXAMPLES.length) % EXAMPLES.length;
				setActiveId(EXAMPLES[prevIndex].id);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeId]);

	return (
		<DemoSection
			title="1. Naive prompting fails in predictable ways"
			description="Curated, realistic outputs from real prompt-only JSON requests. Click each to see how it breaks."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{EXAMPLES.map((ex) => (
						<button
							type="button"
							key={ex.id}
							onClick={() => setActiveId(ex.id)}
							className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-2 ${
								ex.id === activeId
									? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
									: "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
							}`}
						>
							<span>{ex.label}</span>
							<span
								className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
									ex.category === "Syntax Error"
										? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
										: "bg-amber-500/20 text-amber-300 border border-amber-500/30"
								}`}
							>
								{ex.category}
							</span>
						</button>
					))}
				</div>

				<motion.div
					key={active.id}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
					className="grid grid-cols-1 lg:grid-cols-2 gap-4"
				>
					<div className="space-y-3">
						<div>
							<div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
								Prompt
							</div>
							<div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300">
								{active.prompt}
							</div>
						</div>

						{active.targetSchema && (
							<div>
								<div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1 flex items-center justify-between">
									<span>Target JSON Schema</span>
									<span className="text-cyan-400 text-[10px]">Strict mode</span>
								</div>
								<ShikiCode
									code={active.targetSchema}
									language="json"
									showLineNumbers={false}
								/>
							</div>
						)}

						<div>
							<div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1 flex items-center justify-between">
								<span>Model output</span>
								<span className="text-rose-400 text-[10px]">
									Contains defect
								</span>
							</div>
							<ShikiCode
								code={active.output}
								language="json"
								showLineNumbers={false}
							/>
						</div>
					</div>

					<div className="space-y-3">
						<div
							className={`rounded-md border p-3.5 ${
								parseResult.ok
									? "border-amber-500/30 bg-amber-500/5"
									: "border-rose-500/30 bg-rose-500/5"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span
									className={`text-xs font-semibold ${
										parseResult.ok ? "text-amber-300" : "text-rose-300"
									}`}
								>
									{parseResult.ok
										? "✓ JSON.parse: Valid syntax"
										: `✗ JSON.parse: ${parseResult.error}`}
								</span>
								<span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
									{active.category}
								</span>
							</div>
							<div className="text-xs text-zinc-400 mt-1">{caughtByLabel}</div>
						</div>

						<div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
							<div className="text-[11px] uppercase tracking-wider text-zinc-500">
								Violating Segment
							</div>
							<div className="font-mono text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 rounded p-2">
								{active.violatingSnippet}
							</div>
						</div>

						<div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3.5 text-sm text-zinc-300 space-y-1">
							<div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
								Why it happens
							</div>
							<div className="text-xs leading-relaxed text-zinc-300">
								{active.explanation}
							</div>
						</div>
					</div>
				</motion.div>

				<div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-400 leading-relaxed flex items-center justify-between">
					<div>
						<span className="text-zinc-300 font-medium">Summary:</span> 3/5 of
						these fail{" "}
						<span className="text-rose-300 font-medium">JSON.parse</span>. The
						remaining 2 parse cleanly but violate the requested{" "}
						<span className="text-cyan-300 font-medium">schema</span> (which
						format-only JSON mode allows).
					</div>
					<span className="text-[10px] text-zinc-500 hidden sm:inline">
						Use ← / → keys to switch
					</span>
				</div>
			</div>
		</DemoSection>
	);
}
