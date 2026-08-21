import { prisma } from "./db/client";

const SAMPLE_COUNT = 20;
const MAX_P95_MILLISECONDS = 25;

const elapsedMilliseconds = async (): Promise<number> => {
  const startedAt = performance.now();
  await prisma.ticket.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 20,
    select: { id: true, createdAt: true, priority: true, status: true, firstResponseDueAt: true, resolutionDueAt: true },
  });
  return performance.now() - startedAt;
};

try {
  await prisma.$connect();
  const samples: number[] = [];
  for (let index = 0; index < SAMPLE_COUNT; index += 1) samples.push(await elapsedMilliseconds());
  const sorted = [...samples].sort((left, right) => left - right);
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
  if (p95 === undefined) throw new Error("Benchmark collected no samples");
  console.log(`Ticket list p95: ${p95.toFixed(2)} ms across ${SAMPLE_COUNT} samples`);
  if (p95 > MAX_P95_MILLISECONDS) throw new Error(`Ticket list p95 exceeded ${MAX_P95_MILLISECONDS} ms`);
} finally {
  await prisma.$disconnect();
}
