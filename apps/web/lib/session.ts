import { cookies } from "next/headers";
export const SESSION_KEY = "support_session";
export const getToken = async (): Promise<string | undefined> => (await cookies()).get(SESSION_KEY)?.value;
