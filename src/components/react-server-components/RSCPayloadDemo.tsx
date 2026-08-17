import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type ViewMode = "rsc-nav" | "initial-load";
type Preset = "dashboard" | "blog" | "product";

interface FlightRow {
	key: string;
	value: string;
	kind: "element" | "suspense" | "client-ref" | "module" | "resolved";
	annotation: string;
}

interface PresetConfig {
	label: string;
	description: string;
	flightRows: FlightRow[];
	ssrHtml: string;
}

const PRESETS: Record<Preset, PresetConfig> = {
	dashboard: {
		label: "Dashboard Page",
		description:
			"<Page> with Header (server), Suspense around UserGreeting (async server), Counter (client)",
		flightRows: [
			{
				key: "0",
				value:
					'["$","div",null,{"className":"page","children":["$","h1",null,{"children":"Dashboard"}]}]',
				kind: "element",
				annotation:
					"Root element tree from server — plain React elements, no JS shipped",
			},
			{
				key: "1",
				value: '"$Sreact.suspense"',
				kind: "suspense",
				annotation:
					"$S = Suspense boundary marker. Client renders fallback until row 3 arrives",
			},
			{
				key: "2",
				value: '["$","$L3",null,{}]',
				kind: "client-ref",
				annotation:
					"$L3 = lazy reference to Counter client component. Client must load the module chunk before rendering",
			},
			{
				key: "3",
				value: '["$","p",null,{"children":"Welcome, Andri"}]',
				kind: "resolved",
				annotation:
					"Suspense resolved — UserGreeting async server component finished DB fetch",
			},
			{
				key: "M3",
				value: '{"id":"./Counter.js","chunks":["chunk-abc123"],"async":false}',
				kind: "module",
				annotation:
					"Module manifest — tells client which JS chunk to load for $L3",
			},
		],
		ssrHtml: `<div class="page">
  <h1>Dashboard</h1>
  <!--$?-->
  <template id="B:0"></template>
  <!--/$-->
  <div id="counter-root"></div>
</div>
<!-- Pre-RSC SSR: hydration walks full tree, attaches listeners everywhere -->`,
	},
	blog: {
		label: "Blog Post",
		description:
			"<Post> with Title + Body (server), LikeButton (client), Comments async server",
		flightRows: [
			{
				key: "0",
				value:
					'["$","article",null,{"children":[["$","h1",null,{"children":"My Post"}],["$","div",null,{"children":"...body..."}]]}]',
				kind: "element",
				annotation:
					"Full article tree rendered on server — zero client JS for static content",
			},
			{
				key: "1",
				value: '["$","$L2",null,{"postId":42}]',
				kind: "client-ref",
				annotation:
					"$L2 = lazy ref to LikeButton. postId=42 is serialized as a plain number — valid prop",
			},
			{
				key: "M2",
				value: '{"id":"./LikeButton.js","chunks":["chunk-def456"]}',
				kind: "module",
				annotation: "Module manifest for LikeButton chunk",
			},
			{
				key: "3",
				value: '"$Sreact.suspense"',
				kind: "suspense",
				annotation: "Suspense around Comments — async server component",
			},
			{
				key: "4",
				value:
					'["$","ul",null,{"children":[["$","li",null,{"children":"Great post!"}]]}]',
				kind: "resolved",
				annotation:
					"Comments resolved — server fetched from DB and streamed this chunk",
			},
		],
		ssrHtml: `<article>
  <h1>My Post</h1>
  <div>...body...</div>
  <div id="like-root"></div>
  <!--$?-->
  <template id="B:0"></template>
  <!--/$-->
</article>
<!-- Pre-RSC SSR: hydration re-attaches listeners across the full tree -->`,
	},
	product: {
		label: "Product Page",
		description:
			"<ProductPage> with Details (server), AddToCart (client), Reviews Suspense",
		flightRows: [
			{
				key: "0",
				value:
					'["$","section",null,{"children":["$","h2",null,{"children":"Laptop Pro 16"}]}]',
				kind: "element",
				annotation:
					"Product details from server — images, descriptions, specs. No JS for these nodes",
			},
			{
				key: "1",
				value: '["$","$L2",null,{"productId":"prod_abc","price":1299}]',
				kind: "client-ref",
				annotation:
					"$L2 = AddToCart client component. price is a number — serializable",
			},
			{
				key: "M2",
				value: '{"id":"./AddToCart.js","chunks":["chunk-ghi789"]}',
				kind: "module",
				annotation:
					"Module manifest — browser loads this chunk to hydrate AddToCart",
			},
			{
				key: "3",
				value: '"$Sreact.suspense"',
				kind: "suspense",
				annotation:
					"Reviews behind Suspense — slow DB query, doesn't block initial paint",
			},
			{
				key: "4",
				value:
					'["$","div",null,{"children":[["$","p",null,{"children":"⭐⭐⭐⭐⭐ Amazing!"}]]}]',
				kind: "resolved",
				annotation:
					"Reviews streamed after DB resolves — client patches this into the tree",
			},
		],
		ssrHtml: `<section>
  <h2>Laptop Pro 16</h2>
  <div id="add-to-cart-root"></div>
  <!--$?-->
  <template id="B:0"></template>
  <!--/$-->
</section>
<!-- SSR + RSC: only $L (client) nodes hydrate; server subtrees reconcile as opaque DOM -->`,
	},
};

const ROW_COLORS: Record<FlightRow["kind"], string> = {
	element: "text-cyan-300",
	suspense: "text-amber-300",
	"client-ref": "text-violet-300",
	module: "text-blue-300",
	resolved: "text-emerald-300",
};

const ROW_LABELS: Record<FlightRow["kind"], string> = {
	element: "element",
	suspense: "suspense",
	"client-ref": "client ref",
	module: "module",
	resolved: "resolved",
};

export function RSCPayloadDemo() {
	const [preset, setPreset] = useState<Preset>("dashboard");
	const [mode, setMode] = useState<ViewMode>("rsc-nav");
	const [selectedRow, setSelectedRow] = useState<string | null>(null);

	const config = PRESETS[preset];
	const selectedRowData = config.flightRows.find((r) => r.key === selectedRow);

	return (
		<DemoSection
			title="Demo 2: RSC Flight Payload"
			description="The RSC wire format is NOT HTML — it's a serialized React element tree. Click rows to see what each field means."
		>
			<div className="space-y-5">
				{/* Preset selector */}
				<div className="flex flex-wrap gap-2">
					{(Object.entries(PRESETS) as [Preset, PresetConfig][]).map(
						([key, cfg]) => (
							<button
								key={key}
								type="button"
								onClick={() => {
									setPreset(key);
									setSelectedRow(null);
								}}
								className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${preset === key ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"}`}
							>
								{cfg.label}
							</button>
						),
					)}
				</div>

				<p className="text-xs text-zinc-500">{config.description}</p>

				{/* Mode toggle */}
				<div className="flex bg-zinc-800 rounded-lg p-1 w-fit">
					{(
						[
							["rsc-nav", "RSC Navigation (Flight)"],
							["initial-load", "SSR Initial Load (HTML)"],
						] as const
					).map(([v, label]) => (
						<button
							key={v}
							type="button"
							onClick={() => setMode(v)}
							className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === v ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
						>
							{label}
						</button>
					))}
				</div>

				<AnimatePresence mode="wait">
					{mode === "rsc-nav" ? (
						<motion.div
							key="flight"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							className="space-y-4"
						>
							{/* Legend */}
							<div className="flex flex-wrap gap-3 text-xs">
								{(
									Object.entries(ROW_COLORS) as [FlightRow["kind"], string][]
								).map(([kind, color]) => (
									<span key={kind} className={color}>
										<span className="opacity-60">■</span> {ROW_LABELS[kind]}
									</span>
								))}
							</div>

							{/* Flight rows */}
							<div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden font-mono text-xs">
								<div className="px-4 py-2 border-b border-zinc-700 bg-zinc-800/60 flex items-center gap-2">
									<span className="text-zinc-400">RSC Flight Payload</span>
									<span className="text-zinc-600">
										— streamed chunks, not HTML
									</span>
								</div>
								<div className="divide-y divide-zinc-800">
									{config.flightRows.map((row) => (
										<button
											key={row.key}
											type="button"
											onClick={() =>
												setSelectedRow(selectedRow === row.key ? null : row.key)
											}
											className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors hover:bg-zinc-800/50 ${selectedRow === row.key ? "bg-zinc-800/70" : ""}`}
										>
											<span className="text-zinc-600 shrink-0 w-6">
												{row.key}:
											</span>
											<span className={`${ROW_COLORS[row.kind]} break-all`}>
												{row.value}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Annotation panel */}
							<AnimatePresence>
								{selectedRowData && (
									<motion.div
										key={selectedRowData.key}
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										exit={{ opacity: 0, height: 0 }}
										className="overflow-hidden"
									>
										<div
											className={`rounded-lg border p-3 ${match(
												selectedRowData.kind,
											)
												.with(
													"element",
													() => "border-cyan-500/30 bg-cyan-500/10",
												)
												.with(
													"suspense",
													() => "border-amber-500/30 bg-amber-500/10",
												)
												.with(
													"client-ref",
													() => "border-violet-500/30 bg-violet-500/10",
												)
												.with(
													"module",
													() => "border-blue-500/30 bg-blue-500/10",
												)
												.with(
													"resolved",
													() => "border-emerald-500/30 bg-emerald-500/10",
												)
												.exhaustive()}`}
										>
											<p
												className={`text-xs font-semibold mb-1 ${ROW_COLORS[selectedRowData.kind]}`}
											>
												Row {selectedRowData.key} —{" "}
												{ROW_LABELS[selectedRowData.kind]}
											</p>
											<p className="text-xs text-zinc-300">
												{selectedRowData.annotation}
											</p>
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							<div className="text-xs text-zinc-500 bg-zinc-800/30 rounded-lg p-3 space-y-1">
								<p>
									<span className="text-cyan-300 font-mono">$</span> = React
									element
								</p>
								<p>
									<span className="text-violet-300 font-mono">$L</span> = lazy
									client component reference (needs JS chunk)
								</p>
								<p>
									<span className="text-amber-300 font-mono">$S</span> =
									Suspense boundary — client renders fallback until chunk with
									content arrives
								</p>
								<p>
									<span className="text-blue-300 font-mono">M</span> = module
									manifest — maps $L ref to actual JS chunk filename
								</p>
							</div>
						</motion.div>
					) : (
						<motion.div
							key="html"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							className="space-y-4"
						>
							<ShikiCode
								language="html"
								code={config.ssrHtml}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1">
								<p className="text-amber-400 font-semibold">
									SSR vs RSC payload
								</p>
								<p className="text-zinc-300">
									SSR sends HTML — the browser paints immediately but must
									download and run JS to hydrate the full tree, including
									server-only nodes.
								</p>
								<p className="text-zinc-400">
									RSC Flight is sent on client-side navigations. It's a compact
									element tree the React runtime stitches into the existing DOM
									— no full hydration pass, no JS for server nodes.
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<ShikiCode
					language="tsx"
					code={`// React serializes the server component tree into Flight chunks.
// Each chunk is a line in the streamed response.

// $L (lazy) = "here's a client component reference"
// React will load the corresponding JS chunk before rendering.
const flightRow = ["$", "$L3", null, { productId: 42 }];
//                  ^     ^          ^
//                React  lazy ref   props (must be serializable)

// The module manifest tells React which file to fetch:
// M3: { id: "./AddToCart.js", chunks: ["chunk-abc"] }

// On the client, React reconstructs the tree:
// - Server elements: no JS hydration, just DOM reconciliation
// - $L refs: load chunk → hydrate only that subtree`}
					showLineNumbers={false}
					className="text-xs"
				/>
			</div>
		</DemoSection>
	);
}
