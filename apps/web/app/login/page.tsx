"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "./actions";
const initial: FormState = {};
export default function LoginPage() { const [state, action, pending] = useActionState(login, initial); return <main className="auth"><form action={action} className="auth-card"><div className="brand" style={{ color: "#15211c", padding: 0 }}><span className="mark">R</span><b>relay</b></div><h1>Welcome back</h1><p className="muted">Sign in to manage your support queue.</p>{state.error && <p className="error">{state.error}</p>}<div className="field"><label>Email</label><input name="email" type="email" placeholder="agent@relay.dev" required /></div><div className="field"><label>Password</label><input name="password" type="password" placeholder="••••••••" required /></div><button className="button lime" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button><p className="muted">New here? <Link href="/register" style={{ color: "#376a48", fontWeight: 700 }}>Create an account</Link></p></form></main>; }
