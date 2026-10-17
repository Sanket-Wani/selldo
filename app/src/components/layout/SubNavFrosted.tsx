import React from "react";

interface SubNavFrostedProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const SubNavFrosted: React.FC<SubNavFrostedProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <header className="sub-nav-frosted" aria-label="Module Subnavigation">
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-sm)" }}>
        <h1 className="type-tagline" style={{ color: "var(--color-ink)", margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <span className="type-caption" style={{ color: "var(--color-ink-muted-48)" }}>
            {subtitle}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        {children}
      </div>
    </header>
  );
};
