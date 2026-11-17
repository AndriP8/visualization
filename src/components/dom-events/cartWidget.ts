export const EVENT_NAME = "cart:add";

export interface CartEventDetail {
	item: string;
}

export interface CartWidgetOptions {
	bubbles: boolean;
	composed: boolean;
}

/**
 * A real custom element, defined outside React. React never renders it, so a
 * DOM event is the only way for the page to hear about a click.
 */
export class CartWidget extends HTMLElement {
	private counter = 0;
	private options: CartWidgetOptions = { bubbles: true, composed: true };

	setOptions(options: CartWidgetOptions) {
		this.options = options;
	}

	connectedCallback() {
		this.innerHTML = `
			<button type="button" style="width:100%;border:1px solid #f97316;background:rgba(249,115,22,0.1);color:#fdba74;border-radius:6px;padding:10px 12px;font-size:13px;cursor:pointer;">
				Add a latte
			</button>
		`;
		this.querySelector("button")?.addEventListener("click", () => {
			this.counter += 1;
			this.dispatchEvent(
				new CustomEvent<CartEventDetail>(EVENT_NAME, {
					bubbles: this.options.bubbles,
					composed: this.options.composed,
					detail: { item: `Latte #${this.counter}` },
				}),
			);
		});
	}
}

export function defineCartWidget(): void {
	if (typeof customElements === "undefined") return;
	if (customElements.get("cart-widget")) return;
	customElements.define("cart-widget", CartWidget);
}
