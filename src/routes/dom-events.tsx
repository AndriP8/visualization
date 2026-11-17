import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CustomEventDemo } from "../components/dom-events/CustomEventDemo";
import { DefaultActionDemo } from "../components/dom-events/DefaultActionDemo";
import { EventDelegationDemo } from "../components/dom-events/EventDelegationDemo";
import { EventPropagationDemo } from "../components/dom-events/EventPropagationDemo";
import { ListenerOptionsDemo } from "../components/dom-events/ListenerOptionsDemo";
import { NonBubblingDemo } from "../components/dom-events/NonBubblingDemo";
import { ReactVsNativeDemo } from "../components/dom-events/ReactVsNativeDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/dom-events")({
	component: DomEventsPage,
});

function DomEventsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8 pb-20">
			<PageHeader
				topic={{ label: "Browser", color: "orange" }}
				title="DOM Event Propagation"
				subtitle="A DOM event travels through a tree of elements in phases, giving ancestors and targets a predictable chance to respond."
				gradient={{ from: "orange-400", to: "amber-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300 [&_code]:text-xs [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:rounded [&_code]:text-zinc-200">
							<p>
								When a click happens, the browser identifies its target and
								dispatches one event through the DOM. During{" "}
								<span className="font-medium text-orange-300">capture</span>,
								listeners run from the outer document toward the target.
							</p>
							<p>
								The target handles the event, then{" "}
								<span className="font-medium text-amber-300">bubbling</span>{" "}
								runs listeners back outward. Bubbling enables event delegation:
								one ancestor can handle interactions from many descendants. Each
								listener is tuned via <code>addEventListener</code> options:{" "}
								<code>capture: true</code> joins the downward phase,{" "}
								<code>once: true</code> auto-removes itself after the first
								call, and <code>passive: true</code> promises never to call{" "}
								<code>preventDefault()</code> so scrolling stays smooth. Calling{" "}
								<code>stopPropagation()</code> prevents the event from
								continuing to later ancestors, and apps can dispatch their own{" "}
								<span className="font-medium text-amber-300">CustomEvent</span>{" "}
								with a <code>detail</code> payload for ancestors to receive.
							</p>
							<p className="text-zinc-400">
								Not every event bubbles. Focus and blur stay on the element that
								fired them, so delegation needs <code>focusin</code> and{" "}
								<code>focusout</code> instead. React's synthetic events follow
								the same capture → target → bubble contract, but React attaches
								its listeners to the root container, so they run at a different
								moment than a native listener on the same element. The demos
								trace propagation phases, delegate events from a shared
								ancestor, distinguish cancelling a browser default from stopping
								event propagation, dispatch custom events with payloads, show
								which events refuse to bubble, tune listeners with options, and
								compare React's ordering against the browser's.
							</p>
						</div>
					),
				}}
			/>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<EventPropagationDemo />
				<EventDelegationDemo />
				<DefaultActionDemo />
				<CustomEventDemo />
				<NonBubblingDemo />
				<ListenerOptionsDemo />
				<ReactVsNativeDemo />
			</motion.div>
		</div>
	);
}
