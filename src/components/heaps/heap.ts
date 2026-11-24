export interface SwapStep {
	a: number;
	b: number;
}

export interface HeapifyStep {
	parent: number;
	swaps: SwapStep[];
}

function siftDown(heap: number[], from: number, swaps: SwapStep[]) {
	for (let i = from; ; ) {
		const left = i * 2 + 1;
		const right = left + 1;
		let smallest = i;
		if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
		if (right < heap.length && heap[right] < heap[smallest]) smallest = right;
		if (smallest === i) return;
		swaps.push({ a: i, b: smallest });
		[heap[i], heap[smallest]] = [heap[smallest], heap[i]];
		i = smallest;
	}
}

export function insertSteps(
	heap: number[],
	value: number,
): { heap: number[]; swaps: SwapStep[] } {
	const next = [...heap, value];
	const swaps: SwapStep[] = [];
	for (let i = next.length - 1; i > 0; ) {
		const parent = Math.floor((i - 1) / 2);
		if (next[parent] <= next[i]) break;
		swaps.push({ a: i, b: parent });
		[next[parent], next[i]] = [next[i], next[parent]];
		i = parent;
	}
	return { heap: next, swaps };
}

export function removeSteps(heap: number[]): {
	removed: number | null;
	heap: number[];
	movedLastToRoot: boolean;
	swaps: SwapStep[];
} {
	if (heap.length === 0)
		return { removed: null, heap: [], movedLastToRoot: false, swaps: [] };
	const removed = heap[0];
	if (heap.length === 1)
		return { removed, heap: [], movedLastToRoot: false, swaps: [] };
	const next = [...heap];
	const last = next.pop();
	next[0] = last as number;
	const swaps: SwapStep[] = [];
	siftDown(next, 0, swaps);
	return { removed, heap: next, movedLastToRoot: true, swaps };
}

export function heapifySteps(values: number[]): {
	heap: number[];
	steps: HeapifyStep[];
} {
	const heap = [...values];
	const steps: HeapifyStep[] = [];
	for (let parent = Math.floor(heap.length / 2) - 1; parent >= 0; parent--) {
		const swaps: SwapStep[] = [];
		siftDown(heap, parent, swaps);
		steps.push({ parent, swaps });
	}
	return { heap, steps };
}

export function isValidHeap(heap: number[]): boolean {
	for (let i = 1; i < heap.length; i++) {
		const parent = Math.floor((i - 1) / 2);
		if (heap[parent] > heap[i]) return false;
	}
	return true;
}
