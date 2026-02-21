import { motion } from "motion/react";
import type { NodeStatus } from "./types";

const STATUS_COLORS: Record<
	NodeStatus,
	{ bg: string; border: string; text: string }
> = {
	unchanged: { bg: "#18181b", border: "#3f3f46", text: "#a1a1aa" },
	updated: { bg: "#422006", border: "#ca8a04", text: "#fde047" },
	added: { bg: "#052e16", border: "#16a34a", text: "#4ade80" },
	removed: { bg: "#450a0a", border: "#dc2626", text: "#fca5a5" },
	destroyed: { bg: "#450a0a", border: "#991b1b", text: "#fca5a5" },
};

interface FiberNodeProps {
	id: string;
	type: string;
	x: number;
	y: number;
	status: NodeStatus;
	props?: Record<string, string>;
	highlighted?: boolean;
}

export function FiberNode({
	type,
	x,
	y,
	status,
	props,
	highlighted = false,
}: FiberNodeProps) {
	const color = STATUS_COLORS[status];
	const width = 100;
	const height = 44;
	const rx = x - width / 2;
	const ry = y - height / 2;

	return (
		<motion.g
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{
				opacity: status === "removed" ? 0.4 : 1,
				scale: 1,
			}}
			transition={{ duration: 0.4, ease: "easeOut" }}
		>
			{/* Node background */}
			<motion.rect
				x={rx}
				y={ry}
				width={width}
				height={height}
				rx={8}
				fill={color.bg}
				stroke={color.border}
				strokeWidth={highlighted ? 2.5 : 1.5}
				animate={{
					stroke: highlighted ? "#a78bfa" : color.border,
					filter: highlighted
						? "drop-shadow(0 0 8px rgba(167,139,250,0.4))"
						: "none",
				}}
				transition={{ duration: 0.3 }}
			/>

			{/* Element type label */}
			<text
				x={x}
				y={y - 4}
				textAnchor="middle"
				fill={color.text}
				fontSize={13}
				fontWeight={600}
				fontFamily="monospace"
			>
				{`<${type}>`}
			</text>

			{/* Props preview (if any) */}
			{props && Object.keys(props).length > 0 && (
				<text
					x={x}
					y={y + 12}
					textAnchor="middle"
					fill="#71717a"
					fontSize={9}
					fontFamily="monospace"
				>
					{Object.entries(props)
						.map(([k, v]) => `${k}="${v}"`)
						.join(" ")
						.slice(0, 18)}
				</text>
			)}

			{/* Status indicator dot */}
			<circle cx={rx + width - 6} cy={ry + 6} r={3} fill={color.border} />
		</motion.g>
	);
}
