import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import {
	FILE_SYSTEM,
	findPath,
	flatten,
	formatPath,
	JSON_DOCUMENT,
	leaves,
	type PathStyle,
	type UseCaseNode,
} from "./treeUseCases";

type Tab = "filesystem" | "json";

const selectClass =
	"rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200";

function TreeRows({
	node,
	active,
}: {
	node: UseCaseNode;
	active: Set<string>;
}) {
	const onPath = active.has(node.id);
	return (
		<li>
			<div
				className={`inline-flex items-baseline gap-2 rounded-md border px-2 py-1 font-mono text-xs ${
					onPath
						? "border-purple-500/50 bg-purple-500/10 text-purple-200"
						: "border-transparent text-zinc-400"
				}`}
			>
				<span>{node.label}</span>
				{node.detail && (
					<span
						className={`text-[10px] ${
							onPath ? "text-purple-400" : "text-zinc-600"
						}`}
					>
						{node.detail}
					</span>
				)}
			</div>
			{node.children.length > 0 && (
				<ul className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-800/70 pl-3">
					{node.children.map((child) => (
						<TreeRows key={child.id} node={child} active={active} />
					))}
				</ul>
			)}
		</li>
	);
}

function ScenarioPanel({
	root,
	style,
	target,
	onSelect,
	idPrefix,
}: {
	root: UseCaseNode;
	style: PathStyle;
	target: string;
	onSelect: (id: string) => void;
	idPrefix: string;
}) {
	const path = findPath(root, target);
	const active = new Set(path.map((node) => node.id));
	const leaf = path.at(-1);
	const copy = match(style)
		.with("filesystem", () => ({
			heading: "Resolved absolute path",
			valueLabel: "Size",
			note: "Each directory is a node; resolving a path follows one child pointer per segment.",
		}))
		.with("json", () => ({
			heading: "Resolved JSON path",
			valueLabel: "Value",
			note: "Parsing produces this tree; property access walks one child pointer per key or index.",
		}))
		.exhaustive();

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				<label htmlFor={`${idPrefix}-target`} className="text-sm text-zinc-400">
					Resolve
				</label>
				<select
					id={`${idPrefix}-target`}
					value={target}
					onChange={(event) => onSelect(event.target.value)}
					className={selectClass}
				>
					{leaves(root).map((node) => (
						<option key={node.id} value={node.id}>
							{formatPath(findPath(root, node.id), style)}
						</option>
					))}
				</select>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<div className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<ul className="space-y-0.5">
						<TreeRows node={root} active={active} />
					</ul>
				</div>
				<div className="space-y-3">
					<div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
						<p className="text-xs text-zinc-500">{copy.heading}</p>
						<p className="mt-1 break-all font-mono text-sm text-purple-300">
							{formatPath(path, style) || "—"}
						</p>
					</div>
					<div className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-xs text-zinc-400">
						<p>
							<span className="text-zinc-200">Child pointers followed:</span>{" "}
							<span className="font-mono text-purple-300">
								{Math.max(path.length - 1, 0)}
							</span>
						</p>
						<p>
							<span className="text-zinc-200">{copy.valueLabel}:</span>{" "}
							<span className="font-mono text-zinc-300">
								{leaf?.detail ?? "—"}
							</span>
						</p>
						<p>{copy.note}</p>
					</div>
					<p className="text-xs text-zinc-500">
						{flatten(root).length} nodes in this document ·{" "}
						{leaves(root).length} leaves
					</p>
				</div>
			</div>
		</div>
	);
}

export function TreeUseCasesDemo() {
	const [tab, setTab] = useState<Tab>("filesystem");
	const [fileTarget, setFileTarget] = useState(
		"/projects/visualizer/src/routes/trees.tsx",
	);
	const [jsonTarget, setJsonTarget] = useState("orders[0].items[1]");

	const panel = match(tab)
		.with("filesystem", () => (
			<ScenarioPanel
				root={FILE_SYSTEM}
				style="filesystem"
				target={fileTarget}
				onSelect={setFileTarget}
				idPrefix="tree-fs"
			/>
		))
		.with("json", () => (
			<ScenarioPanel
				root={JSON_DOCUMENT}
				style="json"
				target={jsonTarget}
				onSelect={setJsonTarget}
				idPrefix="tree-json"
			/>
		))
		.exhaustive();

	return (
		<DemoSection
			title="Real-world use cases"
			description="A folder tree and a parsed JSON document are the same shape: each node holds a value and a list of children. To resolve a path like ~/projects/visualizer/src or orders[0].items[1], you follow one child address per segment. Pick any file or JSON value from the list to watch its path resolve. The DOM is the same tree again, and its rendering walk belongs to the Reconciliation page."
		>
			<div className="space-y-5">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setTab("filesystem")}
						className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
							tab === "filesystem"
								? "border-amber-500/40 bg-amber-600/20 text-amber-300"
								: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						🗂️ File system
					</button>
					<button
						type="button"
						onClick={() => setTab("json")}
						className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
							tab === "json"
								? "border-purple-500/40 bg-purple-600/20 text-purple-300"
								: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						{"{}"} JSON / DOM parsing
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
