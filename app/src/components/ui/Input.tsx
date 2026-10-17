import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          className="type-caption-strong"
          style={{ color: "var(--color-ink)", userSelect: "none" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`apple-input ${error ? "error" : ""} ${className}`}
        {...props}
      />
      {error && (
        <span
          className="type-caption"
          style={{ color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "4px" }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
