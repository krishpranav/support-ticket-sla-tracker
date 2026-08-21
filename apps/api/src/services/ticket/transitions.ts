import type { TicketStatus } from "@prisma/client";
import { fail } from "../../errors/app-error";
export const TRANSITIONS: Readonly<Record<TicketStatus, readonly TicketStatus[]>> = { OPEN: ["IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED"], IN_PROGRESS: ["WAITING_ON_CUSTOMER", "RESOLVED", "OPEN"], WAITING_ON_CUSTOMER: ["IN_PROGRESS", "RESOLVED"], RESOLVED: ["CLOSED", "OPEN"], CLOSED: ["OPEN"] };
export const assertTransition = (from: TicketStatus, to: TicketStatus): void => { if (!TRANSITIONS[from].includes(to)) fail(`Ticket cannot transition from ${from} to ${to}`, "INVALID_STATUS_TRANSITION"); };
