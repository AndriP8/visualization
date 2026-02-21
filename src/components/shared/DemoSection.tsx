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
		<section className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
			<div className="px-6 py-4 border-b border-zinc-800">
				<h3 className="text-lg font-semibold text-white">{title}</h3>
				<p className="text-sm text-zinc-400 mt-1">{description}</p>
			</div>
			<div className="p-6">{children}</div>
		</section>
	);
}
