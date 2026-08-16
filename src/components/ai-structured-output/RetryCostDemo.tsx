import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

const BASE_TOKENS_PER_REQUEST = 400;
const MAX_RETRIES = 3;
const BASE_LATENCY_MS = 800;

interface ModelPreset {
	id: string;
	name: string;
	costPerMillionTokens: number;
}

const MODEL_PRESETS: ModelPreset[] = [
	{ id: "gpt-4o", name: "GPT-4o", costPerMillionTokens: 6.25 },
	{ id: "claude-sonnet", name: "Claude 3.5 Sonnet", costPerMillionTokens: 9.0 },
	{
		id: "llama-70b",
		name: "Llama 3.3 70B (Hosted)",
		costPerMillionTokens: 0.6,
	},
	{ id: "self-hosted", name: "Self-Hosted GPU", costPerMillionTokens: 0.2 },
];

interface SimulationResult {
	naive: {
		requestsSent: number;
		tokensUsed: number;
		p50LatencyMs: number;
		p90LatencyMs: number;
		p99LatencyMs: number;
		unrecoverable: number;
		dollarCost: number;
		attemptCounts: [number, number, number, number, number]; // [1 try, 2 tries, 3 tries, 4 tries, fail]
	};
	constrained: {
		requestsSent: number;
		tokensUsed: number;
		p50LatencyMs: number;
		p90LatencyMs: number;
		p99LatencyMs: number;
		unrecoverable: number;
		dollarCost: number;
	};
}

function simulate(
	failureRate: number,
	totalRequests: number,
	costPerMillion: number,
): SimulationResult {
	const latencies: number[] = [];
	let naiveRequests = 0;
	let naiveTokens = 0;
	let unrecoverable = 0;
	const attemptCounts: [number, number, number, number, number] = [
		0, 0, 0, 0, 0,
	];

	for (let i = 0; i < totalRequests; i++) {
		let attempt = 0;
		let succeeded = false;
		while (attempt < 1 + MAX_RETRIES) {
			attempt++;
			naiveRequests++;
			naiveTokens += BASE_TOKENS_PER_REQUEST;
			const fail = Math.random() < failureRate;
			if (!fail) {
				succeeded = true;
				break;
			}
		}

		latencies.push(attempt * BASE_LATENCY_MS);

		if (succeeded) {
			attemptCounts[attempt - 1]++;
		} else {
			unrecoverable++;
			attemptCounts[4]++;
		}
	}

	latencies.sort((a, b) => a - b);
	const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? BASE_LATENCY_MS;
	const p90 = latencies[Math.floor(latencies.length * 0.9)] ?? BASE_LATENCY_MS;
	const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? BASE_LATENCY_MS;

	const naiveCost = (naiveTokens / 1_000_000) * costPerMillion;
	const constrainedTokens = totalRequests * BASE_TOKENS_PER_REQUEST;
	const constrainedCost = (constrainedTokens / 1_000_000) * costPerMillion;

	// Enforced Schema adds tiny mask computation overhead (~25ms) but 0 retries
	const constrainedLatency = Math.round(BASE_LATENCY_MS * 1.03);

	return {
		naive: {
			requestsSent: naiveRequests,
			tokensUsed: naiveTokens,
			p50LatencyMs: p50,
			p90LatencyMs: p90,
			p99LatencyMs: p99,
			unrecoverable,
			dollarCost: naiveCost,
			attemptCounts,
		},
		constrained: {
			requestsSent: totalRequests,
			tokensUsed: constrainedTokens,
			p50LatencyMs: constrainedLatency,
			p90LatencyMs: constrainedLatency,
			p99LatencyMs: constrainedLatency,
			unrecoverable: 0,
			dollarCost: constrainedCost,
		},
	};
}

function formatTokens(n: number) {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return n.toString();
}

function formatCurrency(n: number) {
	if (n < 0.01) return `< $0.01`;
	return `$${n.toFixed(2)}`;
}

export function RetryCostDemo() {
	const [failureRate, setFailureRate] = useState(0.15);
	const [totalRequests, setTotalRequests] = useState(100);
	const [selectedModelId, setSelectedModelId] = useState(MODEL_PRESETS[0].id);
	const [seed, setSeed] = useState(0);

	const selectedModel =
		MODEL_PRESETS.find((m) => m.id === selectedModelId) ?? MODEL_PRESETS[0];

	const results = useMemo(() => {
		void seed;
		return simulate(
			failureRate,
			totalRequests,
			selectedModel.costPerMillionTokens,
		);
	}, [failureRate, totalRequests, selectedModel.costPerMillionTokens, seed]);

	const maxRequests = Math.max(
		results.naive.requestsSent,
		results.constrained.requestsSent,
	);
	const maxTokens = Math.max(
		results.naive.tokensUsed,
		results.constrained.tokensUsed,
	);
	const maxLatency = Math.max(
		results.naive.p99LatencyMs,
		results.constrained.p99LatencyMs,
	);
	const maxCost = Math.max(
		results.naive.dollarCost,
		results.constrained.dollarCost,
	);

	const requestMultiplier =
		results.naive.requestsSent / results.constrained.requestsSent;
	const wastedSpend = results.naive.dollarCost - results.constrained.dollarCost;
	const extraCalls = results.naive.requestsSent - totalRequests;

	return (
		<DemoSection
			title="4. Cost: Prompt & Retry vs Enforced Schema"
			description="Compare the total API calls, token burn, tail latency, and cost required to complete the target workload across both methods."
		>
			<div className="space-y-4">
				{/* Horizontally & Vertically Aligned Controls Bar */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950/60 border border-zinc-800 p-4 rounded-lg items-start">
					{/* Control 1: Failure Rate */}
					<div className="space-y-2">
						<div className="flex items-center justify-between h-6">
							<label
								htmlFor="failure-rate"
								className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium"
							>
								Parse Failure Rate
							</label>
							<span className="text-rose-300 font-mono font-semibold text-xs">
								{(failureRate * 100).toFixed(0)}%
							</span>
						</div>
						<div className="h-8 flex items-center">
							<input
								id="failure-rate"
								type="range"
								min={0}
								max={0.35}
								step={0.01}
								value={failureRate}
								onChange={(e) => setFailureRate(Number(e.target.value))}
								className="w-full accent-rose-400 cursor-pointer"
							/>
						</div>
						<div className="flex justify-between text-[10px] text-zinc-500">
							<span>0% (Perfect)</span>
							<span>15% (Typical)</span>
							<span>35% (Complex)</span>
						</div>
					</div>

					{/* Control 2: Target Workload */}
					<div className="space-y-2">
						<div className="flex items-center justify-between h-6">
							<label
								htmlFor="request-volume"
								className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium"
							>
								Target Workload
							</label>
							<span className="text-cyan-300 font-mono font-semibold text-xs">
								{totalRequests.toLocaleString()} tasks
							</span>
						</div>
						<div className="h-8 flex items-center">
							<select
								id="request-volume"
								value={totalRequests}
								onChange={(e) => setTotalRequests(Number(e.target.value))}
								className="w-full h-8 text-xs font-mono bg-zinc-900 border border-zinc-700 text-zinc-200 rounded px-2 focus:outline-none focus:border-cyan-500"
							>
								<option value={100}>100 tasks (interactive sample)</option>
								<option value={1000}>1,000 tasks (batch job)</option>
								<option value={10000}>10,000 tasks (daily production)</option>
								<option value={100000}>100,000 tasks (monthly service)</option>
							</select>
						</div>
						<div className="text-[10px] text-zinc-500">
							Tasks to be successfully completed
						</div>
					</div>

					{/* Control 3: Pricing & Seed */}
					<div className="space-y-2">
						<div className="flex items-center justify-between h-6">
							<span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
								Model Pricing
							</span>
							<button
								type="button"
								onClick={() => setSeed((s) => s + 1)}
								className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
							>
								Re-roll seed
							</button>
						</div>
						<div className="h-8 flex items-center">
							<select
								value={selectedModelId}
								onChange={(e) => setSelectedModelId(e.target.value)}
								className="w-full h-8 text-xs font-mono bg-zinc-900 border border-zinc-700 text-zinc-200 rounded px-2 focus:outline-none focus:border-emerald-500"
							>
								{MODEL_PRESETS.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name} (~${m.costPerMillionTokens}/1M tok)
									</option>
								))}
							</select>
						</div>
						<div className="text-[10px] text-zinc-500">
							Simulated API token pricing rate
						</div>
					</div>
				</div>

				{/* 4 Metric Comparison Bars with Subtitles */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<MetricBars
						title="Total API Calls"
						subtitle={`to finish ${totalRequests.toLocaleString()} tasks`}
						unit="calls"
						naive={results.naive.requestsSent}
						constrained={results.constrained.requestsSent}
						max={maxRequests}
						format={(n) => n.toLocaleString()}
					/>
					<MetricBars
						title="Tokens Consumed"
						subtitle="prompt + completion tokens"
						unit="tok"
						naive={results.naive.tokensUsed}
						constrained={results.constrained.tokensUsed}
						max={maxTokens}
						format={formatTokens}
					/>
					<MetricBars
						title="p99 Latency"
						subtitle="slowest 1% user response"
						unit="ms"
						naive={results.naive.p99LatencyMs}
						constrained={results.constrained.p99LatencyMs}
						max={maxLatency}
						format={(n) => `${n}`}
					/>
					<MetricBars
						title="Estimated Cost"
						subtitle="total workload spend"
						unit="USD"
						naive={results.naive.dollarCost}
						constrained={results.constrained.dollarCost}
						max={Math.max(maxCost, 0.01)}
						format={formatCurrency}
					/>
				</div>

				{/* Attempt Distribution Breakdown */}
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] uppercase tracking-wider text-zinc-500">
							Prompt &amp; Retry Attempt Breakdown (
							{totalRequests.toLocaleString()} Target Tasks)
						</span>
						<span className="text-xs font-mono text-zinc-400">
							{((results.naive.attemptCounts[0] / totalRequests) * 100).toFixed(
								0,
							)}
							% First-Pass Success
						</span>
					</div>

					<div className="h-4 w-full bg-zinc-900 rounded overflow-hidden flex">
						{results.naive.attemptCounts[0] > 0 && (
							<div
								style={{
									width: `${(results.naive.attemptCounts[0] / totalRequests) * 100}%`,
								}}
								className="bg-emerald-500/80 h-full"
								title={`1st Try: ${results.naive.attemptCounts[0]} (${((results.naive.attemptCounts[0] / totalRequests) * 100).toFixed(1)}%)`}
							/>
						)}
						{results.naive.attemptCounts[1] > 0 && (
							<div
								style={{
									width: `${(results.naive.attemptCounts[1] / totalRequests) * 100}%`,
								}}
								className="bg-amber-400/80 h-full"
								title={`Retry #1: ${results.naive.attemptCounts[1]} (${((results.naive.attemptCounts[1] / totalRequests) * 100).toFixed(1)}%)`}
							/>
						)}
						{results.naive.attemptCounts[2] > 0 && (
							<div
								style={{
									width: `${(results.naive.attemptCounts[2] / totalRequests) * 100}%`,
								}}
								className="bg-orange-500/80 h-full"
								title={`Retry #2: ${results.naive.attemptCounts[2]} (${((results.naive.attemptCounts[2] / totalRequests) * 100).toFixed(1)}%)`}
							/>
						)}
						{results.naive.attemptCounts[3] > 0 && (
							<div
								style={{
									width: `${(results.naive.attemptCounts[3] / totalRequests) * 100}%`,
								}}
								className="bg-rose-500/80 h-full"
								title={`Retry #3: ${results.naive.attemptCounts[3]} (${((results.naive.attemptCounts[3] / totalRequests) * 100).toFixed(1)}%)`}
							/>
						)}
						{results.naive.attemptCounts[4] > 0 && (
							<div
								style={{
									width: `${(results.naive.attemptCounts[4] / totalRequests) * 100}%`,
								}}
								className="bg-red-700 h-full"
								title={`Unrecoverable: ${results.naive.attemptCounts[4]} (${((results.naive.attemptCounts[4] / totalRequests) * 100).toFixed(1)}%)`}
							/>
						)}
					</div>

					<div className="flex flex-wrap gap-4 text-[11px] text-zinc-400">
						<span className="inline-flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
							1st Try ({results.naive.attemptCounts[0].toLocaleString()})
						</span>
						<span className="inline-flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-amber-400/80" />
							Retry #1 ({results.naive.attemptCounts[1].toLocaleString()})
						</span>
						<span className="inline-flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-orange-500/80" />
							Retry #2 ({results.naive.attemptCounts[2].toLocaleString()})
						</span>
						<span className="inline-flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80" />
							Retry #3 ({results.naive.attemptCounts[3].toLocaleString()})
						</span>
						{results.naive.unrecoverable > 0 && (
							<span className="inline-flex items-center gap-1.5 text-rose-300 font-semibold">
								<span className="w-2.5 h-2.5 rounded-sm bg-red-700" />
								Failed completely (
								{results.naive.unrecoverable.toLocaleString()})
							</span>
						)}
					</div>
				</div>

				{/* Impact Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
					<div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-1.5">
						<div className="text-rose-200 font-semibold flex items-center justify-between">
							<span>
								Prompt &amp; Retry:{" "}
								{results.naive.requestsSent.toLocaleString()} Calls
							</span>
							<span className="font-mono text-[11px] text-rose-300">
								+{extraCalls.toLocaleString()} retries (
								{requestMultiplier.toFixed(2)}× calls)
							</span>
						</div>
						<div className="text-zinc-300 leading-relaxed">
							Latency percentile distribution:{" "}
							<span className="font-mono text-zinc-200">
								p50: {results.naive.p50LatencyMs}ms | p90:{" "}
								{results.naive.p90LatencyMs}ms | p99:{" "}
								{results.naive.p99LatencyMs}ms
							</span>
							. Tail latency expands up to {1 + MAX_RETRIES} attempts.{" "}
							{results.naive.unrecoverable > 0 ? (
								<span className="text-rose-300 font-medium">
									{results.naive.unrecoverable.toLocaleString()} tasks failed
									entirely after {MAX_RETRIES} retries.
								</span>
							) : (
								"All tasks succeeded within retry limits."
							)}
						</div>
					</div>

					<div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1.5">
						<div className="text-emerald-200 font-semibold flex items-center justify-between">
							<span>
								Enforced Schema:{" "}
								{results.constrained.requestsSent.toLocaleString()} Calls
							</span>
							<span className="font-mono text-[11px] text-emerald-300">
								0 Retries Needed (1 Call / Task)
							</span>
						</div>
						<div className="text-zinc-300 leading-relaxed">
							Latency is deterministic:{" "}
							<span className="font-mono text-zinc-200">
								p50 = p90 = p99 ≈ {results.constrained.p99LatencyMs}ms
							</span>
							. Wasted financial spend eliminated:{" "}
							<span className="font-mono text-emerald-300 font-semibold">
								{wastedSpend > 0
									? `${formatCurrency(wastedSpend)} saved`
									: "$0.00 saved"}
							</span>
							. First-pass schema compliance is 100.0%.
						</div>
					</div>
				</div>

				<div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-400 leading-relaxed">
					<span className="text-zinc-300 font-medium">
						Understanding the Comparison:
					</span>{" "}
					Both methods aim to complete the exact same{" "}
					<span className="text-cyan-300 font-medium">
						{totalRequests.toLocaleString()} target tasks
					</span>
					. While{" "}
					<span className="text-emerald-300 font-medium">Enforced Schema</span>{" "}
					accomplishes this in exactly {totalRequests.toLocaleString()} calls,{" "}
					<span className="text-rose-300 font-medium">Prompt &amp; Retry</span>{" "}
					requires {results.naive.requestsSent.toLocaleString()} calls because{" "}
					{extraCalls.toLocaleString()} calls failed JSON validation and had to
					be re-run.
				</div>
			</div>
		</DemoSection>
	);
}

function MetricBars({
	title,
	subtitle,
	unit,
	naive,
	constrained,
	max,
	format,
}: {
	title: string;
	subtitle?: string;
	unit: string;
	naive: number;
	constrained: number;
	max: number;
	format: (n: number) => string;
}) {
	const naivePct = max === 0 ? 0 : (naive / max) * 100;
	const conPct = max === 0 ? 0 : (constrained / max) * 100;

	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-3 flex flex-col justify-between">
			<div>
				<div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
					{title}
				</div>
				{subtitle && (
					<div className="text-[10px] text-zinc-500 mt-0.5">{subtitle}</div>
				)}
			</div>
			<div className="space-y-2">
				<div>
					<div className="flex justify-between text-xs mb-1">
						<span className="text-rose-300">Prompt &amp; Retry</span>
						<span className="font-mono tabular-nums text-zinc-300">
							{format(naive)} {unit}
						</span>
					</div>
					<div className="h-2 bg-zinc-900 rounded overflow-hidden">
						<motion.div
							className="h-full bg-rose-500/70"
							initial={false}
							animate={{ width: `${naivePct}%` }}
							transition={{ duration: 0.35 }}
						/>
					</div>
				</div>
				<div>
					<div className="flex justify-between text-xs mb-1">
						<span className="text-emerald-300">Enforced Schema</span>
						<span className="font-mono tabular-nums text-zinc-300">
							{format(constrained)} {unit}
						</span>
					</div>
					<div className="h-2 bg-zinc-900 rounded overflow-hidden">
						<motion.div
							className="h-full bg-emerald-500/70"
							initial={false}
							animate={{ width: `${conPct}%` }}
							transition={{ duration: 0.35 }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
