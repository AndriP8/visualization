import { motion } from "motion/react";

interface TreeEdgeProps {
	fromX: number;
	fromY: number;
	toX: number;
	toY: number;
	status?: "unchanged" | "updated" | "added" | "removed" | "destroyed";
}

const STATUS_STROKE: Record<string, string> = {
	unchanged: "var(--svg-border)",
	updated: "#ca8a04",
	added: "#16a34a",
	removed: "#dc2626",
	destroyed: "#991b1b",
};

export function TreeEdge({
	fromX,
	fromY,
	toX,
	toY,
	status = "unchanged",
}: TreeEdgeProps) {
	const midY = (fromY + toY) / 2;
	const path = `M ${fromX} ${fromY + 22} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY - 22}`;

	return (
		<motion.path
			d={path}
			stroke={STATUS_STROKE[status]}
			strokeWidth={1.5}
			fill="none"
			initial={{ pathLength: 0, opacity: 0 }}
			animate={{
				pathLength: 1,
				opacity: status === "removed" ? 0.3 : 0.7,
			}}
			transition={{ duration: 0.5, ease: "easeOut" }}
		/>
	);
}
