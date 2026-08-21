"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "../../lib/api";
import { SESSION_KEY } from "../../lib/session";
export type FormState = { error?: string };
export async function login(_: FormState, form: FormData): Promise<FormState> { try { const data = await api<{ login: { token: string } }>("mutation($email:String!,$password:String!){login(email:$email,password:$password){token}}", { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") }); (await cookies()).set(SESSION_KEY, data.login.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" }); } catch (error) { return { error: error instanceof Error ? error.message : "Unable to sign in" }; } redirect("/dashboard"); }
