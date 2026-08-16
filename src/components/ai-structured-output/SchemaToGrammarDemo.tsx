import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age":  { "type": "integer" }
  },
  "required": ["name", "age"],
  "additionalProperties": false
}`;

const GRAMMAR = `# GBNF (llama.cpp) derived from the schema on the left
root      ::= "{" ws "\\"name\\"" ws ":" ws string ws "," ws
              "\\"age\\""  ws ":" ws integer ws "}"
string    ::= "\\"" char* "\\""
char      ::= [^"\\\\] | "\\\\" ["\\\\/bfnrt]
integer   ::= "-"? ("0" | [1-9] [0-9]*)
ws        ::= [ \\t\\n]*`;

type ParserState =
	| "start"
	| "expect-key"
	| "expect-colon"
	| "expect-value"
	| "expect-comma-or-close"
	| "done";

interface Step {
	emitted: string;
	state: ParserState;
	stack: string[];
	stackAction: string;
	grammarLine: number;
	note: string;
}

const STEPS: Step[] = [
	{
		emitted: "",
		state: "start",
		stack: ["root"],
		stackAction: "INIT root",
		grammarLine: 1,
		note: "Parser at root. Only '{' advances grammar production.",
	},
	{
		emitted: "{",
		state: "expect-key",
		stack: ["object"],
		stackAction: "PUSH object",
		grammarLine: 1,
		note: "Pushed 'object' frame onto stack. Next token must be quoted \"name\" key.",
	},
	{
		emitted: `{"name"`,
		state: "expect-colon",
		stack: ["object", "after-key"],
		stackAction: "PUSH after-key",
		grammarLine: 1,
		note: "Matched required key 'name'. Colon ':' is the only legal continuation.",
	},
	{
		emitted: `{"name":`,
		state: "expect-value",
		stack: ["object", "value:string"],
		stackAction: "REPLACE → value:string",
		grammarLine: 3,
		note: "Schema binds 'name' to string. Grammar switches to string production.",
	},
	{
		emitted: `{"name":"Ada"`,
		state: "expect-comma-or-close",
		stack: ["object"],
		stackAction: "POP value:string",
		grammarLine: 1,
		note: "String value closed. 'age' is required, so comma ',' is forced.",
	},
	{
		emitted: `{"name":"Ada","age"`,
		state: "expect-colon",
		stack: ["object", "after-key"],
		stackAction: "PUSH after-key",
		grammarLine: 2,
		note: "Second required key 'age' consumed. Next must be colon ':'.",
	},
	{
		emitted: `{"name":"Ada","age":`,
		state: "expect-value",
		stack: ["object", "value:integer"],
		stackAction: "REPLACE → value:integer",
		grammarLine: 5,
		note: "Schema binds 'age' to integer. String quotes and non-digit tokens are masked.",
	},
	{
		emitted: `{"name":"Ada","age":36`,
		state: "expect-comma-or-close",
		stack: ["object"],
		stackAction: "POP value:integer",
		grammarLine: 2,
		note: "All required fields satisfied. additionalProperties:false masks ',' and forces '}'.",
	},
	{
		emitted: `{"name":"Ada","age":36}`,
		state: "done",
		stack: [],
		stackAction: "POP object → DONE",
		grammarLine: 2,
		note: "Stack empty. Grammar production fully satisfied.",
	},
];

const STATE_NODES: { id: ParserState; label: string }[] = [
	{ id: "start", label: "start" },
	{ id: "expect-key", label: "expect-key" },
	{ id: "expect-colon", label: "expect-colon" },
	{ id: "expect-value", label: "expect-value" },
	{ id: "expect-comma-or-close", label: "comma-or-close" },
	{ id: "done", label: "done" },
];

export function SchemaToGrammarDemo() {
	const [stepIdx, setStepIdx] = useState(0);
	const step = STEPS[stepIdx];

	const stateColor = (id: ParserState) =>
		match(id === step.state)
			.with(
				true,
				() => "border-emerald-400 bg-emerald-500/15 text-emerald-200 shadow-sm",
			)
			.otherwise(
				() => "border-zinc-700 bg-zinc-900/60 text-zinc-500 opacity-60",
			);

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

	return (
		<DemoSection
			title="2. Schema → grammar → token-level automaton"
			description="A JSON Schema compiles into a Context-Free Grammar. A pushdown parser walks the grammar in lockstep with the LLM decode loop."
		>
			<div className="space-y-4">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="text-[11px] uppercase tracking-wider text-zinc-500">
							JSON Schema (Specification)
						</div>
						<ShikiCode code={SCHEMA} language="json" showLineNumbers={false} />
					</div>
					<div className="space-y-2">
						<div className="text-[11px] uppercase tracking-wider text-zinc-500 flex items-center justify-between">
							<span>Derived Grammar (GBNF Excerpt)</span>
							<span className="text-violet-400 font-mono text-[10px]">
								Active rule highlighted
							</span>
						</div>
						<ShikiCode
							code={GRAMMAR}
							language="bash"
							showLineNumbers={true}
							highlightLine={step.grammarLine}
						/>
					</div>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<span className="text-[11px] uppercase tracking-wider text-zinc-500">
								Parser Execution Walk
							</span>
							<span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
								Step {stepIdx + 1}/{STEPS.length}
							</span>
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
							Buffer Emitted So Far
						</div>
						<div className="rounded-md border border-zinc-800 bg-[#121212] p-3 font-mono text-sm text-emerald-200 min-h-[2.5rem] flex items-center">
							{step.emitted || (
								<span className="text-zinc-600">(empty buffer)</span>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
								Automaton State
							</div>
							<div className="flex flex-wrap gap-2">
								{STATE_NODES.map((n) => (
									<motion.div
										key={n.id}
										layout
										className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${stateColor(
											n.id,
										)}`}
									>
										{n.label}
									</motion.div>
								))}
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-[11px] uppercase tracking-wider text-zinc-500">
									Pushdown Stack
								</span>
								<span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded">
									{step.stackAction}
								</span>
							</div>
							<div className="flex flex-col-reverse gap-1.5 min-h-[4.5rem] p-2 rounded-md bg-zinc-900/40 border border-zinc-800/80">
								{step.stack.length === 0 ? (
									<div className="text-xs text-zinc-500 italic p-1">
										Stack empty (valid end state)
									</div>
								) : (
									step.stack.map((frame, i) => (
										<motion.div
											// biome-ignore lint/suspicious/noArrayIndexKey: Stack position is unique per step frame
											key={`${stepIdx}-${i}`}
											initial={{ opacity: 0, y: 6 }}
											animate={{ opacity: 1, y: 0 }}
											className="px-2.5 py-1 rounded text-xs font-mono border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 w-fit flex items-center gap-2"
										>
											<span className="text-[10px] text-cyan-400/60 font-mono">
												[{i}]
											</span>
											<span>{frame}</span>
										</motion.div>
									))
								)}
							</div>
						</div>
					</div>

					<div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300 flex items-center justify-between">
						<div>
							<span className="text-emerald-400 font-semibold">
								Step {stepIdx + 1}/{STEPS.length}:
							</span>{" "}
							{step.note}
						</div>
						<span className="text-[10px] text-zinc-500 hidden sm:inline">
							Use ← / → keys
						</span>
					</div>
				</div>

				<div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100/90 leading-relaxed">
					<span className="font-semibold text-amber-200">
						Why a Stack is Necessary:
					</span>{" "}
					JSON contains arbitrary recursive nesting (e.g. nested objects and
					arrays). Regular expressions and pure Finite State Automata (FSA)
					cannot count matching opening/closing braces. Real production engines
					(<span className="font-mono">llama.cpp GBNF</span>,{" "}
					<span className="font-mono">Outlines</span>,{" "}
					<span className="font-mono">XGrammar</span>, OpenAI Structured
					Outputs) combine an FSA with a pushdown stack.
				</div>
			</div>
		</DemoSection>
	);
}
