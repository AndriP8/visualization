export interface TableRow {
	id: number;
	name: string;
	age: number;
	email: string;
}

export interface BTreeNode {
	id: string;
	keys: number[];
	children: BTreeNode[];
	isLeaf: boolean;
}

export interface BTreeState {
	root: BTreeNode;
	order: number; // max children = order, max keys = order - 1
}

export type ScanPhase = "idle" | "scanning" | "done";
export type IndexLookupPhase = "idle" | "root" | "internal" | "leaf" | "done";

export interface ScanState {
	phase: ScanPhase;
	scannedIndex: number; // current row index being scanned
	foundIndex: number | null;
}

export interface IndexLookupState {
	phase: IndexLookupPhase;
	foundIndex: number | null;
}

export type IndexType = "clustered" | "non-clustered";

export type WhenNotIndexScenario =
	| "high-write"
	| "low-cardinality"
	| "small-table";
