"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("admin@prestige.sell.do");
  const [password, setPassword] = useState("Password@123");
  const [domain, setDomain] = useState("prestige.sell.do");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        domain,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid credentials or account is temporarily locked.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (quickEmail: string, quickDomain: string) => {
    setEmail(quickEmail);
    setPassword("Password@123");
    setDomain(quickDomain);
    setError(null);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "440px",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xl)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            display: "block",
            marginBottom: "var(--space-xs)",
          }}
        >
          Sell.do Real Estate Cloud
        </span>
        <h1
          className="type-display-md"
          style={{ color: "var(--color-ink)", marginBottom: "var(--space-xs)" }}
        >
          Sign in to your portal.
        </h1>
        <p
          className="type-body"
          style={{ color: "var(--color-ink-muted-48)", fontSize: "15px" }}
        >
          Single tenant access with strict Row-Level Security.
        </p>
      </div>

      {/* Login Card */}
      <Card style={{ backgroundColor: "var(--color-canvas)" }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
        >
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-hairline)",
                backgroundColor: "var(--color-surface-pearl)",
                color: "var(--color-ink)",
                fontSize: "var(--type-caption-size)",
              }}
            >
              {error}
            </div>
          )}

          <Input
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.sell.do"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />

          <Input
            label="Tenant Domain (Optional)"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="company.sell.do"
          />

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: "100%", marginTop: "var(--space-xs)" }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        {/* Quick Tenant Switcher for Pairing & Review */}
        <div
          style={{
            marginTop: "var(--space-xl)",
            paddingTop: "var(--space-md)",
            borderTop: "1px solid var(--color-divider-soft)",
          }}
        >
          <span
            className="type-caption-strong"
            style={{
              display: "block",
              color: "var(--color-ink-muted-48)",
              marginBottom: "var(--space-sm)",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Quick Test Credentials
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="button"
              onClick={() => handleQuickFill("admin@prestige.sell.do", "prestige.sell.do")}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                background: "var(--color-surface-pearl)",
                border: "1px solid var(--color-hairline)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--color-ink)" }}>
                Prestige Estates (Admin)
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-ink-muted-48)" }}>
                admin@prestige.sell.do · Role: ADMIN
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("presales@prestige.sell.do", "prestige.sell.do")}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                background: "var(--color-surface-pearl)",
                border: "1px solid var(--color-hairline)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--color-ink)" }}>
                Prestige Estates (Pre-Sales)
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-ink-muted-48)" }}>
                presales@prestige.sell.do · Role: PRE_SALES
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("admin@sobha.sell.do", "sobha.sell.do")}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                background: "var(--color-surface-pearl)",
                border: "1px solid var(--color-hairline)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--color-ink)" }}>
                Sobha Developers (Tenant B Admin)
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-ink-muted-48)" }}>
                admin@sobha.sell.do · Cross-Tenant Boundary
              </div>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-canvas-parchment)",
        padding: "var(--space-lg)",
      }}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
