import { useEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";

interface ShikiCodeProps {
	code: string;
	language?: string;
	highlightLine?: number; // 0-indexed
	className?: string;
	showLineNumbers?: boolean;
}

export function ShikiCode({
	code,
	language = "javascript",
	highlightLine = -1,
	className = "",
	showLineNumbers = true,
}: ShikiCodeProps) {
	const [html, setHtml] = useState<string>("");
	const containerRef = useRef<HTMLDivElement>(null);

	// 1. Generate HTML
	useEffect(() => {
		let isMounted = true;
		async function highlight() {
			try {
				const result = await codeToHtml(code, {
					lang: language,
					themes: {
						light: "vitesse-light",
						dark: "vitesse-dark",
					},
					defaultColor: false,
					transformers: [
						{
							line(node, line) {
								node.properties["data-line"] = line;
							},
						},
					],
				});
				if (isMounted) setHtml(result);
			} catch (err) {
				console.error("Failed to highlight code", err);
			}
		}
		highlight();
		return () => {
			isMounted = false;
		};
	}, [code, language]);

	// 2. Sync Highlight Line
	useEffect(() => {
		if (!containerRef.current || !html) return;
		const lines = containerRef.current.querySelectorAll(".line");
		lines.forEach((node, index) => {
			if (index === highlightLine) {
				node.classList.add("shiki-active-line");
			} else {
				node.classList.remove("shiki-active-line");
			}
		});
	}, [highlightLine, html]);

	return (
		<div
			ref={containerRef}
			className={`shiki-wrapper relative rounded-lg overflow-x-auto bg-surface-code border border-border-primary text-xs font-mono p-4 ${className} ${
				highlightLine >= 0 ? "shiki-has-highlight" : ""
			} ${showLineNumbers ? "shiki-show-line-numbers" : ""}`}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates safe HTML from local code strings
			dangerouslySetInnerHTML={{
				__html: html || `<pre><code>${code}</code></pre>`,
			}}
		/>
	);
}
