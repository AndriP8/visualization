import { motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import { PARTITION_SCENARIOS, type PartitionMode } from "./storageModel";

const OUTCOME_STYLES = {
	sent: {
		badge: "bg-emerald-500/15 text-emerald-300",
		border: "border-emerald-500/25 bg-emerald-500/5",
		label: "Sent",
	},
	blocked: {
		badge: "bg-rose-500/15 text-rose-300",
		border: "border-rose-500/25 bg-rose-500/5",
		label: "Not sent",
	},
	isolated: {
		badge: "bg-sky-500/15 text-sky-300",
		border: "border-sky-500/25 bg-sky-500/5",
		label: "Sent, but isolated",
	},
} as const;

export function PartitioningDemo() {
	const [scenarioId, setScenarioId] = useState<PartitionMode>("first-party");
	const scenario =
		PARTITION_SCENARIOS.find((item) => item.id === scenarioId) ??
		PARTITION_SCENARIOS[0];
	const style = OUTCOME_STYLES[scenario.outcome];

	const parties = match(scenario.id)
		.with("first-party", () => ({
			left: "shop.example",
			right: "shop.example",
			relation: "same site",
		}))
		.with("third-party", () => ({
			left: "news.example",
			right: "shop.example",
			relation: "third-party",
		}))
		.with("chips", () => ({
			left: "news.example",
			right: "shop.example",
			relation: "third-party, partitioned",
		}))
		.with("unrelated", () => ({
			left: "blog.example",
			right: "shop.example",
			relation: "third-party, different partition",
		}))
		.exhaustive();

	return (
		<DemoSection
			title="Demo 9: Storage partitioning and CHIPS"
			description="When a widget is embedded on someone else's site, the browser can give it a separate cookie jar per top-level site. Step through the scenarios to see what the embedded site can and cannot read."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap gap-2">
					{PARTITION_SCENARIOS.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setScenarioId(item.id)}
							className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
								item.id === scenarioId
									? "border-sky-500/40 bg-sky-500/10 text-sky-300"
									: "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
							}`}
						>
							{item.label}
						</button>
					))}
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<div className="flex flex-wrap items-center justify-center gap-4 py-4">
						<div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center">
							<div className="text-[10px] uppercase tracking-wider text-zinc-500">
								Top-level site
							</div>
							<div className="mt-1 font-mono text-xs text-zinc-100">
								{parties.left}
							</div>
						</div>

						<div className="text-center">
							<div className="font-mono text-xs text-sky-300">
								{parties.relation}
							</div>
							<div className="mt-1 text-lg text-zinc-600">↓</div>
						</div>

						<div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center">
							<div className="text-[10px] uppercase tracking-wider text-zinc-500">
								Embedded site
							</div>
							<div className="mt-1 font-mono text-xs text-zinc-100">
								{parties.right}
							</div>
						</div>
					</div>

					<motion.div
						key={scenario.id}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						className={`rounded-lg border p-4 ${style.border}`}
					>
						<div className="flex items-center justify-between gap-3">
							<span className="text-sm text-zinc-200">{scenario.summary}</span>
							<span
								className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.badge}`}
							>
								{style.label}
							</span>
						</div>
						<p className="mt-2 text-xs leading-relaxed text-zinc-400">
							{scenario.result}
						</p>
					</motion.div>
				</div>

				<div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4 text-xs leading-relaxed text-zinc-400">
					<strong className="text-sky-300">What partitioning buys you.</strong>{" "}
					A widget embedded on ten sites gets ten separate jars. The widget can
					still recognize a returning user on the site where they signed in, but
					it cannot follow that user across unrelated sites. That is the trade:
					the embedder loses a cross-site identifier, and the user keeps their
					identities apart.
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`// A cookie that lives in its own jar per top-level site.
document.cookie =
  "__Secure-widget=abc; Path=/; Secure; SameSite=None; Partitioned";

// The browser refuses a partitioned cookie without SameSite=None,
// and refuses a __Host- cookie that carries a Domain attribute.`}
				/>

				<div className="space-y-2 text-xs leading-relaxed text-zinc-500">
					<p>
						<strong className="text-zinc-300">Where browsers stand.</strong>{" "}
						Safari and Firefox block third-party cookies by default and rely on
						partitioning. Chrome abandoned its plan to remove third-party
						cookies entirely and instead exposes a user choice in its settings,
						while applying partitioning where it can. The direction is the same
						everywhere: a third-party cookie is harder to use than it used to
						be.
					</p>
					<p>
						<strong className="text-zinc-300">Storage beyond cookies.</strong>{" "}
						IndexedDB, localStorage, and the Cache API are partitioned too,
						which is why an embedded app often appears to have lost its data.
						The Storage Access API is the escape hatch for a site that genuinely
						needs unpartitioned access, usually behind a user prompt.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
