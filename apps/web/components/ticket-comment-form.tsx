"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Props = Readonly<{ ticketId: string; agentMode: boolean }>;

export function TicketCommentForm({ ticketId, agentMode }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const content = new FormData(form).get("content");
    if (typeof content !== "string") return;
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/graphql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: "mutation($ticketId:ID!,$content:String!){addComment(ticketId:$ticketId,content:$content){id}}", variables: { ticketId, content } }) });
      const payload = await response.json() as { errors?: readonly { message: string }[] };
      const error = payload.errors?.[0];
      if (error) throw new Error(error.message);
      form.reset();
      setMessage("Your update was added.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add your update."); }
    finally { setBusy(false); }
  };
  return <form onSubmit={(event) => void submit(event)} className="comment-form"><h3>{agentMode ? "Reply to customer" : "Add an update"}</h3>{message && <p className={message === "Your update was added." ? "notice" : "error"}>{message}</p>}<div className="field"><label htmlFor="ticket-comment">{agentMode ? "Support response" : "Message"}</label><textarea id="ticket-comment" name="content" placeholder={agentMode ? "Write a helpful update" : "Add context or a follow-up for the support team"} required disabled={busy}/></div><button className="button lime" disabled={busy}>{busy ? "Saving…" : "Add comment"}</button></form>;
}
