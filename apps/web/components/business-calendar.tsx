"use client";

import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";

type Holiday = Readonly<{ id: string; name: string; date: string }>;
type CalendarTask = Readonly<{ id: string; reference: number; title: string; status: string; assignee: { name: string } | null; dueAt: string }>;
type Props = Readonly<{ holidays: readonly Holiday[]; tasks: readonly CalendarTask[] }>;

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const localDateKey = (value: Date): string => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const utcDateKey = (value: string): string => value.slice(0, 10);
const businessDateKey = (value: string): string => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const get = (type: "year" | "month" | "day"): string => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

export function BusinessCalendar({ holidays, tasks }: Props) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const holidayByDate = useMemo(() => new Map(holidays.map((holiday) => [utcDateKey(holiday.date), holiday])), [holidays]);
  const tasksByDate = useMemo(() => tasks.reduce<Map<string, CalendarTask[]>>((grouped, task) => {
    const key = businessDateKey(task.dueAt);
    const current = grouped.get(key) ?? [];
    current.push(task);
    grouped.set(key, current);
    return grouped;
  }, new Map()), [tasks]);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const today = localDateKey(new Date());

  return <section className="calendar card">
    <div className="calendar-head">
      <div><div className="eyebrow">SLA schedule</div><h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2></div>
      <div className="calendar-controls"><button type="button" className="icon-button" aria-label="Previous month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={17}/></button><button type="button" className="calendar-today" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button><button type="button" className="icon-button" aria-label="Next month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={17}/></button></div>
    </div>
    <div className="calendar-legend"><span><i className="legend-dot workday"/> Business day</span><span><i className="legend-dot holiday"/> Holiday</span><span><i className="legend-dot weekend"/> Weekend</span></div>
    <div className="month-grid" role="grid" aria-label={`${month.toLocaleDateString(undefined, { month: "long", year: "numeric" })} business calendar`}>
      {weekdayLabels.map((label) => <div className="month-label" role="columnheader" key={label}>{label}</div>)}
      {days.map((date) => {
        const key = localDateKey(date);
        const holiday = holidayByDate.get(key);
        const dayTasks = tasksByDate.get(key) ?? [];
        const outsideMonth = date.getMonth() !== month.getMonth();
        const weekend = date.getDay() === 0 || date.getDay() === 6;
        return <div role="gridcell" key={key} className={`calendar-day${outsideMonth ? " outside" : ""}${weekend ? " weekend" : ""}${holiday ? " holiday-day" : ""}${key === today ? " today" : ""}`}><span>{date.getDate()}</span>{holiday ? <small title={holiday.name}>{holiday.name}</small> : !weekend && !outsideMonth ? <small>Open</small> : null}{dayTasks.slice(0, 2).map((task) => <div className={`calendar-task ${task.status.toLowerCase()}`} title={`#${task.reference} · ${task.title}${task.assignee ? ` · ${task.assignee.name}` : " · Unassigned"}`} key={task.id}><b>#{task.reference}</b><span>{task.assignee?.name ?? "Unassigned"}</span></div>)}{dayTasks.length > 2 ? <small className="task-overflow">+{dayTasks.length - 2} more due</small> : null}</div>;
      })}
    </div>
    <div className="calendar-hours"><Clock3 size={16}/><div><strong>Business hours: Monday to Friday, 09:00 to 18:00</strong><span>Weekends and configured holidays do not consume SLA time. All deadlines use Asia/Kolkata business time.</span></div></div>
  </section>;
}
