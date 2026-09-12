"use client";

import { FormEvent, useState } from "react";

type Props = { mode: "login" | "register"; nextPath: string };

export default function PhoneAuthForm({ mode, nextPath }: Props) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/member", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", signal: AbortSignal.timeout(20000), body: JSON.stringify({ phone, name, email }) });
      const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.message || body.error || `Unable to continue (HTTP ${response.status}).`);
      window.location.assign(nextPath);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to continue."); }
    finally { setBusy(false); }
  }

  return <form className="auth-form" onSubmit={signIn} noValidate>
    <label>Full name<input name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} /></label>
    <label>Mobile number<input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required maxLength={18} /></label>
    <label>Email address <small>Optional</small><input name="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} /></label>
    <small>Use the same mobile number whenever you return to view your account, saved pieces and orders.</small>
    {message && <p className="auth-error" role="alert">{message}</p>}
    <button className="auth-primary" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</button>
  </form>;
}
