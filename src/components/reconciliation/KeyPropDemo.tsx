import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface ListItem {
	id: number;
	label: string;
	color: string;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

const INITIAL_ITEMS: ListItem[] = [
	{ id: 1, label: "Apple", color: COLORS[0] },
	{ id: 2, label: "Banana", color: COLORS[1] },
	{ id: 3, label: "Cherry", color: COLORS[2] },
	{ id: 4, label: "Date", color: COLORS[3] },
];

function computeOps(
	oldItems: ListItem[],
	newItems: ListItem[],
	useKeys: boolean,
): string[] {
	if (useKeys) {
		const ops: string[] = [];
		const oldIds = oldItems.map((i) => i.id);
		const newIds = newItems.map((i) => i.id);

		for (const id of newIds) {
			if (!oldIds.includes(id)) {
				ops.push(`INSERT "${newItems.find((i) => i.id === id)?.label}"`);
			}
		}
		for (const id of oldIds) {
			if (!newIds.includes(id)) {
				ops.push(`DELETE "${oldItems.find((i) => i.id === id)?.label}"`);
			}
		}
		const remaining = newIds.filter((id) => oldIds.includes(id));
		const oldFiltered = oldIds.filter((id) => newIds.includes(id));
		for (let i = 0; i < remaining.length; i++) {
			if (remaining[i] !== oldFiltered[i]) {
				ops.push(
					`MOVE "${newItems.find((item) => item.id === remaining[i])?.label}"`,
				);
			}
		}
		return ops.length > 0 ? ops : ["No DOM operations needed"];
	}
	const ops: string[] = [];
	const maxLen = Math.max(oldItems.length, newItems.length);
	for (let i = 0; i < maxLen; i++) {
		if (i >= oldItems.length) {
			ops.push(`INSERT at index ${i}`);
		} else if (i >= newItems.length) {
			ops.push(`DELETE at index ${i}`);
		} else if (oldItems[i].id !== newItems[i].id) {
			ops.push(`UPDATE index ${i} props (wasteful!)`);
		}
	}
	return ops.length > 0 ? ops : ["No DOM operations needed"];
}

function ListPanel({
	title,
	subtitle,
	items,
	useKeys,
	previousItems,
}: {
	title: string;
	subtitle: string;
	items: ListItem[];
	useKeys: boolean;
	previousItems: ListItem[];
}) {
	const ops = computeOps(previousItems, items, useKeys);
	const wastefulCount = ops.filter((op) => op.includes("wasteful")).length;

	return (
		<div className="flex-1 min-w-50">
			<div className="mb-3">
				<div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
					{title}
				</div>
				<div className="text-xs text-text-faint mt-0.5">{subtitle}</div>
			</div>

			<div className="space-y-1.5">
				{items.map((item, i) => (
					<motion.div
						key={useKeys ? item.id : i}
						layout={useKeys}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 10 }}
						transition={{ duration: 0.3 }}
						className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary/60 border border-border-secondary/50"
					>
						<span
							className="w-3 h-3 rounded-full shrink-0"
							style={{ backgroundColor: item.color }}
						/>
						<span className="text-sm text-text-secondary font-mono">
							{useKeys ? `key={${item.id}}` : `index={${i}}`}
						</span>
						<span className="text-sm text-text-tertiary">{item.label}</span>
					</motion.div>
				))}
			</div>

			{/* DOM operations */}
			<div className="mt-3 p-3 rounded-lg bg-surface-primary border border-border-primary">
				<div className="flex items-center justify-between mb-1.5">
					<span className="text-[10px] text-text-muted uppercase tracking-wider">
						DOM Operations ({ops.length})
					</span>
					{wastefulCount > 0 && (
						<span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-accent-red-soft border border-red-500/20">
							{wastefulCount} wasteful
						</span>
					)}
				</div>
				{ops.map((op) => (
					<div
						key={op}
						className={`text-xs font-mono ${
							op.includes("wasteful")
								? "text-accent-red-soft"
								: op.includes("No DOM")
									? "text-accent-green-soft"
									: "text-accent-yellow-soft"
						}`}
					>
						{op}
					</div>
				))}
			</div>
		</div>
	);
}

type ActionType = "none" | "shuffle" | "add" | "remove";

const ACTION_INSIGHTS: Record<ActionType, string> = {
	none: "Try clicking Shuffle, Add, or Remove First to see how React handles list changes differently with and without keys.",
	shuffle:
		'🔀 Shuffle: Without keys, React sees "different item at index 0, 1, 2..." and updates EVERY node\'s content. With keys, React recognizes the SAME items just moved — it only needs DOM move operations.',
	add: "➕ Add: Both approaches handle appending similarly. But try adding to the BEGINNING of the list to see the real difference — without keys, every index shifts and gets updated.",
	remove:
		'🗑 Remove First: Without keys, React sees "index 0 now has Banana instead of Apple" and updates ALL remaining items. With keys, React knows only Apple was removed — one DOM deletion.',
};

export function KeyPropDemo() {
	const [items, setItems] = useState(INITIAL_ITEMS);
	const [prevItems, setPrevItems] = useState(INITIAL_ITEMS);
	const [lastAction, setLastAction] = useState<ActionType>("none");

	const shuffle = useCallback(() => {
		setPrevItems(items);
		setLastAction("shuffle");
		setItems((prev) => {
			const copy = [...prev];
			for (let i = copy.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[copy[i], copy[j]] = [copy[j], copy[i]];
			}
			return copy;
		});
	}, [items]);

	const addItem = useCallback(() => {
		setPrevItems(items);
		setLastAction("add");
		const nextId = Math.max(...items.map((i) => i.id)) + 1;
		setItems((prev) => [
			...prev,
			{
				id: nextId,
				label: `Fruit ${nextId}`,
				color: COLORS[nextId % COLORS.length],
			},
		]);
	}, [items]);

	const removeFirst = useCallback(() => {
		setPrevItems(items);
		setLastAction("remove");
		setItems((prev) => prev.slice(1));
	}, [items]);

	const reset = useCallback(() => {
		setPrevItems(INITIAL_ITEMS);
		setItems(INITIAL_ITEMS);
		setLastAction("none");
	}, []);

	return (
		<DemoSection
			title="Demo 3: Key Prop Effect"
			description="When rendering lists, React needs a way to identify which items changed. Keys tell React which item is which."
		>
			{/* Concept explanation */}
			<div className="mb-5 p-4 rounded-lg bg-surface-secondary/30 border border-border-primary text-sm text-text-tertiary space-y-2">
				<p>
					<strong className="text-text-secondary">The Problem:</strong> When a
					list changes (reorder, add, remove), React must figure out what
					happened. It has two strategies:
				</p>
				<div className="grid sm:grid-cols-2 gap-3 mt-2">
					<div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
						<div className="text-xs font-semibold text-accent-red-soft mb-1">
							❌ Without Keys (by index)
						</div>
						<p className="text-xs text-text-muted">
							React compares position 0 to position 0, position 1 to position 1,
							etc. If you shuffle items, React thinks{" "}
							<em>every single item changed</em> — because the content at each
							index is different.
						</p>
					</div>
					<div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
						<div className="text-xs font-semibold text-accent-green-soft mb-1">
							✅ With Keys (by identity)
						</div>
						<p className="text-xs text-text-muted">
							React matches items by their <code>key</code>. If you shuffle,
							React knows Apple is still Apple — it just moved. Only DOM{" "}
							<em>move</em> operations are needed, not content updates.
						</p>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="flex flex-wrap gap-2 mb-4">
				{[
					{ label: "🔀 Shuffle", action: shuffle },
					{ label: "➕ Add", action: addItem },
					{ label: "🗑 Remove First", action: removeFirst },
					{ label: "↺ Reset", action: reset },
				].map(({ label, action }) => (
					<button
						key={label}
						type="button"
						onClick={action}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary text-text-secondary border border-border-secondary hover:bg-surface-tertiary transition-colors"
					>
						{label}
					</button>
				))}
			</div>

			{/* Action insight */}
			<motion.div
				key={lastAction}
				initial={{ opacity: 0, y: -5 }}
				animate={{ opacity: 1, y: 0 }}
				className={`mb-5 px-4 py-3 rounded-lg text-xs border ${
					lastAction === "none"
						? "bg-surface-secondary/30 border-border-secondary/50 text-text-muted"
						: "bg-violet-500/5 border-violet-500/20 text-accent-violet"
				}`}
			>
				{ACTION_INSIGHTS[lastAction]}
			</motion.div>

			{/* Side by side */}
			<div className="flex flex-col sm:flex-row gap-6">
				<ListPanel
					title="Without keys (index-based)"
					subtitle="React compares by position: item[0] vs item[0], item[1] vs item[1]..."
					items={items}
					useKeys={false}
					previousItems={prevItems}
				/>
				<ListPanel
					title="With keys (key={id})"
					subtitle="React matches by identity: key=1 is always Apple, no matter the position"
					items={items}
					useKeys={true}
					previousItems={prevItems}
				/>
			</div>
		</DemoSection>
	);
}
