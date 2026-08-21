"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_KEY } from "../../lib/session";

export async function logout(): Promise<never> {
  (await cookies()).delete(SESSION_KEY);
  redirect("/login");
}
