interface DemoSectionProps {
	title: string;
	description: string;
	children: React.ReactNode;
}

export function DemoSection({
	title,
	description,
	children,
}: DemoSectionProps) {
	return (
		<section className="rounded-xl border border-border-primary bg-surface-primary/50 overflow-hidden">
			<div className="px-6 py-4 border-b border-border-primary">
				<h3 className="text-lg font-semibold text-text-primary">{title}</h3>
				<p className="text-sm text-text-tertiary mt-1">{description}</p>
			</div>
			<div className="p-6">{children}</div>
		</section>
	);
}
