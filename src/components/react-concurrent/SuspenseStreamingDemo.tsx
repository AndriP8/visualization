import { AnimatePresence, motion } from "motion/react";
import { Suspense, useCallback, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Mode = "without" | "with";

interface FetchTimes {
	header: number;
	sidebar: number;
	feed: number;
}

// ─── wrapPromise helper for Suspense data fetching ───────────────────────────

interface Resource<T> {
	read(): T;
}

function wrapPromise<T>(promise: Promise<T>): Resource<T> {
	let status: "pending" | "success" | "error" = "pending";
	let result: T;
	let error: unknown;

	const suspender = promise.then(
		(r) => {
			status = "success";
			result = r;
		},
		(e) => {
			status = "error";
			error = e;
		},
	);

	return {
		read() {
			if (status === "pending") throw suspender;
			if (status === "error") throw error;
			return result;
		},
	};
}

function createFetchResource(label: string, delay: number): Resource<string[]> {
	return wrapPromise(
		new Promise<string[]>((resolve) => {
			setTimeout(() => {
				resolve(
					Array.from(
						{ length: label === "Feed" ? 8 : 4 },
						(_, i) => `${label} item ${i + 1}`,
					),
				);
			}, delay);
		}),
	);
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function SkeletonBlock({
	label,
	height = "h-20",
}: {
	label: string;
	height?: string;
}) {
	return (
		<div
			className={`${height} rounded-lg bg-surface-tertiary/50 animate-pulse flex items-center justify-center`}
		>
			<span className="text-xs text-text-muted">Loading {label}...</span>
		</div>
	);
}

// ─── Section Components (Suspense-compatible) ────────────────────────────────

const SECTION_STYLES: Record<
	string,
	{ border: string; bg: string; text: string }
> = {
	violet: {
		border: "border-violet-500/30",
		bg: "bg-violet-500/5",
		text: "text-accent-violet-soft",
	},
	cyan: {
		border: "border-cyan-500/30",
		bg: "bg-cyan-500/5",
		text: "text-accent-cyan-soft",
	},
	amber: {
		border: "border-amber-500/30",
		bg: "bg-amber-500/5",
		text: "text-accent-amber-soft",
	},
};

function SuspenseSection({
	resource,
	label,
	color,
}: {
	resource: Resource<string[]>;
	label: string;
	color: string;
}) {
	const items = resource.read();
	const styles = SECTION_STYLES[color];

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={`rounded-lg border ${styles.border} ${styles.bg} p-3`}
		>
			<h5 className={`text-sm font-semibold ${styles.text} mb-2`}>{label}</h5>
			<div className="space-y-1">
				{items.map((item) => (
					<div key={item} className="text-xs text-text-tertiary">
						{item}
					</div>
				))}
			</div>
		</motion.div>
	);
}

// ─── "Without Suspense" mode ─────────────────────────────────────────────────

function TraditionalDashboard({ fetchTimes }: { fetchTimes: FetchTimes }) {
	const [data, setData] = useState<{
		header: string[];
		sidebar: string[];
		feed: string[];
	} | null>(null);
	const [loading, setLoading] = useState(false);

	const handleLoad = useCallback(() => {
		setLoading(true);
		setData(null);
		Promise.all([
			new Promise<string[]>((r) =>
				setTimeout(
					() => r(Array.from({ length: 4 }, (_, i) => `Header item ${i + 1}`)),
					fetchTimes.header,
				),
			),
			new Promise<string[]>((r) =>
				setTimeout(
					() => r(Array.from({ length: 4 }, (_, i) => `Sidebar item ${i + 1}`)),
					fetchTimes.sidebar,
				),
			),
			new Promise<string[]>((r) =>
				setTimeout(
					() => r(Array.from({ length: 8 }, (_, i) => `Feed item ${i + 1}`)),
					fetchTimes.feed,
				),
			),
		]).then(([header, sidebar, feed]) => {
			setData({ header, sidebar, feed });
			setLoading(false);
		});
	}, [fetchTimes]);

	return (
		<div className="space-y-3">
			<button
				type="button"
				onClick={handleLoad}
				className="px-4 py-2 rounded-lg bg-violet-500/20 text-accent-violet border border-violet-500/30 text-sm hover:bg-violet-500/30 transition-colors"
			>
				Load Dashboard
			</button>
			{loading && (
				<div className="space-y-3">
					<SkeletonBlock label="Everything" height="h-48" />
					<p className="text-xs text-text-muted text-center">
						Waiting for slowest fetch (
						{Math.max(fetchTimes.header, fetchTimes.sidebar, fetchTimes.feed)}
						ms)...
					</p>
				</div>
			)}
			{data && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="space-y-3"
				>
					<div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
						<h5 className="text-sm font-semibold text-accent-violet-soft mb-2">
							Header
						</h5>
						{data.header.map((item) => (
							<div key={item} className="text-xs text-text-tertiary">
								{item}
							</div>
						))}
					</div>
					<div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
						<h5 className="text-sm font-semibold text-accent-cyan-soft mb-2">
							Sidebar
						</h5>
						{data.sidebar.map((item) => (
							<div key={item} className="text-xs text-text-tertiary">
								{item}
							</div>
						))}
					</div>
					<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
						<h5 className="text-sm font-semibold text-accent-amber-soft mb-2">
							Feed
						</h5>
						{data.feed.map((item) => (
							<div key={item} className="text-xs text-text-tertiary">
								{item}
							</div>
						))}
					</div>
				</motion.div>
			)}
		</div>
	);
}

// ─── "With Suspense" mode ────────────────────────────────────────────────────

function SuspenseDashboard({ fetchTimes }: { fetchTimes: FetchTimes }) {
	const [resources, setResources] = useState<{
		header: Resource<string[]>;
		sidebar: Resource<string[]>;
		feed: Resource<string[]>;
	} | null>(null);

	function handleLoad() {
		setResources({
			header: createFetchResource("Header", fetchTimes.header),
			sidebar: createFetchResource("Sidebar", fetchTimes.sidebar),
			feed: createFetchResource("Feed", fetchTimes.feed),
		});
	}

	return (
		<div className="space-y-3">
			<button
				type="button"
				onClick={handleLoad}
				className="px-4 py-2 rounded-lg bg-violet-500/20 text-accent-violet border border-violet-500/30 text-sm hover:bg-violet-500/30 transition-colors"
			>
				Load Dashboard
			</button>
			{resources && (
				<div className="space-y-3">
					<Suspense fallback={<SkeletonBlock label="Header" />}>
						<SuspenseSection
							resource={resources.header}
							label="Header"
							color="violet"
						/>
					</Suspense>
					<Suspense fallback={<SkeletonBlock label="Sidebar" />}>
						<SuspenseSection
							resource={resources.sidebar}
							label="Sidebar"
							color="cyan"
						/>
					</Suspense>
					<Suspense fallback={<SkeletonBlock label="Feed" height="h-32" />}>
						<SuspenseSection
							resource={resources.feed}
							label="Feed"
							color="amber"
						/>
					</Suspense>
				</div>
			)}
		</div>
	);
}

// ─── Main Demo ───────────────────────────────────────────────────────────────

export function SuspenseStreamingDemo() {
	const [mode, setMode] = useState<Mode>("without");
	const [fetchTimes, setFetchTimes] = useState<FetchTimes>({
		header: 200,
		sidebar: 600,
		feed: 1200,
	});
	return (
		<DemoSection
			title="Suspense — Progressive Loading"
			description="Compare all-at-once loading vs Suspense boundaries that stream sections independently as data arrives."
		>
			<div className="space-y-6">
				{/* Mode Toggle */}
				<div className="flex bg-surface-secondary rounded-lg p-1 w-fit">
					<button
						type="button"
						onClick={() => setMode("without")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
							mode === "without"
								? "bg-red-500/20 text-accent-red-soft"
								: "text-text-tertiary hover:text-text-primary"
						}`}
					>
						Without Suspense
					</button>
					<button
						type="button"
						onClick={() => setMode("with")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
							mode === "with"
								? "bg-emerald-500/20 text-accent-emerald-soft"
								: "text-text-tertiary hover:text-text-primary"
						}`}
					>
						With Suspense
					</button>
				</div>

				{/* Fetch Time Sliders */}
				<div className="bg-surface-secondary/50 rounded-lg p-4 space-y-3">
					<h4 className="text-sm font-medium text-text-secondary">
						Simulated Fetch Times
					</h4>
					{(
						[
							["header", "Header", "text-accent-violet-soft"],
							["sidebar", "Sidebar", "text-accent-cyan-soft"],
							["feed", "Feed", "text-accent-amber-soft"],
						] as const
					).map(([key, label, textClass]) => (
						<div key={key} className="flex items-center gap-3">
							<span className={`text-xs ${textClass} w-16`}>{label}</span>
							<input
								type="range"
								min={100}
								max={3000}
								step={100}
								value={fetchTimes[key]}
								onChange={(e) =>
									setFetchTimes((prev) => ({
										...prev,
										[key]: Number(e.target.value),
									}))
								}
								className="flex-1 accent-violet-500"
							/>
							<span className="text-xs text-text-tertiary w-14 text-right">
								{fetchTimes[key]}ms
							</span>
						</div>
					))}
				</div>

				{/* Timeline Visualization */}
				<div className="bg-surface-secondary/50 rounded-lg p-4 space-y-3">
					<h4 className="text-sm font-medium text-text-secondary">
						Loading Timeline
					</h4>
					<AnimatePresence mode="wait">
						{mode === "without" ? (
							<motion.div
								key="without"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-2"
							>
								<div className="flex items-center gap-2 text-xs text-text-tertiary">
									<span className="w-16 shrink-0">All</span>
									<div className="flex-1 h-6 rounded overflow-hidden relative bg-surface-primary">
										<motion.div
											className="absolute inset-y-0 left-0 bg-red-500/30 border-r border-red-500"
											style={{
												width: `${(Math.max(fetchTimes.header, fetchTimes.sidebar, fetchTimes.feed) / 3000) * 100}%`,
											}}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.5 }}
										/>
										<span className="absolute inset-0 flex items-center justify-center text-[10px] text-accent-red">
											Wait for slowest (
											{Math.max(
												fetchTimes.header,
												fetchTimes.sidebar,
												fetchTimes.feed,
											)}
											ms)
										</span>
									</div>
								</div>
							</motion.div>
						) : (
							<motion.div
								key="with"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-2"
							>
								{(
									[
										{
											label: "Header",
											time: fetchTimes.header,
											textClass: "text-accent-violet-soft",
											barClass: "bg-violet-500/30 border-r border-violet-500",
										},
										{
											label: "Sidebar",
											time: fetchTimes.sidebar,
											textClass: "text-accent-cyan-soft",
											barClass: "bg-cyan-500/30 border-r border-cyan-500",
										},
										{
											label: "Feed",
											time: fetchTimes.feed,
											textClass: "text-accent-amber-soft",
											barClass: "bg-amber-500/30 border-r border-amber-500",
										},
									] as const
								).map((item) => (
									<div
										key={item.label}
										className="flex items-center gap-2 text-xs text-text-tertiary"
									>
										<span className={`w-16 shrink-0 ${item.textClass}`}>
											{item.label}
										</span>
										<div className="flex-1 h-5 rounded overflow-hidden relative bg-surface-primary">
											<motion.div
												className={`absolute inset-y-0 left-0 ${item.barClass}`}
												style={{
													width: `${(item.time / 3000) * 100}%`,
												}}
												initial={{ scaleX: 0 }}
												animate={{ scaleX: 1 }}
												transition={{
													duration: 0.5,
													delay: item.time / 5000,
												}}
											/>
											<span className="absolute right-2 inset-y-0 flex items-center text-[10px] text-text-muted">
												{item.time}ms
											</span>
										</div>
									</div>
								))}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Dashboard */}
				<AnimatePresence mode="wait">
					{mode === "without" ? (
						<motion.div
							key="traditional"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<TraditionalDashboard fetchTimes={fetchTimes} />
						</motion.div>
					) : (
						<motion.div
							key="suspense"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<SuspenseDashboard fetchTimes={fetchTimes} />
						</motion.div>
					)}
				</AnimatePresence>

				{/* Code Example */}
				<ShikiCode
					language="tsx"
					code={`// Each Suspense boundary resolves independently
function Dashboard() {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />       {/* resolves at 200ms */}
      </Suspense>
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />      {/* resolves at 600ms */}
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />         {/* resolves at 1200ms */}
      </Suspense>
    </>
  );
}

// Navigation wrapped in transition avoids jarring fallback flash
function navigate(to: string) {
  startTransition(() => setPage(to));
}`}
					showLineNumbers={false}
					className="text-xs"
				/>

				<div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
					<p className="text-sm text-accent-cyan">
						<span className="font-semibold">React 19 note:</span> the{" "}
						<code className="text-cyan-200">use(promise)</code> hook replaces
						the manual <code className="text-cyan-200">wrapPromise</code>{" "}
						pattern shown above. Pass a promise created outside render (e.g.
						from an event handler) and call{" "}
						<code className="text-cyan-200">use(promise)</code> inside your
						component — Suspense handles the rest.
					</p>
				</div>

				<p className="text-xs text-text-muted italic">
					Without startTransition, navigating to a Suspense-boundary page
					immediately shows fallbacks (jarring). With it, React keeps the old
					page visible until enough of the new page is ready.
				</p>
			</div>
		</DemoSection>
	);
}
