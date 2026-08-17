import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

interface SpanAttribute {
	key: string;
	value: string | number | boolean;
}

interface TraceSpan {
	id: string;
	name: string;
	kind: "agent" | "llm" | "tool" | "cache";
	startMs: number;
	durationMs: number;
	status: "ok" | "error" | "cached";
	model?: string;
	promptTokens?: number;
	completionTokens?: number;
	costUsd?: number;
	input: string;
	output: string;
	attributes: SpanAttribute[];
}

interface Scenario {
	id: string;
	name: string;
	description: string;
	totalDurationMs: number;
	totalTokens: number;
	totalCostUsd: number;
	spans: TraceSpan[];
}

const SCENARIOS: Scenario[] = [
	{
		id: "multi-tool",
		name: "Multi-turn Agent Trace",
		description:
			"Standard agent execution with tool calling, reasoning hops, and final synthesis.",
		totalDurationMs: 1620,
		totalTokens: 680,
		totalCostUsd: 0.0034,
		spans: [
			{
				id: "span-1",
				name: "Agent.run()",
				kind: "agent",
				startMs: 0,
				durationMs: 1620,
				status: "ok",
				input: '{"user_query": "What is the weather in Paris and Tokyo?"}',
				output:
					'{"response": "Paris is 22°C (Sunny) and Tokyo is 18°C (Light Rain)."}',
				attributes: [
					{ key: "gen_ai.system", value: "anthropic" },
					{ key: "agent.session_id", value: "sess_889a2b" },
					{ key: "agent.max_iterations", value: 5 },
				],
			},
			{
				id: "span-2",
				name: "LLM.generate (Plan & Tool Call)",
				kind: "llm",
				startMs: 40,
				durationMs: 520,
				status: "ok",
				model: "claude-3-5-sonnet",
				promptTokens: 240,
				completionTokens: 65,
				costUsd: 0.0012,
				input:
					"System: You are an agent...\nUser: What is the weather in Paris?",
				output: 'tool_call: get_weather({"city": "Paris", "units": "metric"})',
				attributes: [
					{ key: "gen_ai.request.model", value: "claude-3-5-sonnet-20241022" },
					{ key: "gen_ai.request.temperature", value: 0.2 },
					{ key: "gen_ai.usage.prompt_tokens", value: 240 },
					{ key: "gen_ai.usage.completion_tokens", value: 65 },
					{ key: "gen_ai.response.finish_reasons", value: '["tool_use"]' },
				],
			},
			{
				id: "span-3",
				name: "Tool.get_weather(Paris)",
				kind: "tool",
				startMs: 570,
				durationMs: 240,
				status: "ok",
				input: '{"city": "Paris", "units": "metric"}',
				output: '{"temp_c": 22, "condition": "Sunny", "humidity": 48}',
				attributes: [
					{ key: "tool.name", value: "get_weather" },
					{ key: "http.status_code", value: 200 },
					{ key: "net.peer.name", value: "api.weatherapi.com" },
				],
			},
			{
				id: "span-4",
				name: "LLM.generate (Tool Call Tokyo)",
				kind: "llm",
				startMs: 820,
				durationMs: 390,
				status: "ok",
				model: "claude-3-5-sonnet",
				promptTokens: 330,
				completionTokens: 45,
				costUsd: 0.0014,
				input: "Observation: Paris is 22C Sunny. Query: Tokyo weather?",
				output: 'tool_call: get_weather({"city": "Tokyo", "units": "metric"})',
				attributes: [
					{ key: "gen_ai.request.model", value: "claude-3-5-sonnet-20241022" },
					{ key: "gen_ai.usage.prompt_tokens", value: 330 },
					{ key: "gen_ai.usage.completion_tokens", value: 45 },
				],
			},
			{
				id: "span-5",
				name: "Tool.get_weather(Tokyo)",
				kind: "tool",
				startMs: 1220,
				durationMs: 160,
				status: "ok",
				input: '{"city": "Tokyo", "units": "metric"}',
				output: '{"temp_c": 18, "condition": "Light Rain", "humidity": 82}',
				attributes: [
					{ key: "tool.name", value: "get_weather" },
					{ key: "http.status_code", value: 200 },
				],
			},
			{
				id: "span-6",
				name: "LLM.generate (Synthesize Answer)",
				kind: "llm",
				startMs: 1390,
				durationMs: 220,
				status: "ok",
				model: "claude-3-5-sonnet",
				promptTokens: 410,
				completionTokens: 38,
				costUsd: 0.0008,
				input: "Observations: Paris 22C, Tokyo 18C. Synthesize response.",
				output: "Paris is 22°C (Sunny) and Tokyo is 18°C (Light Rain).",
				attributes: [
					{ key: "gen_ai.request.model", value: "claude-3-5-sonnet-20241022" },
					{ key: "gen_ai.usage.prompt_tokens", value: 410 },
					{ key: "gen_ai.usage.completion_tokens", value: 38 },
					{ key: "gen_ai.response.finish_reasons", value: '["stop"]' },
				],
			},
		],
	},
	{
		id: "error-recovery",
		name: "Tool Timeout & Error Recovery",
		description:
			"Trace exhibiting downstream HTTP 504 timeout, exception span tagging, and prompt self-correction.",
		totalDurationMs: 2840,
		totalTokens: 1120,
		totalCostUsd: 0.0056,
		spans: [
			{
				id: "err-1",
				name: "Agent.run()",
				kind: "agent",
				startMs: 0,
				durationMs: 2840,
				status: "ok",
				input: '{"user_query": "Fetch analytics data for Q3"}',
				output:
					'{"response": "Primary DB timed out. Recovered from replica cluster with Q3 metrics."}',
				attributes: [
					{ key: "gen_ai.system", value: "openai" },
					{ key: "agent.retries_allowed", value: 2 },
				],
			},
			{
				id: "err-2",
				name: "LLM.generate (Dispatch Query)",
				kind: "llm",
				startMs: 30,
				durationMs: 480,
				status: "ok",
				model: "gpt-4o",
				promptTokens: 290,
				completionTokens: 50,
				costUsd: 0.0018,
				input: "Fetch analytics for Q3 from SQL database.",
				output: 'tool_call: sql_query({"cluster": "primary", "db": "metrics"})',
				attributes: [
					{ key: "gen_ai.request.model", value: "gpt-4o" },
					{ key: "gen_ai.usage.prompt_tokens", value: 290 },
				],
			},
			{
				id: "err-3",
				name: "Tool.sql_query(primary) [TIMEOUT]",
				kind: "tool",
				startMs: 520,
				durationMs: 1200,
				status: "error",
				input: '{"cluster": "primary", "query": "SELECT * FROM q3_metrics"}',
				output:
					'{"error": "GatewayTimeout", "message": "Connection to primary database timed out after 1200ms"}',
				attributes: [
					{ key: "error.type", value: "GatewayTimeout" },
					{ key: "otel.status_code", value: "ERROR" },
					{ key: "exception.message", value: "Connection timed out" },
				],
			},
			{
				id: "err-4",
				name: "LLM.generate (Fallback Strategy)",
				kind: "llm",
				startMs: 1730,
				durationMs: 440,
				status: "ok",
				model: "gpt-4o",
				promptTokens: 420,
				completionTokens: 40,
				costUsd: 0.0022,
				input: "Error: primary cluster timed out. Fallback to replica cluster.",
				output: 'tool_call: sql_query({"cluster": "replica", "db": "metrics"})',
				attributes: [
					{ key: "gen_ai.request.model", value: "gpt-4o" },
					{ key: "gen_ai.usage.prompt_tokens", value: 420 },
				],
			},
			{
				id: "err-5",
				name: "Tool.sql_query(replica)",
				kind: "tool",
				startMs: 2180,
				durationMs: 280,
				status: "ok",
				input: '{"cluster": "replica", "query": "SELECT * FROM q3_metrics"}',
				output: '{"rows": 4820, "revenue": "$1.42M", "status": "completed"}',
				attributes: [
					{ key: "tool.name", value: "sql_query" },
					{ key: "http.status_code", value: 200 },
				],
			},
			{
				id: "err-6",
				name: "LLM.generate (Final Response)",
				kind: "llm",
				startMs: 2470,
				durationMs: 360,
				status: "ok",
				model: "gpt-4o",
				promptTokens: 370,
				completionTokens: 42,
				costUsd: 0.0016,
				input: "Synthesize findings for Q3 from replica data.",
				output:
					"Primary DB timed out. Recovered from replica cluster with Q3 metrics ($1.42M).",
				attributes: [
					{ key: "gen_ai.request.model", value: "gpt-4o" },
					{ key: "gen_ai.usage.completion_tokens", value: 42 },
				],
			},
		],
	},
	{
		id: "cache-hit",
		name: "Semantic Cache Hit",
		description:
			"Prompt embedding matches cached vector in Redis/KV, avoiding expensive LLM generation.",
		totalDurationMs: 45,
		totalTokens: 0,
		totalCostUsd: 0.0,
		spans: [
			{
				id: "c-1",
				name: "Agent.run()",
				kind: "agent",
				startMs: 0,
				durationMs: 45,
				status: "cached",
				input: '{"user_query": "How do I reset my API key?"}',
				output:
					'{"response": "Navigate to Settings > API Keys > Click \'Regenerate Secret\'."}',
				attributes: [
					{ key: "gen_ai.system", value: "semantic-cache" },
					{ key: "cache.hit", value: true },
				],
			},
			{
				id: "c-2",
				name: "Cache.semantic_lookup",
				kind: "cache",
				startMs: 5,
				durationMs: 38,
				status: "cached",
				input: '{"query_embedding_cosine_threshold": 0.94}',
				output:
					'{"cache_key": "faq:api_key_reset", "similarity": 0.982, "saved_ms": 1400}',
				attributes: [
					{ key: "db.system", value: "redis" },
					{ key: "vector.similarity_score", value: 0.982 },
					{ key: "gen_ai.cost.saved_usd", value: 0.0024 },
				],
			},
		],
	},
];

export function OpenTelemetryTraceDemo() {
	const [activeScenarioId, setActiveScenarioId] = useState("multi-tool");
	const [selectedSpanId, setSelectedSpanId] = useState<string>("span-2");

	const scenario =
		SCENARIOS.find((s) => s.id === activeScenarioId) ?? SCENARIOS[0];
	const selectedSpan =
		scenario.spans.find((s) => s.id === selectedSpanId) ?? scenario.spans[0];

	const handleScenarioChange = (id: string) => {
		setActiveScenarioId(id);
		const target = SCENARIOS.find((s) => s.id === id);
		if (target && target.spans.length > 0) {
			setSelectedSpanId(target.spans[0].id);
		}
	};

	return (
		<DemoSection
			title="Demo 1: OpenTelemetry Agent Trace Inspector"
			description="Waterfall timeline and span attributes conforming to GenAI OpenTelemetry semantic conventions. Inspect latency, token usage, cost breakdowns, and nested sub-operations."
		>
			<div className="space-y-6">
				{/* Scenario Switcher */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap gap-2">
						{SCENARIOS.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => handleScenarioChange(s.id)}
								className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
									activeScenarioId === s.id
										? "border-violet-500/60 bg-violet-500/10 text-violet-200"
										: "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
								}`}
							>
								{s.name}
							</button>
						))}
					</div>
					<div className="text-xs text-zinc-500 font-mono">
						Total Trace Latency: {scenario.totalDurationMs}ms
					</div>
				</div>

				<p className="text-xs text-zinc-400">{scenario.description}</p>

				{/* Waterfall Timeline */}
				<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 font-mono text-xs overflow-hidden">
					{/* Header axis */}
					<div className="flex items-center gap-4 border-b border-zinc-800 pb-2 mb-4 text-zinc-500">
						<div className="w-56 shrink-0">Span / Operation</div>
						<div className="flex-1 flex justify-between text-[10px]">
							<span>0ms</span>
							<span>{Math.round(scenario.totalDurationMs * 0.25)}ms</span>
							<span>{Math.round(scenario.totalDurationMs * 0.5)}ms</span>
							<span>{Math.round(scenario.totalDurationMs * 0.75)}ms</span>
							<span>{scenario.totalDurationMs}ms</span>
						</div>
					</div>

					{/* Spans */}
					<div className="space-y-2.5">
						{scenario.spans.map((span) => {
							const leftPercent =
								(span.startMs / scenario.totalDurationMs) * 100;
							const widthPercent = Math.max(
								(span.durationMs / scenario.totalDurationMs) * 100,
								3,
							);
							const isSelected = selectedSpan?.id === span.id;

							const barColors =
								span.status === "error"
									? "bg-rose-500/20 border-rose-500/40 text-rose-300 group-hover:bg-rose-500/30"
									: span.kind === "agent"
										? "bg-blue-500/20 border-blue-500/30 text-blue-300 group-hover:bg-blue-500/30"
										: span.kind === "llm"
											? "bg-violet-500/20 border-violet-500/30 text-violet-300 group-hover:bg-violet-500/30"
											: span.kind === "tool"
												? "bg-amber-500/20 border-amber-500/30 text-amber-300 group-hover:bg-amber-500/30"
												: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 group-hover:bg-emerald-500/30";

							const labelColor =
								span.status === "error"
									? "text-rose-400"
									: span.kind === "agent"
										? "text-blue-400"
										: span.kind === "llm"
											? "text-violet-400"
											: span.kind === "tool"
												? "text-amber-400"
												: "text-emerald-400";

							return (
								<button
									type="button"
									key={span.id}
									onClick={() => setSelectedSpanId(span.id)}
									className={`w-full flex items-center gap-4 group cursor-pointer p-1 rounded text-left transition-colors ${
										isSelected ? "bg-zinc-900/80 ring-1 ring-zinc-700" : ""
									}`}
								>
									<div
										className={`w-56 shrink-0 truncate flex items-center gap-2 ${labelColor}`}
									>
										<span
											className={`inline-block w-1.5 h-1.5 rounded-full ${
												span.status === "error"
													? "bg-rose-400"
													: span.status === "cached"
														? "bg-emerald-400"
														: "bg-blue-400"
											}`}
										/>
										<span className="font-mono text-xs">{span.name}</span>
									</div>

									<div className="flex-1 relative h-6 bg-zinc-900/40 rounded overflow-hidden">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${widthPercent}%` }}
											transition={{ duration: 0.35 }}
											style={{ left: `${leftPercent}%` }}
											className={`absolute top-0.5 bottom-0.5 rounded border flex items-center px-2 text-[10px] whitespace-nowrap overflow-hidden transition-all ${barColors} ${
												isSelected ? "ring-1 ring-white/30 font-semibold" : ""
											}`}
										>
											<span>{span.durationMs}ms</span>
											{span.promptTokens !== undefined && (
												<span className="ml-2 opacity-70">
													· {span.promptTokens + (span.completionTokens ?? 0)}t
												</span>
											)}
										</motion.div>
									</div>
								</button>
							);
						})}
					</div>
				</div>

				{/* Span Details Inspector */}
				{selectedSpan && (
					<motion.div
						key={selectedSpan.id}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 space-y-4"
					>
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
							<div className="flex items-center gap-2.5">
								<span className="font-mono text-sm font-semibold text-zinc-100">
									{selectedSpan.name}
								</span>
								<span
									className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${
										selectedSpan.status === "error"
											? "border-rose-500/40 bg-rose-500/10 text-rose-300"
											: selectedSpan.status === "cached"
												? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
												: "border-blue-500/40 bg-blue-500/10 text-blue-300"
									}`}
								>
									{selectedSpan.status.toUpperCase()}
								</span>
							</div>
							<div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
								<span>
									Duration:{" "}
									<strong className="text-zinc-200">
										{selectedSpan.durationMs}ms
									</strong>
								</span>
								{selectedSpan.costUsd !== undefined && (
									<span>
										Cost:{" "}
										<strong className="text-zinc-200">
											${selectedSpan.costUsd.toFixed(4)}
										</strong>
									</span>
								)}
							</div>
						</div>

						{/* Semantic Attributes Grid */}
						<div>
							<div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
								OpenTelemetry GenAI Semantic Attributes
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
								{selectedSpan.attributes.map((attr) => (
									<div
										key={attr.key}
										className="rounded border border-zinc-800 bg-zinc-950 p-2 text-xs font-mono"
									>
										<div className="text-[10px] text-zinc-500 truncate">
											{attr.key}
										</div>
										<div className="text-zinc-200 truncate mt-0.5 font-medium">
											{String(attr.value)}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Input & Output Payloads */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
							<div>
								<div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
									Span Input / Parameters
								</div>
								<ShikiCode
									code={selectedSpan.input}
									language="json"
									showLineNumbers={false}
									className="max-h-36 overflow-y-auto"
								/>
							</div>
							<div>
								<div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
									Span Output / Observation
								</div>
								<ShikiCode
									code={selectedSpan.output}
									language="json"
									showLineNumbers={false}
									className="max-h-36 overflow-y-auto"
								/>
							</div>
						</div>
					</motion.div>
				)}

				{/* Summary Metrics */}
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<Metric
						label="Total Latency"
						value={`${scenario.totalDurationMs}ms`}
					/>
					<Metric
						label="Total Tokens"
						value={scenario.totalTokens.toString()}
					/>
					<Metric
						label="Trace Cost"
						value={`$${scenario.totalCostUsd.toFixed(4)}`}
					/>
					<Metric
						label="Total Spans"
						value={scenario.spans.length.toString()}
					/>
				</div>
			</div>
		</DemoSection>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className="font-mono text-lg font-semibold text-zinc-200">
				{value}
			</div>
		</div>
	);
}
