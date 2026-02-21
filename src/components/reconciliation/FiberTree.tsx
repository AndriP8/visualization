import { FiberNode } from "./FiberNode";
import { TreeEdge } from "./TreeEdge";
import type { FiberNodeData } from "./types";
import { layoutTree } from "./types";

interface FiberTreeProps {
	root: FiberNodeData;
	width?: number;
	height?: number;
	label?: string;
	highlightedIds?: Set<string>;
}

export function FiberTree({
	root,
	width = 500,
	height = 300,
	label,
	highlightedIds,
}: FiberTreeProps) {
	const positions = layoutTree(root, 0, 0, 1, width / 2, width * 0.8);

	const renderEdges = (node: FiberNodeData): React.ReactNode[] => {
		const edges: React.ReactNode[] = [];
		const parentPos = positions.get(node.id);
		if (!parentPos || !node.children) return edges;

		for (const child of node.children) {
			const childPos = positions.get(child.id);
			if (childPos) {
				edges.push(
					<TreeEdge
						key={`${node.id}-${child.id}`}
						fromX={parentPos.x}
						fromY={parentPos.y}
						toX={childPos.x}
						toY={childPos.y}
						status={child.status}
					/>,
				);
				edges.push(...renderEdges(child));
			}
		}
		return edges;
	};

	const renderNodes = (node: FiberNodeData): React.ReactNode[] => {
		const nodes: React.ReactNode[] = [];
		const pos = positions.get(node.id);
		if (!pos) return nodes;

		nodes.push(
			<FiberNode
				key={node.id}
				id={node.id}
				type={node.type}
				x={pos.x}
				y={pos.y}
				status={node.status}
				props={node.props}
				highlighted={highlightedIds?.has(node.id)}
			/>,
		);

		if (node.children) {
			for (const child of node.children) {
				nodes.push(...renderNodes(child));
			}
		}

		return nodes;
	};

	return (
		<div className="relative">
			{label && (
				<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 text-center">
					{label}
				</div>
			)}
			<svg
				width={width}
				height={height}
				viewBox={`0 0 ${width} ${height}`}
				className="overflow-visible"
				role="img"
				aria-label={label ?? "Fiber tree visualization"}
			>
				{renderEdges(root)}
				{renderNodes(root)}
			</svg>
		</div>
	);
}
