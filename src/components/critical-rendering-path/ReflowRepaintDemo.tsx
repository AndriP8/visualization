import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type CostLevel = "layout" | "paint" | "composite";

interface CssPropertyInfo {
	property: string;
	example: string;
	triggers: CostLevel;
	explanation: string;
}

const PIPELINE_STAGES: {
	id: CostLevel;
	label: string;
	color: string;
	description: string;
}[] = [
	{
		id: "layout",
		label: "Layout (Reflow)",
		color: "#ef4444",
		description:
			"Recalculates geometry — position, size, and how elements affect each other",
	},
	{
		id: "paint",
		label: "Paint (Repaint)",
		color: "#f59e0b",
		description: "Redraws pixels — colors, borders, shadows, text rendering",
	},
	{
		id: "composite",
		label: "Composite",
		color: "#22c55e",
		description:
			"Rearranges pre-painted layers on the GPU — cheapest operation",
	},
];

const CSS_PROPERTIES: CssPropertyInfo[] = [
	{
		property: "width",
		example: "width: 200px → 300px",
		triggers: "layout",
		explanation:
			"Changing width affects the element's box model and can push siblings around. Triggers full Layout → Paint → Composite.",
	},
	{
		property: "height",
		example: "height: 100px → 150px",
		triggers: "layout",
		explanation:
			"Like width, height changes affect geometry and may shift elements below. Full pipeline.",
	},
	{
		property: "margin",
		example: "margin: 0 → 20px",
		triggers: "layout",
		explanation:
			"Margin changes affect spacing between elements, triggering reflow of surrounding content.",
	},
	{
		property: "padding",
		example: "padding: 8px → 16px",
		triggers: "layout",
		explanation:
			"Padding expands the element's content area, affecting internal and sometimes external layout.",
	},
	{
		property: "font-size",
		example: "font-size: 14px → 18px",
		triggers: "layout",
		explanation:
			"Text reflow: changing font size changes how much space text occupies, triggering layout.",
	},
	{
		property: "color",
		example: "color: red → blue",
		triggers: "paint",
		explanation:
			"Color changes don't affect geometry — the element stays in place. Only pixels need repainting.",
	},
	{
		property: "background",
		example: "background: #fff → #000",
		triggers: "paint",
		explanation:
			"Background is purely visual. No geometry changes, just repaint the affected area.",
	},
	{
		property: "box-shadow",
		example: "box-shadow: none → 0 4px 6px rgba(…)",
		triggers: "paint",
		explanation:
			"Shadows are painted effects. Adding or changing them requires repaint but no layout recalculation.",
	},
	{
		property: "border-color",
		example: "border-color: gray → red",
		triggers: "paint",
		explanation:
			"Changing border color is a paint-only operation (border-width would trigger layout).",
	},
	{
		property: "transform",
		example: "transform: translateX(0) → translateX(100px)",
		triggers: "composite",
		explanation:
			"Transforms are handled entirely by the GPU on a separate compositor layer. No layout or paint needed!",
	},
	{
		property: "opacity",
		example: "opacity: 1 → 0.5",
		triggers: "composite",
		explanation:
			"Opacity changes are composited by the GPU. One of the cheapest animations you can do.",
	},
	{
		property: "filter",
		example: "filter: none → blur(4px)",
		triggers: "composite",
		explanation:
			"CSS filters like blur are GPU-accelerated composite operations in modern browsers.",
	},
];

const COST_COLORS: Record<CostLevel, string> = {
	layout: "#ef4444",
	paint: "#f59e0b",
	composite: "#22c55e",
};

const COST_LABELS: Record<CostLevel, string> = {
	layout: "Layout → Paint → Composite",
	paint: "Paint → Composite",
	composite: "Composite only",
};

function getTriggeredStages(level: CostLevel): CostLevel[] {
	if (level === "layout") return ["layout", "paint", "composite"];
	if (level === "paint") return ["paint", "composite"];
	return ["composite"];
}

export function ReflowRepaintDemo() {
	const [selected, setSelected] = useState<CssPropertyInfo | null>(null);
	const triggeredStages = selected
		? new Set(getTriggeredStages(selected.triggers))
		: new Set<CostLevel>();

	return (
		<DemoSection
			title="Demo 3: Reflow vs Repaint vs Composite"
			description="Click a CSS property to see which rendering pipeline stages it triggers. More stages = higher cost."
		>
			{/* Cost hierarchy */}
			<div className="flex items-center gap-2 mb-5">
				<span className="text-xs text-zinc-500">Cost:</span>
				{PIPELINE_STAGES.map((stage, i) => (
					<div key={stage.id} className="flex items-center gap-2">
						<motion.div
							animate={{
								scale: triggeredStages.has(stage.id) ? 1.05 : 1,
								opacity: selected
									? triggeredStages.has(stage.id)
										? 1
										: 0.25
									: 0.6,
							}}
							transition={{ duration: 0.3 }}
							className="px-3 py-1.5 rounded-lg text-xs font-medium border"
							style={{
								borderColor: `${stage.color}44`,
								backgroundColor: triggeredStages.has(stage.id)
									? `${stage.color}22`
									: `${stage.color}08`,
								color: stage.color,
							}}
						>
							{stage.label}
						</motion.div>
						{i < PIPELINE_STAGES.length - 1 && (
							<span className="text-zinc-600 text-xs">→</span>
						)}
					</div>
				))}
				<span className="text-xs text-zinc-500 ml-2">
					{selected ? COST_LABELS[selected.triggers] : "(click a property)"}
				</span>
			</div>

			{/* Pipeline bar visualization */}
			<div className="mb-6 rounded-lg bg-zinc-800/30 border border-zinc-800 p-4">
				<div className="flex gap-1 h-8 rounded-lg overflow-hidden">
					{PIPELINE_STAGES.map((stage) => (
						<motion.div
							key={stage.id}
							animate={{
								flex: triggeredStages.has(stage.id) ? 1 : 0.3,
								opacity: selected
									? triggeredStages.has(stage.id)
										? 1
										: 0.15
									: 0.4,
							}}
							transition={{ duration: 0.4, ease: "easeInOut" }}
							className="rounded flex items-center justify-center text-xs font-medium"
							style={{
								backgroundColor: `${stage.color}33`,
								color: stage.color,
								borderLeft: `3px solid ${stage.color}`,
							}}
						>
							{stage.label}
						</motion.div>
					))}
				</div>
				{selected && (
					<motion.p
						key={selected.property}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-xs text-zinc-500 mt-2 text-center"
					>
						{
							PIPELINE_STAGES.find((s) => s.id === selected.triggers)
								?.description
						}
					</motion.p>
				)}
			</div>

			{/* Property grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
				{CSS_PROPERTIES.map((prop) => {
					const isActive = selected?.property === prop.property;
					const costColor = COST_COLORS[prop.triggers];

					return (
						<motion.button
							key={prop.property}
							type="button"
							onClick={() => setSelected(isActive ? null : prop)}
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.97 }}
							className={`p-3 rounded-lg text-left transition-all border ${
								isActive
									? "bg-zinc-800 border-white/20"
									: "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
							}`}
						>
							<div className="flex items-center gap-1.5 mb-1">
								<span
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: costColor }}
								/>
								<span className="text-sm font-mono text-white">
									{prop.property}
								</span>
							</div>
							<span
								className="text-[10px] px-1.5 py-0.5 rounded border"
								style={{
									borderColor: `${costColor}44`,
									backgroundColor: `${costColor}11`,
									color: costColor,
								}}
							>
								{prop.triggers}
							</span>
						</motion.button>
					);
				})}
			</div>

			{/* Detail panel */}
			{selected && (
				<motion.div
					key={selected.property}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-5 p-4 rounded-lg border bg-zinc-800/50"
					style={{
						borderColor: `${COST_COLORS[selected.triggers]}33`,
					}}
				>
					<div className="flex items-center gap-2 mb-2">
						<code
							className="text-sm font-mono font-semibold"
							style={{ color: COST_COLORS[selected.triggers] }}
						>
							{selected.property}
						</code>
						<span className="text-xs text-zinc-500">—</span>
						<span className="text-xs text-zinc-400">{selected.example}</span>
					</div>
					<p className="text-sm text-zinc-400">{selected.explanation}</p>
				</motion.div>
			)}
		</DemoSection>
	);
}
