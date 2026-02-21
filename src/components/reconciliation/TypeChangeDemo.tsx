import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { FiberTree } from "./FiberTree";
import type { FiberNodeData } from "./types";

type Scenario = "same-same" | "same-diff" | "diff-type";

interface ScenarioConfig {
	label: string;
	description: string;
	beforeTree: FiberNodeData;
	afterTree: FiberNodeData;
	explanation: string;
}

const SCENARIOS: Record<Scenario, ScenarioConfig> = {
	"same-same": {
		label: "Same Type, Same Props",
		description: "Nothing changed — React skips this node entirely",
		beforeTree: {
			id: "app",
			type: "App",
			status: "unchanged",
			children: [
				{
					id: "div",
					type: "div",
					status: "unchanged",
					props: { className: "card" },
					children: [
						{
							id: "span",
							type: "span",
							status: "unchanged",
							props: { text: "Hello" },
						},
					],
				},
			],
		},
		afterTree: {
			id: "app",
			type: "App",
			status: "unchanged",
			children: [
				{
					id: "div",
					type: "div",
					status: "unchanged",
					props: { className: "card" },
					children: [
						{
							id: "span",
							type: "span",
							status: "unchanged",
							props: { text: "Hello" },
						},
					],
				},
			],
		},
		explanation:
			'React sees <div className="card"> → <div className="card">. Same type, same props. No DOM work needed — React bails out early. This is the best case scenario.',
	},
	"same-diff": {
		label: "Same Type, Different Props",
		description: "React reuses the DOM node, only patches changed attributes",
		beforeTree: {
			id: "app",
			type: "App",
			status: "unchanged",
			children: [
				{
					id: "div",
					type: "div",
					status: "unchanged",
					props: { className: "card" },
					children: [
						{
							id: "span",
							type: "span",
							status: "unchanged",
							props: { text: "Hello" },
						},
					],
				},
			],
		},
		afterTree: {
			id: "app",
			type: "App",
			status: "unchanged",
			children: [
				{
					id: "div",
					type: "div",
					status: "updated",
					props: { className: "active" },
					children: [
						{
							id: "span",
							type: "span",
							status: "updated",
							props: { text: "World" },
						},
					],
				},
			],
		},
		explanation:
			'React sees <div className="card"> → <div className="active">. Same type! It reuses the existing DOM node and only patches className. The <span> also gets its text prop updated. No mount/unmount — just targeted attribute changes.',
	},
	"diff-type": {
		label: "Different Type",
		description: "React destroys the entire subtree and rebuilds from scratch",
		beforeTree: {
			id: "app",
			type: "App",
			status: "unchanged",
			children: [
				{
					id: "div",
					type: "div",
					status: "unchanged",
					props: { className: "card" },
					children: [
						{
							id: "span",
							type: "span",
							status: "unchanged",
							props: { text: "Hello" },
						},
					],
				},
			],
		},
		afterTree: {
			id: "app",
			type: "App",
			status: "unchanged",
			children: [
				{
					id: "section",
					type: "section",
					status: "added",
					props: { className: "card" },
					children: [
						{ id: "p", type: "p", status: "added", props: { text: "Hello" } },
					],
				},
			],
		},
		explanation:
			"React sees <div> → <section>. Different type! React DESTROYS the entire <div> subtree (unmounts all children, clears state) and CREATES a brand new <section> tree from scratch. Even though the props and children are identical, everything is remounted. This is why changing element types is expensive.",
	},
};

export function TypeChangeDemo() {
	const [scenario, setScenario] = useState<Scenario>("same-same");
	const [showAfter, setShowAfter] = useState(false);

	const config = SCENARIOS[scenario];

	return (
		<DemoSection
			title="Demo 4: Element Type & Props"
			description="See how React's decision changes based on whether the element type and/or props changed."
		>
			{/* Scenario picker */}
			<div className="flex flex-wrap gap-2 mb-5">
				{(Object.entries(SCENARIOS) as [Scenario, ScenarioConfig][]).map(
					([key, s]) => (
						<button
							key={key}
							type="button"
							onClick={() => {
								setScenario(key);
								setShowAfter(false);
							}}
							className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
								scenario === key
									? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
									: "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300"
							}`}
						>
							{s.label}
						</button>
					),
				)}
			</div>

			<p className="text-sm text-zinc-400 mb-4">{config.description}</p>

			{/* Toggle */}
			<button
				type="button"
				onClick={() => setShowAfter((v) => !v)}
				className="px-4 py-2 mb-5 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
			>
				{showAfter ? "← Show Before" : "Trigger Re-render →"}
			</button>

			{/* Trees */}
			<div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
				<FiberTree
					root={config.beforeTree}
					label="Before"
					width={350}
					height={260}
				/>
				{showAfter && (
					<FiberTree
						root={config.afterTree}
						label="After"
						width={350}
						height={260}
					/>
				)}
			</div>

			{/* Explanation */}
			{showAfter && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-5 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-300"
				>
					{config.explanation}
				</motion.div>
			)}
		</DemoSection>
	);
}
