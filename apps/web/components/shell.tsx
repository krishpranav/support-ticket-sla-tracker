import Link from "next/link";
import { ClipboardList, LayoutDashboard, Plus, CalendarDays } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SessionMenu } from "./session-menu";
export function Shell({ children }: Readonly<{ children: React.ReactNode }>) { return <div className="shell"><aside className="side"><Link href="/dashboard" className="brand" aria-label="Relay home"><span className="mark">R</span><b>relay</b></Link><nav className="nav"><Link href="/dashboard"><LayoutDashboard size={16}/><span> Overview</span></Link><Link href="/tickets"><ClipboardList size={16}/><span> Tickets</span></Link><Link href="/tickets/new"><Plus size={16}/><span> New request</span></Link><Link href="/holidays"><CalendarDays size={16}/><span> Calendar</span></Link></nav><div className="profile"><SessionMenu/><ThemeToggle/></div></aside><main className="main">{children}</main></div>; }
