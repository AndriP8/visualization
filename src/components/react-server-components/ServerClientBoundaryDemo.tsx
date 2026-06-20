import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Runtime = "server" | "client";

interface ComponentNode {
	id: string;
	label: string;
	runtime: Runtime;
	bundleKB: number;
	children?: string[];
	isDonutChild?: boolean;
}

type PropType = "string" | "number" | "object" | "function" | "class";

interface PropAttempt {
	name: string;
	type: PropType;
}

const INITIAL_TREE: ComponentNode[] = [
	{
		id: "root",
		label: "RootLayout",
		runtime: "server",
		bundleKB: 0,
		children: ["sidebar", "main"],
	},
	{
		id: "sidebar",
		label: "Sidebar",
		runtime: "server",
		bundleKB: 0,
		children: ["navitem"],
	},
	{ id: "navitem", label: "NavItem", runtime: "server", bundleKB: 0 },
	{
		id: "main",
		label: "ProductList",
		runtime: "server",
		bundleKB: 0,
		children: ["cart-btn"],
	},
	{
		id: "cart-btn",
		label: "AddToCartBtn",
		runtime: "client",
		bundleKB: 3.2,
		children: ["cart-child"],
	},
	{
		id: "cart-child",
		label: "ProductInfo",
		runtime: "server",
		bundleKB: 0,
		isDonutChild: true,
	},
];

const PROP_TYPES: { type: PropType; label: string; serializable: boolean }[] = [
	{ type: "string", label: "string", serializable: true },
	{ type: "number", label: "number", serializable: true },
	{ type: "object", label: "plain object", serializable: true },
	{ type: "function", label: "function (onClick)", serializable: false },
	{ type: "class", label: "class instance", serializable: false },
];

export function ServerClientBoundaryDemo() {
	const [tree, setTree] = useState<ComponentNode[]>(INITIAL_TREE);
	const [propAttempt, setPropAttempt] = useState<PropAttempt>({
		name: "handler",
		type: "string",
	});
	const [showingCrossing, setShowingCrossing] = useState(false);

	const totalBundle = tree.reduce((sum, n) => sum + n.bundleKB, 0);
	const clientCount = tree.filter((n) => n.runtime === "client").length;
	const serverCount = tree.filter((n) => n.runtime === "server").length;

	function toggleRuntime(id: string) {
		setTree((prev) =>
			prev.map((n) => {
				if (n.id !== id) return n;
				if (n.isDonutChild) return n;
				const next: Runtime = n.runtime === "server" ? "client" : "server";
				return { ...n, runtime: next, bundleKB: next === "client" ? 2.8 : 0 };
			}),
		);
	}

	const selectedProp = PROP_TYPES.find((p) => p.type === propAttempt.type)!;
	const crossingFromServer =
		tree.find((n) => n.id === "main")?.runtime === "server";
	const crossingToClient =
		tree.find((n) => n.id === "cart-btn")?.runtime === "client";
	const boundaryViolation =
		showingCrossing &&
		!selectedProp.serializable &&
		crossingFromServer &&
		crossingToClient;

	return (
		<DemoSection
			title="Server / Client Boundary"
			description="Toggle components between server and client. Watch bundle size update and see what breaks when you cross the boundary with non-serializable props."
		>
			<div className="space-y-6">
				{/* Bundle meter */}
				<div className="flex items-center gap-6 bg-zinc-800/50 rounded-lg p-4">
					<div>
						<p className="text-xs text-zinc-500 mb-1">Client bundle</p>
						<p className="text-2xl font-bold text-blue-400">
							{totalBundle.toFixed(1)}{" "}
							<span className="text-sm font-normal text-zinc-400">KB</span>
						</p>
					</div>
					<div className="flex-1 h-3 bg-zinc-700 rounded-full overflow-hidden">
						<motion.div
							className="h-full bg-linear-to-r from-blue-500 to-violet-500 rounded-full"
							animate={{ width: `${Math.min((totalBundle / 20) * 100, 100)}%` }}
							transition={{ duration: 0.4 }}
						/>
					</div>
					<div className="text-right">
						<p className="text-xs text-zinc-500">
							<span className="text-emerald-400">{serverCount} server</span> ·{" "}
							<span className="text-violet-400">{clientCount} client</span>
						</p>
						<p className="text-xs text-zinc-500">components</p>
					</div>
				</div>

				{/* Component tree */}
				<div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 space-y-2">
					<h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
						Component Tree
					</h4>
					{tree.map((node) => (
						<motion.div
							key={node.id}
							layout
							className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
								node.isDonutChild
									? "ml-12 border-dashed border-emerald-500/40 bg-emerald-500/5"
									: node.runtime === "server"
										? "border-emerald-500/30 bg-emerald-500/10"
										: "border-violet-500/30 bg-violet-500/10"
							} ${node.id === "sidebar" || node.id === "main" ? "ml-4" : ""} ${
								node.id === "navitem" || node.id === "cart-btn" ? "ml-8" : ""
							} ${node.id === "cart-child" ? "ml-12" : ""}`}
						>
							<span
								className={`text-xs font-mono font-semibold ${node.runtime === "server" ? "text-emerald-400" : "text-violet-400"}`}
							>
								{`<${node.label}>`}
							</span>
							{node.isDonutChild && (
								<span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
									donut child — still server
								</span>
							)}
							{!node.isDonutChild && (
								<>
									<span
										className={`ml-auto text-xs px-2 py-0.5 rounded font-medium ${node.runtime === "server" ? "text-emerald-400 bg-emerald-500/20" : "text-violet-400 bg-violet-500/20"}`}
									>
										{node.runtime === "server" ? "SERVER" : "CLIENT"}
									</span>
									{node.runtime === "client" && (
										<span className="text-xs text-blue-400">
											{node.bundleKB} KB
										</span>
									)}
									{node.id !== "root" && (
										<button
											type="button"
											onClick={() => toggleRuntime(node.id)}
											className="text-xs text-zinc-500 hover:text-zinc-300 underline ml-1 transition-colors"
										>
											toggle
										</button>
									)}
								</>
							)}
						</motion.div>
					))}
					<p className="text-xs text-zinc-600 mt-2 italic">
						ProductInfo is passed as{" "}
						<code className="text-amber-400">children</code> prop to
						AddToCartBtn — the "donut" pattern keeps it server-rendered.
					</p>
				</div>

				{/* Prop crossing tester */}
				<div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4 space-y-3">
					<h4 className="text-sm font-medium text-zinc-300">
						Cross-Boundary Prop Test{" "}
						<span className="text-xs font-normal text-zinc-500">
							ProductList → AddToCartBtn
						</span>
					</h4>
					<div className="flex flex-wrap gap-2">
						{PROP_TYPES.map((p) => (
							<button
								key={p.type}
								type="button"
								onClick={() => {
									setPropAttempt({ name: "handler", type: p.type });
									setShowingCrossing(true);
								}}
								className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
									propAttempt.type === p.type
										? p.serializable
											? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
											: "bg-red-500/20 text-red-300 border-red-500/50"
										: "bg-zinc-700/50 text-zinc-400 border-zinc-600 hover:text-white"
								}`}
							>
								{p.label}
							</button>
						))}
					</div>

					<AnimatePresence mode="wait">
						{showingCrossing && (
							<motion.div
								key={propAttempt.type}
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								className={`rounded-lg border p-3 ${boundaryViolation ? "border-red-500/40 bg-red-500/10" : "border-emerald-500/40 bg-emerald-500/10"}`}
							>
								{boundaryViolation ? (
									<>
										<p className="text-sm font-medium text-red-400 mb-1">
											Serialization Error
										</p>
										<p className="text-xs text-zinc-400">
											<code className="text-red-300">{selectedProp.label}</code>{" "}
											cannot cross the server→client boundary. Functions and
											class instances are not JSON-serializable — React cannot
											encode them in the Flight payload.
										</p>
										<p className="text-xs text-zinc-500 mt-2">
											Fix: move the handler <em>inside</em> AddToCartBtn (it's
											already a Client Component) or use a Server Action.
										</p>
									</>
								) : (
									<>
										<p className="text-sm font-medium text-emerald-400 mb-1">
											Valid prop
										</p>
										<p className="text-xs text-zinc-400">
											<code className="text-emerald-300">
												{selectedProp.label}
											</code>{" "}
											is serializable — React can encode it in the Flight
											payload and pass it safely to the Client Component.
										</p>
									</>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<ShikiCode
					language="tsx"
					code={`// "use client" marks where the CLIENT tree begins.
// Components ABOVE it are server-only.
// Components BELOW it run on the client (and optionally SSR).

// ProductList.tsx — NO directive, so it's a Server Component
export async function ProductList() {
  const products = await db.query("SELECT * FROM products"); // DB access OK
  return (
    <AddToCartBtn>
      {/* ProductInfo is passed as children — still server-rendered! */}
      <ProductInfo product={products[0]} />
    </AddToCartBtn>
  );
}

// AddToCartBtn.tsx — CLIENT boundary
"use client";
export function AddToCartBtn({ children }: { children: React.ReactNode }) {
  const [qty, setQty] = useState(0);
  return (
    <div>
      <button onClick={() => setQty(q => q + 1)}>Add {qty}</button>
      {children} {/* Rendered on server, passed through as opaque payload */}
    </div>
  );
}`}
					showLineNumbers={false}
					className="text-xs"
				/>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
					{[
						{
							title: "Server Components",
							points: [
								"Zero client JS",
								"Direct DB access",
								"No useState / useEffect",
								"Cannot handle events",
							],
							color: "emerald",
						},
						{
							title: '"use client" boundary',
							points: [
								"One-way gate into client tree",
								"Children passed as props remain server",
								"Above = server; below = client",
								"Not the whole subtree",
							],
							color: "amber",
						},
						{
							title: "Client Components",
							points: [
								"useState / useEffect ok",
								"Event handlers ok",
								"Ships JS to browser",
								"Can also SSR (pre-render on server)",
							],
							color: "violet",
						},
					].map((col) => (
						<div
							key={col.title}
							className={`rounded-lg border p-3 space-y-1.5 ${match(col.color)
								.with(
									"emerald",
									() => "border-emerald-500/30 bg-emerald-500/10",
								)
								.with("amber", () => "border-amber-500/30 bg-amber-500/10")
								.with("violet", () => "border-violet-500/30 bg-violet-500/10")
								.otherwise(() => "border-zinc-700 bg-zinc-800/50")}`}
						>
							<p
								className={`font-semibold ${match(col.color)
									.with("emerald", () => "text-emerald-400")
									.with("amber", () => "text-amber-400")
									.with("violet", () => "text-violet-400")
									.otherwise(() => "text-zinc-300")}`}
							>
								{col.title}
							</p>
							{col.points.map((pt) => (
								<p key={pt} className="text-zinc-400">
									{pt}
								</p>
							))}
						</div>
					))}
				</div>
			</div>
		</DemoSection>
	);
}
