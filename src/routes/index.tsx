import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<div className="p-4">
			<h2 className="text-2xl font-bold mb-4">Welcome to Visualization UI</h2>
			<p className="text-gray-600 dark:text-gray-400">
				This is the home page. You can add more routes using TanStack Router.
			</p>
		</div>
	);
}
