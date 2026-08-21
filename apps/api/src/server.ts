import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import type { Prisma, Priority, Ticket, TicketStatus, User, UserRole } from "@prisma/client";
import { prisma } from "./db/client";
import { env } from "./config/env";
import { fail, toGraphqlError } from "./errors/app-error";
import { DEFAULT_CALENDAR, type IsoDate } from "./services/sla/calendar";
import { computeTargets, evaluate, type SlaState } from "./services/sla/sla";
import { businessMinutesBetween } from "./services/sla/business-hours";
import { assertTransition } from "./services/ticket/transitions";

type Actor = Pick<User, "id" | "role" | "name" | "email">;
type Context = { actor: Actor | null };
const secret = new TextEncoder().encode(env.JWT_SECRET);
const iso = (value: Date | string): string => typeof value === "string" ? value : value.toISOString();
const asPriority = (value: string): Priority => value as Priority;
const asStatus = (value: string): TicketStatus => value as TicketStatus;
const holidays = async () => { const rows = await prisma.holiday.findMany(); return { ...DEFAULT_CALENDAR, timeZone: env.BUSINESS_TIMEZONE, holidays: new Set(rows.map((row) => row.date.toISOString().slice(0, 10) as IsoDate)) }; };
const recomputeActiveTicketTargets = async (db: Prisma.TransactionClient = prisma): Promise<void> => {
  const holidayRows = await db.holiday.findMany();
  const calendar = { ...DEFAULT_CALENDAR, timeZone: env.BUSINESS_TIMEZONE, holidays: new Set(holidayRows.map((row) => row.date.toISOString().slice(0, 10) as IsoDate)) };
  const tickets = await db.ticket.findMany({ where: { resolvedAt: null }, select: { id: true, createdAt: true, priority: true, slaPausedMinutes: true } });
  await Promise.all(tickets.map((ticket) => db.ticket.update({ where: { id: ticket.id }, data: computeTargets(ticket.createdAt, ticket.priority, calendar, ticket.slaPausedMinutes) })));
};
const requireActor = (actor: Actor | null): Actor => actor ?? fail("Please sign in to continue", "UNAUTHORIZED");
const requireAgent = (actor: Actor | null): Actor => { const user = requireActor(actor); return user.role === "AGENT" ? user : fail("This action requires an agent account", "FORBIDDEN"); };
const ticketOrFail = async (id: string): Promise<Ticket> => (await prisma.ticket.findUnique({ where: { id } })) ?? fail("Ticket not found", "TICKET_NOT_FOUND");
const viewTicket = async (id: string, actor: Actor | null): Promise<Ticket> => { const ticket = await ticketOrFail(id); const user = requireActor(actor); if (user.role !== "AGENT" && ticket.reporterId !== user.id) fail("You do not have access to this ticket", "FORBIDDEN"); return ticket; };
const tokenFor = async (user: Actor): Promise<string> => new SignJWT({ role: user.role, name: user.name }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("8h").sign(secret);
const serialiseTicket = (ticket: Ticket) => ({ ...ticket, createdAt: iso(ticket.createdAt), firstResponseAt: ticket.firstResponseAt ? iso(ticket.firstResponseAt) : null, resolvedAt: ticket.resolvedAt ? iso(ticket.resolvedAt) : null });
const cursorOf = (ticket: Ticket): string => Buffer.from(`${ticket.createdAt.toISOString()}|${ticket.id}`).toString("base64url");
const parseCursor = (cursor: string): { createdAt: Date; id: string } => { const [rawDate, rawId] = Buffer.from(cursor, "base64url").toString().split("|"); const date = rawDate ?? fail("Invalid cursor", "VALIDATION_ERROR"); const id = rawId ?? fail("Invalid cursor", "VALIDATION_ERROR"); if (Number.isNaN(Date.parse(date))) fail("Invalid cursor", "VALIDATION_ERROR"); return { createdAt: new Date(date), id }; };
const slaStateWhere = (slaState: SlaState, now: Date): Prisma.TicketWhereInput => {
  const clock = (prefix: "firstResponse" | "resolution"): Prisma.TicketWhereInput => {
    const eventAt = prefix === "firstResponse" ? "firstResponseAt" : "resolvedAt";
    const met = prefix === "firstResponse" ? "firstResponseSlaMet" : "resolutionSlaMet";
    const dueAt = prefix === "firstResponse" ? "firstResponseDueAt" : "resolutionDueAt";
    const atRiskAt = prefix === "firstResponse" ? "firstResponseAtRiskAt" : "resolutionAtRiskAt";
    switch (slaState) {
      case "ON_TRACK": return { [eventAt]: null, slaPausedAt: null, [atRiskAt]: { gte: now } };
      case "AT_RISK": return { [eventAt]: null, slaPausedAt: null, [atRiskAt]: { lt: now }, [dueAt]: { gt: now } };
      case "BREACHED": return { OR: [{ [met]: false }, { [eventAt]: null, slaPausedAt: null, [dueAt]: { lte: now } }] };
      case "MET": return { [met]: true };
      case "PAUSED": return { [eventAt]: null, slaPausedAt: { not: null } };
    }
  };
  return { OR: [clock("firstResponse"), clock("resolution")] };
};
const resolver = {
  DateTime: { serialize: (value: Date): string => iso(value) },
  Ticket: { reporter: (ticket: Ticket) => prisma.user.findUniqueOrThrow({ where: { id: ticket.reporterId } }), assignee: (ticket: Ticket) => ticket.assigneeId ? prisma.user.findUnique({ where: { id: ticket.assigneeId } }) : null, comments: (ticket: Ticket) => prisma.comment.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" }, include: { author: true } }), events: (ticket: Ticket) => prisma.ticketEvent.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "desc" }, include: { actor: true } }), sla: async (ticket: Ticket) => evaluate(ticket, new Date(), await holidays()) },
  Query: {
    me: (_: unknown, __: unknown, context: Context) => context.actor,
    users: (_: unknown, args: { role?: UserRole }, context: Context) => { requireActor(context.actor); return prisma.user.findMany({ where: args.role ? { role: args.role } : {}, orderBy: { name: "asc" } }); },
    holidays: (_: unknown, __: unknown, context: Context) => { requireActor(context.actor); return prisma.holiday.findMany({ orderBy: { date: "asc" } }); },
    ticket: async (_: unknown, args: { id: string }, context: Context) => serialiseTicket(await viewTicket(args.id, context.actor)),
    tickets: async (_: unknown, args: { status?: string; priority?: string; assigneeId?: string; slaState?: SlaState; sort?: "NEWEST" | "OLDEST"; take?: number; cursor?: string }, context: Context) => { const actor = requireActor(context.actor); const take = Math.min(Math.max(args.take ?? 20, 1), 100); const now = new Date(); const ascending = args.sort === "OLDEST"; const filters: Prisma.TicketWhereInput = { ...(actor.role === "REPORTER" ? { reporterId: actor.id } : {}), ...(args.status ? { status: asStatus(args.status) } : {}), ...(args.priority ? { priority: asPriority(args.priority) } : {}), ...(args.assigneeId ? { assigneeId: args.assigneeId } : {}), ...(args.slaState ? { AND: [slaStateWhere(args.slaState, now)] } : {}) }; const cursor = args.cursor ? parseCursor(args.cursor) : null; const where: Prisma.TicketWhereInput = cursor ? { AND: [filters, { OR: ascending ? [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: cursor.id } }] : [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }] } : filters; const direction: Prisma.SortOrder = ascending ? "asc" : "desc"; const [rows, totalCount] = await prisma.$transaction([prisma.ticket.findMany({ where, orderBy: [{ createdAt: direction }, { id: direction }], take: take + 1 }), prisma.ticket.count({ where: filters })]); const hasNextPage = rows.length > take; const nodes = rows.slice(0, take); return { edges: nodes.map((node) => ({ cursor: cursorOf(node), node: serialiseTicket(node) })), pageInfo: { hasNextPage, endCursor: nodes.length ? cursorOf(nodes[nodes.length - 1] as Ticket) : null }, totalCount }; },
    dashboard: async (_: unknown, __: unknown, context: Context) => { const actor = requireActor(context.actor); const base: Prisma.TicketWhereInput = actor.role === "REPORTER" ? { reporterId: actor.id } : {}; const now = new Date(); const today = new Date(now); today.setHours(0, 0, 0, 0); const [open, inProgress, waiting, atRisk, breached, resolvedToday] = await prisma.$transaction([prisma.ticket.count({ where: { AND: [base, { status: "OPEN" }] } }), prisma.ticket.count({ where: { AND: [base, { status: "IN_PROGRESS" }] } }), prisma.ticket.count({ where: { AND: [base, { status: "WAITING_ON_CUSTOMER" }] } }), prisma.ticket.count({ where: { AND: [base, slaStateWhere("AT_RISK", now)] } }), prisma.ticket.count({ where: { AND: [base, slaStateWhere("BREACHED", now)] } }), prisma.ticket.count({ where: { AND: [base, { resolvedAt: { gte: today, lte: now } }] } })]); return { open, inProgress, waiting, atRisk, breached, resolvedToday }; }
  },
  Mutation: {
    register: async (_: unknown, args: { name: string; email: string; password: string; role: UserRole; inviteCode?: string }) => { const parsed = z.object({ name: z.string().trim().min(2), email: z.string().email(), password: z.string().min(8) }).safeParse(args); const input = parsed.success ? parsed.data : fail("Please correct the highlighted fields", "VALIDATION_ERROR", { form: parsed.error.issues[0]?.message ?? "Invalid input" }); if (args.role === "AGENT" && args.inviteCode !== env.AGENT_INVITE_CODE) fail("A valid agent invite code is required", "FORBIDDEN"); const exists = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } }); if (exists) fail("An account already exists for this email", "VALIDATION_ERROR", { email: "Email is already registered" }); const user = await prisma.user.create({ data: { name: input.name, email: input.email.toLowerCase(), passwordHash: await Bun.password.hash(input.password, { algorithm: "argon2id" }), role: args.role } }); return { token: await tokenFor(user), user }; },
    login: async (_: unknown, args: { email: string; password: string }) => { const found = await prisma.user.findUnique({ where: { email: args.email.toLowerCase() } }); const user = found ?? fail("Email or password is incorrect", "UNAUTHORIZED"); if (!(await Bun.password.verify(args.password, user.passwordHash))) fail("Email or password is incorrect", "UNAUTHORIZED"); return { token: await tokenFor(user), user }; },
    createTicket: async (_: unknown, args: { title: string; description: string; priority: string }, context: Context) => { const actor = requireActor(context.actor); const parsed = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(10000), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]) }).safeParse(args); const input = parsed.success ? parsed.data : fail("Please correct the highlighted fields", "VALIDATION_ERROR"); const targets = computeTargets(new Date(), input.priority, await holidays()); const ticket = await prisma.ticket.create({ data: { ...input, reporterId: actor.id, ...targets, events: { create: { type: "CREATED", actorId: actor.id } } } }); return serialiseTicket(ticket); },
    assignTicket: async (_: unknown, args: { ticketId: string; assigneeId: string }, context: Context) => { const actor = requireAgent(context.actor); await ticketOrFail(args.ticketId); const found = await prisma.user.findUnique({ where: { id: args.assigneeId } }); const assignee = found?.role === "AGENT" ? found : fail("Assignee not found", "USER_NOT_FOUND"); return serialiseTicket(await prisma.ticket.update({ where: { id: args.ticketId }, data: { assigneeId: assignee.id, events: { create: { type: "ASSIGNED", actorId: actor.id } } } })); },
    changeTicketStatus: async (_: unknown, args: { ticketId: string; status: string }, context: Context) => {
      const actor = requireAgent(context.actor);
      const ticket = await ticketOrFail(args.ticketId);
      const status = asStatus(args.status);
      assertTransition(ticket.status, status);

      const now = new Date();
      const calendar = await holidays();
      const wasWaiting = ticket.status === "WAITING_ON_CUSTOMER";
      const isWaiting = status === "WAITING_ON_CUSTOMER";
      const isReopen = ticket.status === "RESOLVED" && status === "OPEN";
      const pauseStartedAt = wasWaiting ? ticket.slaPausedAt : isReopen ? ticket.resolvedAt : null;
      const resumedMinutes = pauseStartedAt ? ticket.slaPausedMinutes + businessMinutesBetween(pauseStartedAt, now, calendar) : ticket.slaPausedMinutes;
      const targets = (wasWaiting && !isWaiting) || isReopen ? computeTargets(ticket.createdAt, ticket.priority, calendar, resumedMinutes) : undefined;
      const pause = isWaiting ? { slaPausedAt: now } : wasWaiting ? { slaPausedAt: null, slaPausedMinutes: resumedMinutes, ...(targets ?? {}) } : {};
      const resolved = status === "RESOLVED" ? { resolvedAt: now, resolutionSlaMet: now <= (targets?.resolutionDueAt ?? ticket.resolutionDueAt) } : isReopen ? { resolvedAt: null, resolutionSlaMet: null, slaPausedMinutes: resumedMinutes, ...(targets ?? {}) } : {};
      const eventType = isWaiting ? "PAUSED" : wasWaiting && !isWaiting ? "RESUMED" : isReopen ? "REOPENED" : status === "RESOLVED" ? "RESOLVED" : "STATUS_CHANGED";

      return serialiseTicket(await prisma.ticket.update({ where: { id: ticket.id }, data: { status, ...pause, ...resolved, events: { create: { type: eventType, actorId: actor.id } } } }));
    },
    resolveTicket: async (_: unknown, args: { ticketId: string }, context: Context) => {
      const actor = requireAgent(context.actor);
      const ticket = await ticketOrFail(args.ticketId);
      assertTransition(ticket.status, "RESOLVED");
      const now = new Date();
      const calendar = await holidays();
      const resumedMinutes = ticket.status === "WAITING_ON_CUSTOMER" && ticket.slaPausedAt ? ticket.slaPausedMinutes + businessMinutesBetween(ticket.slaPausedAt, now, calendar) : ticket.slaPausedMinutes;
      const targets = ticket.status === "WAITING_ON_CUSTOMER" ? computeTargets(ticket.createdAt, ticket.priority, calendar, resumedMinutes) : null;
      const resolutionDueAt = targets?.resolutionDueAt ?? ticket.resolutionDueAt;
      return serialiseTicket(await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "RESOLVED", resolvedAt: now, resolutionSlaMet: now <= resolutionDueAt, ...(targets ? { slaPausedAt: null, slaPausedMinutes: resumedMinutes, ...targets } : {}), events: { create: { type: "RESOLVED", actorId: actor.id } } } }));
    },
    addComment: async (_: unknown, args: { ticketId: string; content: string }, context: Context) => { const actor = requireActor(context.actor); const ticket = await viewTicket(args.ticketId, actor); const parsed = z.string().trim().min(1).max(5000).safeParse(args.content); const content = parsed.success ? parsed.data : fail("Comment cannot be empty", "VALIDATION_ERROR", { content: "Enter a comment" }); const now = new Date(); return prisma.$transaction(async (tx) => { const comment = await tx.comment.create({ data: { ticketId: ticket.id, authorId: actor.id, content } }); if (actor.id !== ticket.reporterId && !ticket.firstResponseAt) await tx.ticket.update({ where: { id: ticket.id }, data: { firstResponseAt: now, firstResponseSlaMet: now <= ticket.firstResponseDueAt } }); await tx.ticketEvent.create({ data: { ticketId: ticket.id, actorId: actor.id, type: "COMMENTED" } }); return { ...comment, createdAt: iso(comment.createdAt), author: actor }; }); },
    createHoliday: async (_: unknown, args: { date: Date; name: string }, context: Context) => {
      requireAgent(context.actor);
      const parsed = z.object({ date: z.coerce.date(), name: z.string().trim().min(2).max(80) }).safeParse(args);
      const input = parsed.success ? parsed.data : fail("Please correct the highlighted fields", "VALIDATION_ERROR");
      const existing = await prisma.holiday.findFirst({ where: { date: input.date } });
      if (existing) fail("This date is already configured as a holiday", "VALIDATION_ERROR", { date: "Holiday already exists for this date" });
      return prisma.$transaction(async (tx) => {
        const holiday = await tx.holiday.create({ data: { date: input.date, name: input.name } });
        await recomputeActiveTicketTargets(tx);
        return holiday;
      });
    }, deleteHoliday: async (_: unknown, args: { id: string }, context: Context) => {
      requireAgent(context.actor);
      await prisma.$transaction(async (tx) => {
        await tx.holiday.delete({ where: { id: args.id } });
        await recomputeActiveTicketTargets(tx);
      });
      return true;
    }
  }
};
const schema = createSchema({ typeDefs: readFileSync(new URL("./graphql/schema/schema.graphql", import.meta.url), "utf8"), resolvers: resolver });
const yoga = createYoga<Context>({ schema, graphqlEndpoint: "/graphql", context: async ({ request }) => { const header = request.headers.get("authorization"); if (!header?.startsWith("Bearer ")) return { actor: null }; try { const verified = await jwtVerify(header.slice(7), secret); const id = verified.payload.sub; if (!id) return { actor: null }; const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, name: true, email: true } }); return { actor: user }; } catch { return { actor: null }; } }, maskedErrors: { maskError: toGraphqlError } });
console.log(`Support API listening on http://localhost:${env.API_PORT}/graphql`);
Bun.serve({ port: env.API_PORT, fetch: (request) => yoga.fetch(request) });
