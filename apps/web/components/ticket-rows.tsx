"use client";

import Link from "next/link";
import { SlaCountdown } from "./sla-countdown";
import { formatTicketState } from "../lib/tickets-query";

export type TicketRow = Readonly<{
  id: string;
  reference: number;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
  assignee: { name: string } | null;
  sla: {
    firstResponseState: string;
    resolutionState: string;
    resolutionRemainingMinutes: number;
    isBusinessHoursOpen: boolean;
  };
}>;

const statusClass = (status: string): string => ({ OPEN: "open", IN_PROGRESS: "progress", WAITING_ON_CUSTOMER: "waiting", RESOLVED: "resolved", CLOSED: "resolved" })[status] ?? "open";
const slaClass = (state: string): string => ({ ON_TRACK: "track", AT_RISK: "risk", BREACHED: "breach", MET: "track", PAUSED: "waiting" })[state] ?? "track";

export function TicketRows({ tickets }: Readonly<{ tickets: readonly TicketRow[] }>) {
  return (
    <tbody>
      {tickets.map((ticket) => (
        <tr key={ticket.id}>
          <td>
            <Link href={`/tickets/${ticket.id}`}>
              <div className="ticket-title">#{ticket.reference} · {ticket.title}</div>
              <div className="sub">{new Date(ticket.createdAt).toLocaleDateString()}</div>
            </Link>
          </td>
          <td><span className={`badge ${statusClass(ticket.status)}`}>{formatTicketState(ticket.status)}</span></td>
          <td><span className="mono">{ticket.priority}</span></td>
          <td>{ticket.assignee?.name ?? <span className="muted">Unassigned</span>}</td>
          <td>
            <span className={`badge ${slaClass(ticket.sla.resolutionState)}`}>{formatTicketState(ticket.sla.resolutionState)}</span>
            <div className="sub">
              <SlaCountdown compact minutes={ticket.sla.resolutionRemainingMinutes} isBusinessHoursOpen={ticket.sla.isBusinessHoursOpen} state={ticket.sla.resolutionState} />
            </div>
          </td>
          <td className="mono">{new Date(ticket.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
        </tr>
      ))}
    </tbody>
  );
}
