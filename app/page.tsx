"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { login } from "@/lib/api";
import { getStoredSession, isSessionExpired, setStoredSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = getStoredSession();

    if (session && !isSessionExpired(session)) {
      startTransition(() => router.replace("/dashboard"));
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const session = await login({ username, password });
      setStoredSession(session);
      startTransition(() => router.replace("/dashboard"));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-shell login-shell-compact">
      <section className="login-panel form-panel">
        <div className="login-brand">
          <BrandLogo href="/" subtitle="Field-ready ERP for coconut lease, harvest, transport, and sales" />
        </div>

        <div className="login-header">
          <p className="eyebrow">Business workspace</p>
          <h1>Sign in to continue</h1>
          {/* <p>
            Use the same secure access for web operations today and Flutter mobile workflows later.
          </p> */}
        </div>

        <form className="data-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Open dashboard"}
          </button>
        </form>
      </section>
      <footer className="workspace-footer" style={{ width: "100%", marginTop: "1.5rem" }}>
        <p>
          This Software is Developed and Managed by{" "}
          <a href="https://github.com/Pavithran26" target="_blank" rel="noopener noreferrer">
            Pavithran S
          </a>
        </p>
      </footer>
    </main>
  );
}
