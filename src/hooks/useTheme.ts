import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function getSystemScheme(): "light" | "dark" {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(pref: ThemePreference) {
	const root = document.documentElement;
	if (pref === "system") {
		root.removeAttribute("data-theme");
	} else {
		root.setAttribute("data-theme", pref);
	}
}

export function useTheme() {
	const [preference, setPreferenceState] = useState<ThemePreference>(() => {
		const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
		return stored ?? "system";
	});

	// Resolved scheme — what the UI actually renders as
	const [resolved, setResolved] = useState<"light" | "dark">(() => {
		const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
		if (stored === "light" || stored === "dark") return stored;
		return getSystemScheme();
	});

	// Apply on mount and when preference changes
	useEffect(() => {
		applyTheme(preference);
		setResolved(preference === "system" ? getSystemScheme() : preference);
	}, [preference]);

	// Track system changes when preference is "system"
	useEffect(() => {
		if (preference !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) =>
			setResolved(e.matches ? "dark" : "light");
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [preference]);

	const setTheme = useCallback((pref: ThemePreference) => {
		localStorage.setItem(STORAGE_KEY, pref);
		setPreferenceState(pref);
	}, []);

	return { preference, resolved, setTheme };
}
