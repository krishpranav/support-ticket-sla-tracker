export type PriorityValue = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SlaPolicy = Readonly<{ firstResponseMinutes: number; resolutionMinutes: number }>;
export const SLA_POLICIES: Readonly<Record<PriorityValue, SlaPolicy>> = {
  URGENT: { firstResponseMinutes: 60, resolutionMinutes: 240 }, HIGH: { firstResponseMinutes: 240, resolutionMinutes: 1440 }, MEDIUM: { firstResponseMinutes: 480, resolutionMinutes: 2880 }, LOW: { firstResponseMinutes: 1440, resolutionMinutes: 4320 }
};
