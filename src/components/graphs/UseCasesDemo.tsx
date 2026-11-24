import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import {
	bfsPath,
	friendSuggestions,
	ROAD_MAP,
	type Scenario,
	SOCIAL_GRAPH,
	toAdjacency,
	toWeights,
	weightedShortestPath,
} from "./useCases";

const ROAD_WEIGHTS = toWeights(ROAD_MAP);
const SOCIAL_ADJACENCY = toAdjacency(SOCIAL_GRAPH);

type Tab = "routes" | "social";

function ScenarioMap({
	scenario,
	showWeights,
	highlightNodes,
	highlightEdges,
}: {
	scenario: Scenario;
	showWeights: boolean;
	highlightNodes: Set<string>;
	highlightEdges: Set<string>;
}) {
	return (
		<svg
			viewBox="0 0 460 240"
			role="img"
			aria-label="Scenario network diagram"
			className="mx-auto w-full max-w-xl"
		>
			{scenario.edges.map(({ a, b, weight }) => {
				const from = scenario.nodes.find((node) => node.id === a);
				const to = scenario.nodes.find((node) => node.id === b);
				const key = [a, b].sort().join("-");
				const active = highlightEdges.has(key);
				return from && to ? (
					<g key={key}>
						<line
							x1={from.x}
							y1={from.y}
							x2={to.x}
							y2={to.y}
							stroke={active ? "#059669" : "#52525b"}
							strokeWidth={active ? 3.5 : 2.5}
						/>
						{showWeights && (
							<text
								x={(from.x + to.x) / 2}
								y={(from.y + to.y) / 2 - 6}
								textAnchor="middle"
								fontSize="10"
								fontFamily="monospace"
								fill={active ? "#6ee7b7" : "#71717a"}
							>
								{weight}
							</text>
						)}
					</g>
				) : null;
			})}
			{scenario.nodes.map(({ id, x, y }) => {
				const active = highlightNodes.has(id);
				return (
					<g key={id}>
						<circle
							cx={x}
							cy={y}
							r="24"
							fill={active ? "#065f46" : "#27272a"}
							stroke={active ? "#6ee7b7" : "#71717a"}
							strokeWidth="2"
						/>
						<text
							x={x}
							y={y + 4}
							textAnchor="middle"
							fontSize={id.length > 4 ? 9 : 12}
							fontFamily="monospace"
							fill="#f4f4f5"
						>
							{id}
						</text>
					</g>
				);
			})}
		</svg>
	);
}

function chainEdges(path: string[]): Set<string> {
	return new Set(
		path
			.slice(0, -1)
			.map((node, index) => [node, path[index + 1] ?? ""].sort().join("-")),
	);
}

const selectClass =
	"rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200";

export function GraphUseCasesDemo() {
	const [tab, setTab] = useState<Tab>("routes");
	const [routeFrom, setRouteFrom] = useState("Home");
	const [routeTo, setRouteTo] = useState("Beach");
	const [person, setPerson] = useState("You");
	const [stranger, setStranger] = useState("Fay");

	const route = weightedShortestPath(ROAD_WEIGHTS, routeFrom, routeTo);
	const suggestions = friendSuggestions(SOCIAL_ADJACENCY, person);
	const separation = bfsPath(SOCIAL_ADJACENCY, person, stranger);

	const panel = match(tab)
		.with("routes", () => {
			const hops = route.path
				.slice(0, -1)
				.map(
					(node, index) =>
						ROAD_WEIGHTS[node]?.[route.path[index + 1] ?? ""] ?? 0,
				);
			return (
				<div className="space-y-5">
					<div className="flex flex-wrap items-center gap-2">
						<label htmlFor="uc-route-from" className="text-sm text-zinc-400">
							From
						</label>
						<select
							id="uc-route-from"
							value={routeFrom}
							onChange={(event) => setRouteFrom(event.target.value)}
							className={selectClass}
						>
							{ROAD_MAP.nodes.map(({ id }) => (
								<option key={id}>{id}</option>
							))}
						</select>
						<label htmlFor="uc-route-to" className="text-sm text-zinc-400">
							To
						</label>
						<select
							id="uc-route-to"
							value={routeTo}
							onChange={(event) => setRouteTo(event.target.value)}
							className={selectClass}
						>
							{ROAD_MAP.nodes.map(({ id }) => (
								<option key={id}>{id}</option>
							))}
						</select>
					</div>
					<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<ScenarioMap
							scenario={ROAD_MAP}
							showWeights
							highlightNodes={new Set(route.path)}
							highlightEdges={chainEdges(route.path)}
						/>
					</div>
					<output aria-live="polite" className="block text-sm text-zinc-400">
						{route.path.length ? (
							<>
								Fastest route:{" "}
								<span className="font-mono text-emerald-300">
									{route.path.join(" → ")}
								</span>
								<span className="ml-2 text-xs text-zinc-500">
									{hops.join(" + ")} min = {route.total} min
								</span>
							</>
						) : (
							"Pick a start and destination"
						)}
					</output>
					<p className="text-xs text-zinc-500">
						This is Dijkstra's algorithm — the standard way to find the cheapest
						path when edges have different costs.
					</p>
				</div>
			);
		})
		.with("social", () => (
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<label htmlFor="uc-person" className="text-sm text-zinc-400">
						Suggestions for
					</label>
					<select
						id="uc-person"
						value={person}
						onChange={(event) => setPerson(event.target.value)}
						className={selectClass}
					>
						{SOCIAL_GRAPH.nodes.map(({ id }) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<label htmlFor="uc-stranger" className="text-sm text-zinc-400">
						Connect to
					</label>
					<select
						id="uc-stranger"
						value={stranger}
						onChange={(event) => setStranger(event.target.value)}
						className={selectClass}
					>
						{SOCIAL_GRAPH.nodes.map(({ id }) => (
							<option key={id}>{id}</option>
						))}
					</select>
				</div>
				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<ScenarioMap
						scenario={SOCIAL_GRAPH}
						showWeights={false}
						highlightNodes={new Set(separation)}
						highlightEdges={chainEdges(separation)}
					/>
				</div>
				<div>
					<p className="mb-2 text-sm font-medium text-zinc-200">
						Friend suggestions for {person}
					</p>
					<div className="flex flex-wrap gap-2">
						{match(suggestions.length)
							.with(0, () => (
								<span className="text-sm text-zinc-600">
									Everyone within reach is already a direct friend
								</span>
							))
							.otherwise(() =>
								suggestions.map(({ id, mutuals }) => (
									<span
										key={id}
										className="rounded-md border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm text-purple-200"
									>
										{id}
										<span className="ml-2 text-xs text-zinc-500">
											via {mutuals.join(" & ")}
										</span>
									</span>
								)),
							)}
					</div>
				</div>
				<output aria-live="polite" className="block text-sm text-zinc-400">
					{match({
						same: person === stranger,
						length: separation.length,
					})
						.with(
							{ same: true },
							() => "Pick two different people to measure the distance",
						)
						.with(
							{ length: 0 },
							() => `${person} and ${stranger} are not connected`,
						)
						.with(
							{ length: 2 },
							() => `${person} and ${stranger} are already friends`,
						)
						.otherwise(
							({ length }) =>
								`${length - 1} degrees of separation: ${separation.join(" → ")}`,
						)}
				</output>
			</div>
		))
		.exhaustive();

	return (
		<DemoSection
			title="Real-world use cases"
			description="The first tab finds the fastest route between two places. Edges now carry travel minutes instead of one hop each, so the answer is the cheapest total time, not the fewest steps. The second tab uses the same network shape to suggest friends and to count the steps between two people. The data is fixed, so switch tabs and pick endpoints."
		>
			<div className="space-y-5">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setTab("routes")}
						className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
							tab === "routes"
								? "border-emerald-500/40 bg-emerald-600/20 text-emerald-300"
								: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						🗺️ Route finding
					</button>
					<button
						type="button"
						onClick={() => setTab("social")}
						className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
							tab === "social"
								? "border-purple-500/40 bg-purple-600/20 text-purple-300"
								: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						👥 Social network
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
