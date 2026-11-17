export interface EventTrait {
	type: string;
	bubbles: boolean;
	note: string;
}

export const EVENT_TRAITS: readonly EventTrait[] = [
	{
		type: "click",
		bubbles: true,
		note: "Bubbles, so one ancestor can handle every descendant.",
	},
	{
		type: "focus",
		bubbles: false,
		note: "Fires only on the element that gained focus. Use focusin to delegate.",
	},
	{
		type: "focusin",
		bubbles: true,
		note: "The bubbling counterpart of focus.",
	},
	{
		type: "blur",
		bubbles: false,
		note: "Fires only on the element that lost focus. Use focusout to delegate.",
	},
	{
		type: "focusout",
		bubbles: true,
		note: "The bubbling counterpart of blur.",
	},
	{
		type: "mouseover",
		bubbles: true,
		note: "Bubbles, and fires again for every descendant the pointer crosses.",
	},
	{
		type: "mouseenter",
		bubbles: false,
		note: "Fires once, on the element the pointer entered. Never bubbles.",
	},
	{
		type: "keydown",
		bubbles: true,
		note: "Bubbles up from the element that has focus.",
	},
] as const;

/**
 * A listener can only be delegated when its event type bubbles. A listener on
 * an ancestor never sees a non-bubbling event.
 */
export function canDelegate(type: string): boolean {
	return EVENT_TRAITS.find((trait) => trait.type === type)?.bubbles ?? true;
}
