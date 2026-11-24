import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import {
	buildTable,
	CACHE_ENTRIES,
	countByUser,
	DNS_ENTRIES,
	dedupe,
	EVENT_STREAM,
	lookup,
	RATE_LIMIT,
	rateLimit,
	TABLE_SIZE,
	tagDuplicates,
} from "./useCases";

type Tab = "lookup" | "pipeline";
type Dataset = "cache" | "dns";

const selectClass =
	"rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200";

function LookupPanel() {
	const [dataset, setDataset] = useState<Dataset>("cache");
	const [query, setQuery] = useState(CACHE_ENTRIES[0]?.key ?? "");

	const entries = match(dataset)
		.with("cache", () => CACHE_ENTRIES)
		.with("dns", () => DNS_ENTRIES)
		.exhaustive();
	const table = buildTable(entries, TABLE_SIZE);
	const result = lookup(table, query);
	const filled = table.filter((chain) => chain.length > 0).length;

	function chooseDataset(next: Dataset) {
		const first = match(next)
			.with("cache", () => CACHE_ENTRIES[0])
			.with("dns", () => DNS_ENTRIES[0])
			.exhaustive();
		setDataset(next);
		setQuery(first?.key ?? "");
	}

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-2">
				<label htmlFor="uc-dataset" className="text-sm text-zinc-400">
					Table
				</label>
				<select
					id="uc-dataset"
					value={dataset}
					onChange={(event) => chooseDataset(event.target.value as Dataset)}
					className={selectClass}
				>
					<option value="cache">HTTP cache</option>
					<option value="dns">DNS resolver</option>
				</select>
				<label htmlFor="uc-query" className="text-sm text-zinc-400">
					Look up
				</label>
				<select
					id="uc-query"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					className={selectClass}
				>
					{entries.map(({ key }) => (
						<option key={key} value={key}>
							{key}
						</option>
					))}
				</select>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{table.map((chain, bucket) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: bucket index is the identity
						key={`bucket-${bucket}`}
						className={`rounded-lg border p-2 ${
							bucket === result.bucket
								? "border-purple-500/50 bg-purple-500/10"
								: "border-zinc-800 bg-zinc-950/40"
						}`}
					>
						<p className="mb-1 font-mono text-[10px] text-zinc-500">
							bucket {bucket}
						</p>
						<div className="space-y-1">
							{chain.length === 0 ? (
								<p className="text-[10px] text-zinc-700">empty</p>
							) : (
								chain.map((entry, position) => {
									const isMatch =
										bucket === result.bucket && entry.key === query;
									const scanned =
										bucket === result.bucket && position < result.comparisons;
									const tone = match({ isMatch, scanned })
										.with(
											{ isMatch: true },
											() =>
												"border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
										)
										.with(
											{ scanned: true },
											() => "border-amber-500/30 bg-amber-500/5 text-amber-300",
										)
										.otherwise(
											() => "border-zinc-800 bg-zinc-900/60 text-zinc-400",
										);
									return (
										<div
											key={entry.key}
											className={`break-all rounded border px-1.5 py-1 font-mono text-[10px] ${tone}`}
										>
											{entry.key}
											<span className="ml-1 text-zinc-600">
												→ {entry.value}
											</span>
										</div>
									);
								})
							)}
						</div>
					</div>
				))}
			</div>

			<output aria-live="polite" className="block text-sm text-zinc-400">
				{result.position >= 0 ? (
					<>
						Hit · <span className="font-mono text-emerald-300">{query}</span> →{" "}
						<span className="font-mono text-zinc-200">{result.value}</span>{" "}
						after {result.comparisons} comparison
						{result.comparisons === 1 ? "" : "s"} in bucket {result.bucket}.
					</>
				) : (
					<>
						Miss · <span className="font-mono text-amber-300">{query}</span> is
						not in bucket {result.bucket}; {result.comparisons} comparison
						{result.comparisons === 1 ? "" : "s"} exhausted the chain.
					</>
				)}
			</output>

			<div className="grid grid-cols-3 gap-2 text-xs">
				{[
					{ label: "Entries", value: String(entries.length) },
					{ label: "Buckets in use", value: `${filled}/${TABLE_SIZE}` },
					{
						label: "Load factor α",
						value: (entries.length / TABLE_SIZE).toFixed(2),
					},
				].map(({ label, value }) => (
					<div
						key={label}
						className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 text-center"
					>
						<div className="font-mono text-lg font-bold text-purple-300">
							{value}
						</div>
						<div className="text-zinc-500">{label}</div>
					</div>
				))}
			</div>
		</div>
	);
}

function PipelinePanel() {
	const tagged = tagDuplicates(EVENT_STREAM);
	const { unique, duplicates } = dedupe(EVENT_STREAM);
	const rates = rateLimit(countByUser(unique), RATE_LIMIT);

	return (
		<div className="space-y-5">
			<div className="max-h-64 space-y-1 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
				{tagged.map((event, index) => (
					<div
						key={`${event.id}-${index}`}
						className={`flex flex-wrap items-center justify-between gap-2 rounded border px-2 py-1 font-mono text-[11px] ${
							event.duplicate
								? "border-amber-500/30 bg-amber-500/5 text-amber-300"
								: "border-zinc-800 bg-zinc-900/50 text-zinc-400"
						}`}
					>
						<span>{event.id}</span>
						<span>
							{event.user} · {event.action}
						</span>
						<span>
							{event.duplicate ? "duplicate — dropped" : "new — stored"}
						</span>
					</div>
				))}
			</div>

			<output aria-live="polite" className="block text-sm text-zinc-400">
				{EVENT_STREAM.length} events delivered →{" "}
				<span className="font-mono text-emerald-300">{unique.length}</span>{" "}
				unique ·{" "}
				<span className="font-mono text-amber-300">{duplicates.length}</span>{" "}
				retry duplicate{duplicates.length === 1 ? "" : "s"} dropped.
			</output>

			<div>
				<p className="mb-2 text-sm font-medium text-zinc-200">
					Per-user counters · limit {RATE_LIMIT}
				</p>
				<div className="grid gap-2 sm:grid-cols-3">
					{rates.map(({ user, count, remaining, blocked }) => (
						<div
							key={user}
							className={`rounded-lg border p-3 ${
								blocked > 0
									? "border-rose-500/30 bg-rose-500/5"
									: "border-emerald-500/30 bg-emerald-500/5"
							}`}
						>
							<div className="flex items-baseline justify-between">
								<span className="text-sm text-zinc-200">{user}</span>
								<span className="font-mono text-xs text-zinc-400">
									{count}/{RATE_LIMIT}
								</span>
							</div>
							<p
								className={`mt-1 text-xs ${
									blocked > 0 ? "text-rose-300" : "text-emerald-300"
								}`}
							>
								{blocked > 0
									? `${blocked} request${blocked === 1 ? "" : "s"} blocked`
									: `${remaining} request${remaining === 1 ? "" : "s"} remaining`}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function HashUseCasesDemo() {
	const [tab, setTab] = useState<Tab>("lookup");

	const panel = match(tab)
		.with("lookup", () => <LookupPanel />)
		.with("pipeline", () => <PipelinePanel />)
		.exhaustive();

	return (
		<DemoSection
			title="Real-world use cases"
			description="Both tabs show the same key-to-slot lookup in production. The first is a cache or DNS resolver, where a hit returns a value after a couple of comparisons. The second is an event pipeline, where a set drops repeated ids and a per-user counter enforces a limit. The tables and keys are fixed, so just pick one from the lists."
		>
			<div className="space-y-5">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setTab("lookup")}
						className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
							tab === "lookup"
								? "border-emerald-500/40 bg-emerald-600/20 text-emerald-300"
								: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						🗄️ Cache & DNS lookup
					</button>
					<button
						type="button"
						onClick={() => setTab("pipeline")}
						className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
							tab === "pipeline"
								? "border-purple-500/40 bg-purple-600/20 text-purple-300"
								: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						🧹 Dedup & rate limiting
					</button>
				</div>
				<AnimatePresence mode="wait">
					<motion.div
						key={tab}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						{panel}
					</motion.div>
				</AnimatePresence>
			</div>
		</DemoSection>
	);
}
