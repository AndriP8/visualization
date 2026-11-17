import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"cart-widget": DetailedHTMLProps<
				HTMLAttributes<HTMLElement>,
				HTMLElement
			>;
		}
	}
}
