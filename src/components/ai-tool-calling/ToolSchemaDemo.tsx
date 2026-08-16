import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

interface Scenario {
	id: string;
	label: string;
	description: string;
	schema: string;
	modelOutput: string;
	annotation: string;
}

const SCENARIOS: Scenario[] = [
	{
		id: "baseline",
		label: "Baseline schema",
		description: "name + description + input_schema with required field",
		schema: `{
  "name": "get_weather",
  "description": "Get current weather for a city.",
  "input_schema": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "City name, e.g. 'Tokyo'"
      }
    },
    "required": ["city"]
  }
}`,
		modelOutput: `{
  "type": "tool_use",
  "id": "tu_01ABC",
  "name": "get_weather",
  "input": {
    "city": "Tokyo"
  }
}`,
		annotation:
			'Model correctly names "get_weather" and provides "city" (required). Schema compliance is very high in practice but not token-level guaranteed — Anthropic does not constrain tool inputs the way OpenAI\'s structured-output strict mode does. Treat schemas as strong hints, not contracts.',
	},
	{
		id: "vague-desc",
		label: "Vague description",
		description:
			"Remove the description entirely — model has no 'when to call' signal",
		schema: `{
  "name": "get_weather",
  "description": "",
  "input_schema": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "City name"
      }
    },
    "required": ["city"]
  }
}`,
		modelOutput: `{
  "type": "text",
  "text": "The weather in Tokyo is likely warm this time of year."
}`,
		annotation:
			"Empty description → model doesn't know when this tool applies. It skips the tool call entirely and answers from parametric memory (which may be stale or wrong).",
	},
	{
		id: "no-required",
		label: "required[] removed",
		description: "Drop the required array — all fields become optional",
		schema: `{
  "name": "get_weather",
  "description": "Get current weather for a city.",
  "input_schema": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "City name"
      },
      "units": {
        "type": "string",
        "description": "Temperature unit: 'celsius' or 'fahrenheit'"
      }
    }
  }
}`,
		modelOutput: `{
  "type": "tool_use",
  "id": "tu_01XYZ",
  "name": "get_weather",
  "input": {}
}`,
		annotation:
			'No required fields → model may omit "city" when uncertain, sending an empty input object. Your function then throws a runtime error (or silently returns wrong data for an undefined city).',
	},
	{
		id: "wrong-name",
		label: "Hallucinated tool name",
		description: "Model emits a tool name not present in the tool list",
		schema: `// Tools provided to model:
// [ { name: "get_weather" }, { name: "calculator" } ]

// Model response (schema drift scenario):`,
		modelOutput: `{
  "type": "tool_use",
  "id": "tu_01ERR",
  "name": "fetch_temperature",   // ← not in tool list
  "input": { "location": "Tokyo" }
}`,
		annotation:
			'"fetch_temperature" was never declared. This happens when the tool list changes between turns (schema drift) or when the description is ambiguous. App must whitelist: if name ∉ tools → return is_error tool_result and let the model self-correct.',
	},
];

const FIELD_MAP = [
	{
		field: "name",
		maps: "tool_use.name must match exactly — the model's only way to reference this tool",
		color: "text-amber-300",
	},
	{
		field: "description",
		maps: "Primary signal for WHEN to call — more important than input_schema for routing decisions",
		color: "text-orange-300",
	},
	{
		field: "input_schema.properties",
		maps: "Defines what field names and types the model must produce in tool_use.input",
		color: "text-rose-300",
	},
	{
		field: "required[]",
		maps: "Fields the model MUST include — omit and the model may send incomplete inputs",
		color: "text-pink-300",
	},
];

export function ToolSchemaDemo() {
	const [active, setActive] = useState<string>("baseline");
	const scenario = SCENARIOS.find((s) => s.id === active) ?? SCENARIOS[0];

	return (
		<DemoSection
			title="Demo 2: Tool Schema Explorer"
			description={
				"The JSON Schema you declare is the model's \"API contract\" for a tool. The name, description, and required fields all influence whether the model calls the tool and whether the call is well-formed. Pick a scenario to see how schema choices affect the model's output."
			}
		>
			<div className="space-y-5">
				{/* Field mapping legend */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
					{FIELD_MAP.map((f) => (
						<div
							key={f.field}
							className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs"
						>
							<span className={`font-mono font-semibold ${f.color}`}>
								{f.field}
							</span>
							<span className="text-zinc-400"> → {f.maps}</span>
						</div>
					))}
				</div>

				{/* Scenario tabs */}
				<div className="flex flex-wrap gap-2">
					{SCENARIOS.map((s) => (
						<button
							key={s.id}
							type="button"
							onClick={() => setActive(s.id)}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
								active === s.id
									? "bg-amber-900/50 border-amber-600/60 text-amber-200"
									: "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
							}`}
						>
							{s.label}
						</button>
					))}
				</div>

				{/* Side-by-side */}
				<motion.div
					key={active}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.25 }}
					className="grid grid-cols-1 lg:grid-cols-2 gap-4"
				>
					<div>
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Tool definition (sent to model)
						</p>
						<ShikiCode language="json" code={scenario.schema} />
					</div>
					<div>
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Model output (hypothetical)
						</p>
						<ShikiCode language="json" code={scenario.modelOutput} />
					</div>
				</motion.div>

				{/* Annotation */}
				<motion.div
					key={`ann-${active}`}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.2 }}
					className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400"
				>
					<span className="text-amber-300 font-medium">What happened: </span>
					{scenario.annotation}
				</motion.div>

				{/* Strict mode note */}
				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-orange-300 font-medium">
						Schema compliance vs. guarantee:
					</span>{" "}
					The schema is a strong prompt signal — compliance is very high in
					practice but not mathematically guaranteed. Anthropic's{" "}
					<span className="font-mono text-zinc-300">tool_choice</span> field
					lets you force the model to call <em>some</em> tool (
					<span className="font-mono text-zinc-300">any</span>) or a specific
					tool by name, but the <em>structure</em> of the input is still
					model-generated and can drift. For hard structural guarantees, use
					constrained decoding (see Structured Output topic).
				</div>
			</div>
		</DemoSection>
	);
}
