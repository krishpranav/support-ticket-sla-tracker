"use client";

import { useState } from "react";
import { TicketRows, type TicketRow } from "./ticket-rows";

type PageInfo = Readonly<{ hasNextPage: boolean; endCursor: string | null }>;
type Filters = Readonly<{ status?: string; priority?: string; sla?: string; assignee?: string; sort?: string }>;
type Props = Readonly<{ initialTickets: readonly TicketRow[]; totalCount: number; pageInfo: PageInfo; filters: Filters }>;

const query = `query($status:TicketStatus,$priority:Priority,$slaState:SLAState,$assigneeId:ID,$sort:TicketSort,$cursor:String,$take:Int){ tickets(status:$status,priority:$priority,slaState:$slaState,assigneeId:$assigneeId,sort:$sort,cursor:$cursor,take:$take) { totalCount pageInfo { hasNextPage endCursor } edges { cursor node { id reference title priority status createdAt assignee{name} sla { firstResponseState resolutionState resolutionRemainingMinutes isBusinessHoursOpen } } } } }`;

const load = async (variables: Record<string, unknown>): Promise<{ tickets: { totalCount: number; pageInfo: PageInfo; edges: { cursor: string; node: TicketRow }[] } }> => {
  const response = await fetch("/api/graphql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables }) });
  const payload = await response.json() as { data?: { tickets: { totalCount: number; pageInfo: PageInfo; edges: { cursor: string; node: TicketRow }[] } }; errors?: readonly { message: string }[] };
  const error = payload.errors?.[0];
  if (error) throw new Error(error.message);
  if (!payload.data) throw new Error("No response data");
  return payload.data;
};

export function TicketsFeed({ initialTickets, totalCount, pageInfo, filters }: Props) {
  const [tickets, setTickets] = useState<readonly TicketRow[]>(initialTickets);
  const [cursor, setCursor] = useState<string | null>(pageInfo.endCursor);
  const [hasNextPage, setHasNextPage] = useState(pageInfo.hasNextPage);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadMore = async (): Promise<void> => {
    if (!cursor || loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await load({
        status: filters.status,
        priority: filters.priority,
        slaState: filters.sla,
        assigneeId: filters.assignee,
        sort: filters.sort === "OLDEST" ? "OLDEST" : "NEWEST",
        cursor,
        take: 20,
      });
      setTickets((current) => [...current, ...data.tickets.edges.map((edge) => edge.node)]);
      setCursor(data.tickets.pageInfo.endCursor);
      setHasNextPage(data.tickets.pageInfo.hasNextPage);
      setMessage(data.tickets.edges.length ? `Loaded ${data.tickets.edges.length} more tickets.` : "No further tickets matched these filters.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load more tickets.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>All tickets</h2>
        <span>{tickets.length} of {totalCount} shown</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Ticket</th><th>Status</th><th>Priority</th><th>Assignee</th><th>SLA</th><th>Created</th></tr>
          </thead>
          <TicketRows tickets={tickets} />
        </table>
      </div>
      <div style={{ padding: "18px 21px 22px", borderTop: "1px solid #eef2ef" }}>
        {message && <p className="notice">{message}</p>}
        {hasNextPage ? <button className="button ghost" type="button" onClick={() => void loadMore()} disabled={loading}>{loading ? "Loading…" : "Load more"}</button> : <p className="muted" style={{ margin: 0 }}>You have reached the end of this filtered view.</p>}
      </div>
    </section>
  );
}
