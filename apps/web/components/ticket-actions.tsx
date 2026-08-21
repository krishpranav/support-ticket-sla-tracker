"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Agent = Readonly<{ id: string; name: string }>;
type Props = Readonly<{ ticketId: string; status: string; assigneeId: string | null; currentAgentId: string; agents: readonly Agent[] }>;

const allowedStatuses: Record<string, readonly string[]> = {
  OPEN: ["IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED"],
  IN_PROGRESS: ["OPEN", "WAITING_ON_CUSTOMER", "RESOLVED"],
  WAITING_ON_CUSTOMER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["OPEN", "CLOSED"],
  CLOSED: ["OPEN"],
};

const request = async <T,>(query: string, variables: Record<string, unknown>): Promise<T> => {
  const response = await fetch("/api/graphql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables }) });
  const payload = await response.json() as { data?: T; errors?: readonly { message: string }[] };
  const error = payload.errors?.[0];
  if (error) throw new Error(error.message);
  if (!payload.data) throw new Error("No response data");
  return payload.data;
};

const label = (value: string): string => value.replaceAll("_", " ");

export function TicketActions({ ticketId, status, assigneeId, currentAgentId, agents }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mutate = async (query: string, variables: Record<string, unknown>, success: string): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await request(query, variables);
      setMessage(success);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const nextStatuses = allowedStatuses[status] ?? [];
  const canClaim = assigneeId === null && (status === "OPEN" || status === "IN_PROGRESS");
  const claimAndStart = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await request("mutation($ticketId:ID!,$assigneeId:ID!){assignTicket(ticketId:$ticketId,assigneeId:$assigneeId){id}}", { ticketId, assigneeId: currentAgentId });
      if (status === "OPEN") await request("mutation($ticketId:ID!,$status:TicketStatus!){changeTicketStatus(ticketId:$ticketId,status:$status){id}}", { ticketId, status: "IN_PROGRESS" });
      setMessage("Ticket claimed and moved into your active queue.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to claim this ticket");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" style={{ marginTop: 18 }}>
      <h3>Agent actions</h3>
      <p className="muted">Current status: {label(status)}</p>
      {message && <p className="notice">{message}</p>}
      {canClaim ? <button className="button lime claim-button" disabled={busy} onClick={() => void claimAndStart()}>Claim and start work</button> : null}
      <div className="field">
        <label htmlFor="assignee">Assign to</label>
        <select
          id="assignee"
          value={assigneeId ?? ""}
          disabled={busy}
          onChange={(event) => void mutate(
            "mutation($ticketId:ID!,$assigneeId:ID!){assignTicket(ticketId:$ticketId,assigneeId:$assigneeId){id}}",
            { ticketId, assigneeId: event.target.value },
            "Assignee updated",
          )}
        >
          <option value="" disabled>Choose an agent</option>
          {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="status">Move ticket to</label>
        <select
          id="status"
          defaultValue=""
          disabled={busy || nextStatuses.length === 0}
          onChange={(event) => void mutate(
            "mutation($ticketId:ID!,$status:TicketStatus!){changeTicketStatus(ticketId:$ticketId,status:$status){id}}",
            { ticketId, status: event.target.value },
            "Status updated",
          )}
        >
          <option value="" disabled>{nextStatuses.length ? "Choose a new status" : "No available transitions"}</option>
          {nextStatuses.map((nextStatus) => <option key={nextStatus} value={nextStatus}>{label(nextStatus)}</option>)}
        </select>
      </div>
      <button className="button ghost" disabled={busy || status === "RESOLVED" || status === "CLOSED"} onClick={() => void mutate("mutation($ticketId:ID!){resolveTicket(ticketId:$ticketId){id}}", { ticketId }, "Ticket resolved")}>Resolve ticket</button>
    </section>
  );
}
