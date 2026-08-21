import { HolidayManager } from "../../components/holiday-manager";
import { BusinessCalendar } from "../../components/business-calendar";
import { Shell } from "../../components/shell";
import { api } from "../../lib/api";
import { getToken } from "../../lib/session";

type Holiday = { id: string; name: string; date: string };
type CalendarData = { me: { role: string } | null; holidays: Holiday[]; tickets: { edges: { node: { id: string; reference: number; title: string; status: string; assignee: { name: string } | null; sla: { resolutionDueAt: string } } }[] } };

export default async function HolidaysPage() {
  let data: CalendarData | null = null;
  try { data = await api<CalendarData>("query{me{role} holidays{id name date} tickets(take:100){edges{node{id reference title status assignee{name} sla{resolutionDueAt}}}}}", undefined, await getToken()); } catch { }
  const isAgent = data?.me?.role === "AGENT";
  const holidays = data?.holidays ?? [];
  const tasks = data?.tickets.edges.map(({ node }) => ({ id: node.id, reference: node.reference, title: node.title, status: node.status, assignee: node.assignee, dueAt: node.sla.resolutionDueAt })) ?? [];
  return <Shell><header className="top"><div><div className="eyebrow">Business calendar</div><h1 className="title">SLA calendar</h1></div></header><BusinessCalendar holidays={holidays} tasks={tasks}/>{isAgent ? <HolidayManager initialHolidays={holidays}/> : <section className="calendar-note"><strong>Need a calendar update?</strong><span>Support agents manage non-working days. Your ticket deadlines update automatically when the calendar changes.</span></section>}</Shell>;
}
