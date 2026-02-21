import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: () => (
		<div className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 flex flex-col">
			<header className="p-4 bg-white dark:bg-zinc-800 shadow-sm">
				<h1 className="text-xl font-bold">Visualization UI</h1>
			</header>
			<main className="flex-1 p-4">
				<Outlet />
			</main>
		</div>
	),
});
