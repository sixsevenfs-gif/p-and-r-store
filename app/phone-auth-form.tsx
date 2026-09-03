"use client";

import { FormEvent, useState } from "react";

type Props = { mode: "login" | "register"; nextPath: string };

export default function PhoneAuthForm({ mode, nextPath }: Props) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/phone/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, name, intent: mode }) });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || "Unable to send OTP.");
      setStep("otp"); setMessage("OTP sent to your mobile number.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send OTP."); }
    finally { setBusy(false); }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/phone/verify", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ phone, token: otp }) });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || "Unable to verify OTP.");
      window.location.assign(nextPath);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to verify OTP."); }
    finally { setBusy(false); }
  }

  if (step === "otp") return <form className="auth-form" onSubmit={verifyOtp} noValidate>
    <label>One-time password<input name="otp" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter OTP" required /></label>
    <small>We sent a verification code to your mobile number. It expires shortly.</small>
    {message && <p className="auth-error" role="alert">{message}</p>}
    <button className="auth-primary" disabled={busy} type="submit">{busy ? "Verifying…" : "Verify & continue"}</button>
    <button className="auth-link-button" type="button" disabled={busy} onClick={() => { setStep("details"); setOtp(""); setMessage(""); }}>Use another number</button>
  </form>;

  return <form className="auth-form" onSubmit={requestOtp} noValidate>
    {mode === "register" && <label>Full name<input name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} /></label>}
    <label>Mobile number<input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required maxLength={18} /></label>
    <small>We’ll send a one-time password by SMS. No account password is needed.</small>
    {message && <p className="auth-error" role="alert">{message}</p>}
    <button className="auth-primary" disabled={busy} type="submit">{busy ? "Sending OTP…" : "Send OTP"}</button>
  </form>;
}
