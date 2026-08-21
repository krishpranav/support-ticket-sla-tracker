"use client";

import { useState, type FormEvent } from "react";

type Holiday = Readonly<{ id: string; name: string; date: string }>;
type Props = Readonly<{ initialHolidays: readonly Holiday[] }>;
const request = async <T,>(query: string, variables: Record<string, unknown>): Promise<T> => {
  const response = await fetch("/api/graphql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables }) });
  const payload = await response.json() as { data?: T; errors?: readonly { message: string }[] };
  const error = payload.errors?.[0];
  if (error) throw new Error(error.message);
  if (!payload.data) throw new Error("No response data");
  return payload.data;
};
export function HolidayManager({ initialHolidays }: Props) {
  const [holidays, setHolidays] = useState<readonly Holiday[]>(initialHolidays);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const create = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const name = form.get("name"); const date = form.get("date");
    if (typeof name !== "string" || typeof date !== "string") return;
    setBusy(true); setMessage(null);
    try { const data = await request<{ createHoliday: Holiday }>("mutation($date:DateTime!,$name:String!){createHoliday(date:$date,name:$name){id name date}}", { name, date: new Date(`${date}T00:00:00.000Z`).toISOString() }); setHolidays((current) => [...current, data.createHoliday].sort((a, b) => a.date.localeCompare(b.date))); event.currentTarget.reset(); setMessage("Holiday added. Open SLA targets have been recalculated."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add the holiday."); }
    finally { setBusy(false); }
  };
  const remove = async (holiday: Holiday): Promise<void> => {
    setBusy(true); setMessage(null);
    try { await request<{ deleteHoliday: boolean }>("mutation($id:ID!){deleteHoliday(id:$id)}", { id: holiday.id }); setHolidays((current) => current.filter((item) => item.id !== holiday.id)); setMessage("Holiday removed. Open SLA targets have been recalculated."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to remove the holiday."); }
    finally { setBusy(false); }
  };
  return <><section className="card calendar-form"><h2>Add a non-working day</h2><p className="muted">Open tickets automatically receive recalculated SLA deadlines.</p>{message && <p className={message.startsWith("Holiday") ? "notice" : "error"}>{message}</p>}<form onSubmit={(event) => void create(event)} className="calendar-fields"><div className="field"><label htmlFor="holiday-date">Date</label><input id="holiday-date" name="date" type="date" required disabled={busy}/></div><div className="field"><label htmlFor="holiday-name">Name</label><input id="holiday-name" name="name" placeholder="Independence Day" required disabled={busy}/></div><button className="button lime" disabled={busy}>{busy ? "Saving…" : "Add holiday"}</button></form></section><section className="panel"><div className="panel-head"><h2>Configured non-working days</h2><span>{holidays.length} dates</span></div>{holidays.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Name</th><th aria-label="Actions"/></tr></thead><tbody>{holidays.map((holiday) => <tr key={holiday.id}><td className="mono">{new Date(holiday.date).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" })}</td><td className="ticket-title">{holiday.name}</td><td className="table-action"><button className="text-button danger" disabled={busy} onClick={() => void remove(holiday)}>Remove</button></td></tr>)}</tbody></table></div> : <div className="empty">No holiday dates are configured.</div>}</section></>;
}
