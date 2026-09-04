"use client";

import { FormEvent, useState } from "react";

export default function AdminAuthForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/admin", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ name, phone }) });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || "Unable to sign in.");
      window.location.assign("/admin/dashboard");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }

  return <form className="auth-form" onSubmit={submit} noValidate>
    <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} /></label>
    <label>Admin mobile number<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required maxLength={18} /></label>
    <small>Only the mobile number configured by the store owner can open this panel.</small>
    {message && <p className="auth-error" role="alert">{message}</p>}
    <button className="auth-primary" disabled={busy} type="submit">{busy ? "Please wait…" : "Open admin panel"}</button>
  </form>;
}
