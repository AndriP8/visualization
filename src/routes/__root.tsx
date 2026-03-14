import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";

const NAV_GROUPS = [
	{
		title: "General",
		items: [{ to: "/" as const, label: "Home", icon: "🏠" }],
	},
	{
		title: "React",
		items: [
			{ to: "/reconciliation" as const, label: "Reconciliation", icon: "🌳" },
			{ to: "/react-state" as const, label: "State & Re-renders", icon: "⚡" },
		],
	},
	{
		title: "JavaScript",
		items: [
			{
				to: "/closure-scope" as const,
				label: "Closure & Scope",
				icon: "🔍",
			},
		
			{
				to: "/event-loop" as const,
				label: "Event Loop",
				icon: "🔄",
			},
		],
	},
	{
		title: "Browser",
		items: [
			{
				to: "/critical-rendering-path" as const,
				label: "Critical Rendering Path",
				icon: "🎨",
			},
			{
				to: "/event-loop" as const,
				label: "Event Loop",
				icon: "🔄",
			},
			{
				to: "/closure-scope" as const,
				label: "Closure & Scope",
				icon: "🔍",
			},
		],
	},
	{
		title: "Web",
		items: [
			{
				to: "/rendering-strategies" as const,
				label: "Rendering Strategies",
				icon: "🌍",
			},
		],
	},
	{
		title: "Database",
		items: [
			{
				to: "/database-indexing" as const,
				label: "Database Indexing",
				icon: "🗄️",
			},
		],
	},
] as const;

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="min-h-screen bg-zinc-950 text-gray-100 flex">
			{/* Mobile overlay */}
			{sidebarOpen && (
				<button
					type="button"
					className="fixed inset-0 bg-black/60 z-30 lg:hidden cursor-default"
					onClick={() => setSidebarOpen(false)}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`
					fixed lg:sticky top-0 left-0 z-40 h-screen w-64
					bg-zinc-900 border-r border-zinc-800
					flex flex-col
					transition-transform duration-300
					${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
				`}
			>
				<div className="p-5 border-b border-zinc-800">
					<h1 className="text-lg font-bold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
						⚡ Full-Stack Visualized
					</h1>
					<p className="text-xs text-zinc-500 mt-1">
						See every layer come alive
					</p>
				</div>

				<nav className="flex-1 p-3 space-y-6 overflow-y-auto">
					{NAV_GROUPS.map((group) => (
						<div key={group.title}>
							<h3 className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
								{group.title}
							</h3>
							<div className="space-y-1">
								{group.items.map((item) => (
									<Link
										key={item.to}
										to={item.to}
										className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800/70"
										activeProps={{
											className:
												"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors bg-violet-500/10 text-violet-300 border border-violet-500/20",
										}}
										onClick={() => setSidebarOpen(false)}
									>
										<span className="text-base">{item.icon}</span>
										<span>{item.label}</span>
									</Link>
								))}
							</div>
						</div>
					))}
				</nav>

				<div className="p-4 border-t border-zinc-800 text-xs text-zinc-600">
					Built for learning
				</div>
			</aside>

			{/* Main content */}
			<div className="flex-1 flex flex-col min-h-screen">
				{/* Mobile header */}
				<header className="lg:hidden sticky top-0 z-20 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
					<button
						type="button"
						onClick={() => setSidebarOpen(true)}
						className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 20 20"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<title>Menu</title>
							<path d="M3 5h14M3 10h14M3 15h14" />
						</svg>
					</button>
					<span className="text-sm font-semibold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
						⚡ Full-Stack Visualized
					</span>
				</header>

				<main className="flex-1 p-6 lg:p-8 overflow-y-auto">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
