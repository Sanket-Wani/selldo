"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface GlobalNavProps {
  tenantName?: string;
  userName?: string;
}

export const GlobalNav: React.FC<GlobalNavProps> = ({
  tenantName = "Sell.do Enterprise",
  userName = "User",
}) => {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Leads 360", href: "/leads" },
    { label: "Communications", href: "/communications" },
    { label: "Inventory", href: "/inventory" },
    { label: "Bookings", href: "/bookings" },
    { label: "Marketing", href: "/marketing" },
    { label: "Reports", href: "/reports" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <nav className="global-nav" aria-label="Global Navigation">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", flex: 1 }}>
        <Link
          href="/dashboard"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--color-body-on-dark)",
            letterSpacing: "-0.2px",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ color: "var(--color-primary-on-dark)" }}>●</span>
          Sell.do
        </Link>

        <span
          style={{
            height: "14px",
            width: "1px",
            backgroundColor: "var(--color-surface-tile-2)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "active" : ""}
                style={{
                  color: isActive ? "var(--color-body-on-dark)" : "var(--color-body-muted)",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
        <span
          className="type-nav-link"
          style={{ color: "var(--color-primary-on-dark)", opacity: 0.9 }}
        >
          {tenantName}
        </span>
        <span
          className="type-nav-link"
          style={{ color: "var(--color-body-muted)" }}
        >
          {userName}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-body-muted)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "var(--type-nav-link-size)",
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};
