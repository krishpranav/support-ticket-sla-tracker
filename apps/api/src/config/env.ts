import { z } from "zod";
const schema = z.object({ DATABASE_URL: z.string().url(), JWT_SECRET: z.string().min(32), BUSINESS_TIMEZONE: z.string().default("Asia/Kolkata"), AGENT_INVITE_CODE: z.string().min(4).default("burdenoff-agent"), API_PORT: z.coerce.number().int().positive().default(4000) });
export const env = schema.parse(process.env);
