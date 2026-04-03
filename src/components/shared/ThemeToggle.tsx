import { type ThemePreference, useTheme } from "../../hooks/useTheme";

const OPTIONS: { value: ThemePreference; icon: string; label: string }[] = [
	{ value: "light", icon: "☀️", label: "Light" },
	{ value: "system", icon: "💻", label: "System" },
	{ value: "dark", icon: "🌙", label: "Dark" },
];

export function ThemeToggle() {
	const { preference, setTheme } = useTheme();

	return (
		<fieldset className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-secondary border border-border-primary m-0 border-solid">
			<legend className="sr-only">Theme preference</legend>
			{OPTIONS.map(({ value, icon, label }) => (
				<button
					key={value}
					type="button"
					onClick={() => setTheme(value)}
					title={label}
					aria-pressed={preference === value}
					className={`
						flex items-center justify-center w-7 h-7 rounded-md text-sm transition-all
						${
							preference === value
								? "bg-surface-base shadow-sm text-text-primary"
								: "text-text-muted hover:text-text-primary"
						}
					`}
				>
					{icon}
				</button>
			))}
		</fieldset>
	);
}
