"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { fetchMessagesForClass, sendMessage, type MessageData } from "@/app/lib/actions/messages.actions";

// Matches the notification dropdown's polling cadence/visibility-awareness —
// there's no websocket/SSE server in this app, so a live-feeling thread has
// to be built on the same "poll while the tab is actually visible" pattern
// already established there.
const POLL_INTERVAL_MS = 15_000;

export default function MessageThread({
	classId,
	initialMessages,
	currentUserId,
	otherPartyName,
}: {
	classId: string;
	initialMessages: MessageData[];
	currentUserId: string;
	otherPartyName: string;
}) {
	const [messages, setMessages] = useState(initialMessages);
	const [draft, setDraft] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.visibilityState !== "visible") return;
			fetchMessagesForClass(classId).then(setMessages);
		}, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [classId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: "end" });
	}, [messages.length]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const body = draft;
		if (!body.trim()) return;

		setError(null);
		startTransition(async () => {
			const result = await sendMessage(classId, body);
			if (result.error) {
				setError(result.error);
				return;
			}
			setDraft("");
			const fresh = await fetchMessagesForClass(classId);
			setMessages(fresh);
		});
	}

	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body gap-4">
				<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
					Messages
				</h3>

				<div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
					{messages.length === 0 ? (
						<p className="text-center text-base-content/40 text-sm py-6">
							No messages yet. Say hello to {otherPartyName}.
						</p>
					) : (
						messages.map((m) => {
							const mine = m.senderId === currentUserId;
							return (
								<div key={m.id} className={`chat ${mine ? "chat-end" : "chat-start"}`}>
									<div className="chat-header text-xs text-base-content/50">
										{mine ? "You" : m.senderName}
									</div>
									<div className={`chat-bubble text-sm ${mine ? "chat-bubble-primary" : ""}`}>
										{m.body}
									</div>
									<div className="chat-footer text-[0.65rem] text-base-content/40">
										{new Date(m.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
									</div>
								</div>
							);
						})
					)}
					<div ref={bottomRef} />
				</div>

				{error && (
					<div role="alert" className="alert alert-error text-sm py-2">
						<i className="fa-solid fa-triangle-exclamation"></i>
						<span>{error}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="flex gap-2">
					<input
						type="text"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						placeholder={`Message ${otherPartyName}...`}
						maxLength={2000}
						className="input input-bordered input-sm flex-1"
						disabled={isPending}
					/>
					<button
						type="submit"
						className="btn btn-primary btn-sm"
						disabled={isPending || !draft.trim()}
					>
						{isPending ? <span className="loading loading-spinner loading-xs" /> : <i className="fa-solid fa-paper-plane"></i>}
					</button>
				</form>
			</div>
		</div>
	);
}
