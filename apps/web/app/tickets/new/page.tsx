"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "../../../components/shell";
import { createTicket, type CreateState } from "./actions";
const initial: CreateState = {};
export default function NewTicketPage() {
  const [state, action, pending] = useActionState(createTicket, initial);
  const router = useRouter();
  useEffect(() => { if (state.ticketId) router.push(`/tickets/${state.ticketId}`); }, [router, state.ticketId]);
  return <Shell><header className="top"><div><div className="eyebrow">New request</div><h1 className="title">Create a ticket</h1></div></header><form action={action} className="form">{state.error && <p className="error">{state.error}</p>}<div className="field"><label>What do you need help with?</label><input name="title" placeholder="A concise summary of the issue" required maxLength={160}/></div><div className="field"><label>Describe the issue</label><textarea name="description" placeholder="Include the context, impact, and anything we should know." required /></div><div className="field"><label>Priority</label><select name="priority" defaultValue="MEDIUM"><option value="LOW">Low · 72 business hours</option><option value="MEDIUM">Medium · 48 business hours</option><option value="HIGH">High · 24 business hours</option><option value="URGENT">Urgent · 4 business hours</option></select></div><button className="button lime" disabled={pending}>{pending ? "Creating…" : "Create ticket"}</button></form></Shell>;
}
