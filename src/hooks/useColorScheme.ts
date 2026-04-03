import { useEffect, useState } from "react";

export type ColorScheme = "light" | "dark";

function resolveScheme(): ColorScheme {
	const forced = document.documentElement.getAttribute("data-theme");
	if (forced === "light" || forced === "dark") return forced;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function useColorScheme(): ColorScheme {
	const [scheme, setScheme] = useState<ColorScheme>(resolveScheme);

	useEffect(() => {
		// Re-resolve when data-theme attribute changes
		const observer = new MutationObserver(() => setScheme(resolveScheme()));
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
		});

		// Also track system changes (relevant when data-theme is absent)
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const mqHandler = () => setScheme(resolveScheme());
		mq.addEventListener("change", mqHandler);

		return () => {
			observer.disconnect();
			mq.removeEventListener("change", mqHandler);
		};
	}, []);

	return scheme;
}
