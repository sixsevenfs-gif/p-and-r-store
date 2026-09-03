"use client";

import { FormEvent, useState } from "react";

type Props = { mode: "login" | "register"; nextPath: string };

export default function PhoneAuthForm({ mode, nextPath }: Props) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/member", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ phone, name }) });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || "Unable to continue.");
      window.location.assign(nextPath);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to continue."); }
    finally { setBusy(false); }
  }

  return <form className="auth-form" onSubmit={signIn} noValidate>
    <label>Full name<input name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} /></label>
    <label>Mobile number<input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required maxLength={18} /></label>
    <small>Use the same mobile number whenever you return to view your account, saved pieces and orders.</small>
    {message && <p className="auth-error" role="alert">{message}</p>}
    <button className="auth-primary" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "register" ? "Create account" : "Continue"}</button>
  </form>;
}
