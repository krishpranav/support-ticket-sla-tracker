"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "../../lib/api";
import { SESSION_KEY } from "../../lib/session";

export type RegisterState = Readonly<{ error?: string }>;
export async function register(_: RegisterState, form: FormData): Promise<RegisterState> {
  try {
    const data = await api<{ register: { token: string } }>("mutation($name:String!,$email:String!,$password:String!,$role:UserRole!){register(name:$name,email:$email,password:$password,role:$role){token}}", { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), password: String(form.get("password") ?? ""), role: "REPORTER" });
    (await cookies()).set(SESSION_KEY, data.register.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to create account" }; }
  redirect("/dashboard");
}
