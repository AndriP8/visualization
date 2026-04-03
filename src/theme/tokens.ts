import type { ColorScheme } from "../hooks/useColorScheme";

export const THEME_COLORS = {
	light: {
		svgBg: "#fafafa",
		svgBorder: "#d4d4d8",
		svgText: "#52525b",
		svgTextMuted: "#a1a1aa",
	},
	dark: {
		svgBg: "#18181b",
		svgBorder: "#3f3f46",
		svgText: "#a1a1aa",
		svgTextMuted: "#71717a",
	},
} as const satisfies Record<ColorScheme, Record<string, string>>;
