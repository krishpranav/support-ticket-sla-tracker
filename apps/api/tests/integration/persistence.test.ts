import { afterAll, beforeAll, expect, test } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { computeTargets } from "../../src/services/sla/sla";
import { DEFAULT_CALENDAR } from "../../src/services/sla/calendar";

const url = process.env.TEST_DATABASE_URL ?? "postgresql://support:support@localhost:5434/support_test?schema=public";
const prisma = new PrismaClient({ datasourceUrl: url });
let reporterId = "";
let agentId = "";

beforeAll(async () => {
  await prisma.$connect();
  const suffix = Date.now().toString();
  const reporter = await prisma.user.create({ data: { name: "Integration Reporter", email: `reporter-${suffix}@example.test`, passwordHash: "not-used", role: "REPORTER" } });
  const agent = await prisma.user.create({ data: { name: "Integration Agent", email: `agent-${suffix}@example.test`, passwordHash: "not-used", role: "AGENT" } });
  reporterId = reporter.id; agentId = agent.id;
});
afterAll(async () => { if (reporterId) await prisma.user.delete({ where: { id: reporterId } }); if (agentId) await prisma.user.delete({ where: { id: agentId } }); await prisma.$disconnect(); });

test("persists a ticket and records only the first non-reporter response", async () => {
  const createdAt = new Date("2026-08-17T03:30:00.000Z");
  const targets = computeTargets(createdAt, "HIGH", DEFAULT_CALENDAR);
  const ticket = await prisma.ticket.create({ data: { title: "Integration ticket", description: "Exercise real PostgreSQL persistence.", priority: "HIGH", reporterId, createdAt, ...targets } });
  await prisma.comment.create({ data: { ticketId: ticket.id, authorId: reporterId, content: "Reporter follow-up" } });
  const afterReporter = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
  expect(afterReporter.firstResponseAt).toBeNull();
  const responseAt = new Date("2026-08-17T04:00:00.000Z");
  await prisma.$transaction(async (tx) => { await tx.comment.create({ data: { ticketId: ticket.id, authorId: agentId, content: "Agent response" } }); await tx.ticket.update({ where: { id: ticket.id }, data: { firstResponseAt: responseAt, firstResponseSlaMet: responseAt <= ticket.firstResponseDueAt } }); });
  const afterAgent = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
  expect(afterAgent.firstResponseAt?.toISOString()).toBe(responseAt.toISOString());
  expect(afterAgent.firstResponseSlaMet).toBeTrue();
  expect(afterAgent.firstResponseDueAt.toISOString()).toBe(targets.firstResponseDueAt.toISOString());
  await prisma.ticket.delete({ where: { id: ticket.id } });
});
