export type NodeStatus =
	| "unchanged"
	| "updated"
	| "added"
	| "removed"
	| "destroyed";

export interface FiberNodeData {
	id: string;
	type: string;
	props?: Record<string, string>;
	status: NodeStatus;
	children?: FiberNodeData[];
}

export interface TreePosition {
	x: number;
	y: number;
}

/** Calculate positions for each node in a tree for SVG rendering */
export function layoutTree(
	node: FiberNodeData,
	depth = 0,
	index = 0,
	siblingCount = 1,
	parentX = 0,
	totalWidth = 500,
): Map<string, TreePosition> {
	const positions = new Map<string, TreePosition>();
	const nodeSpacing = totalWidth / siblingCount;
	const x = parentX + (index - (siblingCount - 1) / 2) * nodeSpacing;
	const y = depth * 90 + 40;

	positions.set(node.id, { x, y });

	if (node.children) {
		for (let i = 0; i < node.children.length; i++) {
			const childPositions = layoutTree(
				node.children[i],
				depth + 1,
				i,
				node.children.length,
				x,
				nodeSpacing,
			);
			for (const [id, pos] of childPositions) {
				positions.set(id, pos);
			}
		}
	}

	return positions;
}
