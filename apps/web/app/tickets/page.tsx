import Link from "next/link";
import { Plus } from "lucide-react";
import { Shell } from "../../components/shell";
import { TicketsFeed } from "../../components/tickets-feed";
import { api } from "../../lib/api";
import { getToken } from "../../lib/session";
import { TICKETS_QUERY } from "../../lib/tickets-query";
import type { TicketRow } from "../../components/ticket-rows";

type Search = { status?: string; priority?: string; sla?: string; assignee?: string; sort?: string };
type TicketEdge = Readonly<{ cursor: string; node: TicketRow }>;
type Response = Readonly<{ tickets: { totalCount: number; pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges: TicketEdge[] }; users: { id: string; name: string }[] }>;

const option = (value: string | undefined): string | undefined => value && value !== "ALL" ? value : undefined;

export default async function TicketsPage({ searchParams }: Readonly<{ searchParams: Promise<Search> }>) {
  const search = await searchParams;
  let data: Response | null = null;
  let errorMessage: string | null = null;
  try {
    data = await api<Response>(TICKETS_QUERY, {
      status: option(search.status),
      priority: option(search.priority),
      slaState: option(search.sla),
      assigneeId: option(search.assignee),
      sort: search.sort === "OLDEST" ? "OLDEST" : "NEWEST",
      take: 20,
    }, await getToken());
  } catch (error) {
    data = null;
    errorMessage = error instanceof Error ? error.message : "Unable to load the ticket queue.";
  }

  const filters: { status?: string; priority?: string; sla?: string; assignee?: string; sort?: string } = { sort: search.sort === "OLDEST" ? "OLDEST" : "NEWEST" };
  const status = option(search.status);
  const priority = option(search.priority);
  const sla = option(search.sla);
  const assignee = option(search.assignee);
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (sla) filters.sla = sla;
  if (assignee) filters.assignee = assignee;

  return (
    <Shell>
      <header className="top">
        <div>
          <div className="eyebrow">Support queue</div>
          <h1 className="title">Tickets</h1>
        </div>
        <Link href="/tickets/new" className="button lime"><Plus size={15}/> New ticket</Link>
      </header>

      <form className="filters">
        <select name="status" className="select" defaultValue={search.status ?? "ALL"}>
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="WAITING_ON_CUSTOMER">Waiting</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select name="priority" className="select" defaultValue={search.priority ?? "ALL"}>
          <option value="ALL">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select name="sla" className="select" defaultValue={search.sla ?? "ALL"}>
          <option value="ALL">All SLA states</option>
          <option value="ON_TRACK">On track</option>
          <option value="AT_RISK">At risk</option>
          <option value="BREACHED">Breached</option>
          <option value="PAUSED">Paused</option>
          <option value="MET">Met</option>
        </select>
        <select name="assignee" className="select" defaultValue={search.assignee ?? "ALL"}>
          <option value="ALL">All assignees</option>
          {data?.users.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
        </select>
        <select name="sort" className="select" defaultValue={search.sort ?? "NEWEST"}>
          <option value="NEWEST">Newest first</option>
          <option value="OLDEST">Oldest first</option>
        </select>
        <button className="button ghost" type="submit">Apply filters</button>
      </form>

      {data ? <TicketsFeed initialTickets={data.tickets.edges.map((edge) => edge.node)} totalCount={data.tickets.totalCount} pageInfo={data.tickets.pageInfo} filters={filters}/> : <section className="panel"><div className="empty"><strong>We could not load this queue.</strong><span>{errorMessage ?? "Sign in again and refresh this page."}</span></div></section>}
    </Shell>
  );
}
