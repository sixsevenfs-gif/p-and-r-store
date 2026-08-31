"use client";

import { FormEvent, useState } from "react";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath: string;
  admin?: boolean;
};

export default function AuthForm({ mode, nextPath, admin = false }: AuthFormProps) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const body = mode === "register"
      ? { name: String(data.get("name") || "").trim(), email: String(data.get("email") || "").trim(), password: String(data.get("password") || ""), callbackURL: nextPath }
      : { email: String(data.get("email") || "").trim(), password: String(data.get("password") || ""), rememberMe: true, callbackURL: nextPath };
    const endpoint = mode === "register" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({})) as { message?: string; requiresEmailConfirmation?: boolean };
      if (!response.ok) throw new Error(result.message || "Unable to continue. Check your details and try again.");
      if (result.requiresEmailConfirmation) {
        setError("Account created. Check your email to confirm it, then sign in.");
        return;
      }
      window.location.assign(nextPath);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to continue.");
    } finally { setBusy(false); }
  }

  return <form className="auth-form" onSubmit={submit} noValidate>
    {mode === "register" && <label>Full name<input name="name" autoComplete="name" required maxLength={120} /></label>}
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
    <label>Password<input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={12} maxLength={128} required /></label>
    <small>Use at least 12 characters. Your password is securely hashed and never stored in plain text.</small>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="auth-primary" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "register" ? "Create account" : admin ? "Sign in to admin" : "Sign in"}</button>
  </form>;
}
