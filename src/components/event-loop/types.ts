export interface CallStackFrame {
	id: string;
	label: string;
	color: string;
}

export interface QueueItem {
	id: string;
	label: string;
	type: "microtask" | "macrotask" | "raf";
}

export type ActiveRegion =
	| "callstack"
	| "webapis"
	| "microtask"
	| "macrotask"
	| "raf"
	| "render"
	| null;

export interface ExecutionStep {
	callStack: CallStackFrame[];
	webApis: { id: string; label: string; remaining?: string }[];
	microtaskQueue: QueueItem[];
	macrotaskQueue: QueueItem[];
	output: string[];
	activeRegion: ActiveRegion;
	description: string;
	highlightLine?: number;
}

export interface CodeSnippet {
	name: string;
	code: string;
	steps: ExecutionStep[];
}
