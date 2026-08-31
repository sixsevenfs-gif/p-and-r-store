import { readFileSync } from "node:fs";

const baseUrl = (process.env.AUTH_BOOTSTRAP_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.ADMIN_BOOTSTRAP_TOKEN || "";
const password = readFileSync(0, "utf8").trim();

if (token.length < 24) throw new Error("Set ADMIN_BOOTSTRAP_TOKEN to a random value of at least 24 characters before running this command.");
if (password.length < 12 || password.length > 128) throw new Error("Provide a 12–128 character password through standard input.");

const response = await fetch(`${baseUrl}/api/auth/bootstrap-admin`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-admin-bootstrap-token": token, origin: baseUrl },
  body: JSON.stringify({ password }),
});
const payload = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Administrator bootstrap failed.");
console.log("Administrator account created. Sign in at /admin/login.");
