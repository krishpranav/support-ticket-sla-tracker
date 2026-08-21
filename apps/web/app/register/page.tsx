"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type RegisterState } from "./actions";

const initial: RegisterState = {};
export default function RegisterPage() { const [state, action, pending] = useActionState(register, initial); return <main className="auth"><form action={action} className="auth-card"><div className="brand" style={{ color: "#15211c", padding: 0 }}><span className="mark">R</span><b>relay</b></div><h1>Create your account</h1><p className="muted">Raise and track support requests in one place.</p>{state.error && <p className="error">{state.error}</p>}<div className="field"><label>Name</label><input name="name" placeholder="Your full name" required /></div><div className="field"><label>Email</label><input name="email" type="email" placeholder="you@example.com" required /></div><div className="field"><label>Password</label><input name="password" type="password" minLength={8} placeholder="At least 8 characters" required /></div><button className="button lime" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>{pending ? "Creating account…" : "Create account"}</button><p className="muted">Already have an account? <Link href="/login" style={{ color: "#376a48", fontWeight: 700 }}>Sign in</Link></p></form></main>; }
