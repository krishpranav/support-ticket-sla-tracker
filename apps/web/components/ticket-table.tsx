import { TicketRows, type TicketRow } from "./ticket-rows";

export { type TicketRow } from "./ticket-rows";

export function TicketTable({ tickets }: Readonly<{ tickets: TicketRow[] }>) {
  if (!tickets.length) return <div className="empty">No tickets match this view.</div>;
  return <div className="table-wrap"><table className="table"><thead><tr><th>Ticket</th><th>Status</th><th>Priority</th><th>Assignee</th><th>SLA</th><th>Created</th></tr></thead><TicketRows tickets={tickets}/></table></div>;
}
