import React from "react";
import {
  UserPlus,
  ArrowRightLeft,
  UserCheck,
  MessageSquare,
  MapPin,
  PhoneCall,
  Clock,
  Sparkles,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  metadata?: any;
  createdAt: Date | string;
  user?: { firstName: string; lastName: string; role: string } | null;
}

interface LeadTimelineProps {
  activities: ActivityItem[];
  onOpenAddNote: () => void;
}

export const LeadTimeline: React.FC<LeadTimelineProps> = ({
  activities,
  onOpenAddNote,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CREATE":
        return <UserPlus size={14} style={{ color: "var(--color-primary)" }} />;
      case "STAGE_CHANGE":
        return <ArrowRightLeft size={14} style={{ color: "#5856d6" }} />;
      case "REASSIGN":
        return <UserCheck size={14} style={{ color: "#34c759" }} />;
      case "NOTE":
        return <MessageSquare size={14} style={{ color: "var(--color-ink)" }} />;
      case "SITE_VISIT":
        return <MapPin size={14} style={{ color: "#ff9500" }} />;
      case "CALL":
        return <PhoneCall size={14} style={{ color: "#0066cc" }} />;
      default:
        return <Clock size={14} style={{ color: "var(--color-ink-muted-48)" }} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Timeline Controls Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "var(--space-sm)",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <h3 className="type-caption-strong" style={{ color: "var(--color-ink)", margin: 0 }}>
            Unified Activity Stream
          </h3>
          <span
            style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "10px",
              backgroundColor: "var(--color-surface-pearl)",
              color: "var(--color-ink-muted-48)",
              border: "1px solid var(--color-hairline)",
            }}
          >
            {activities.length} events
          </span>
        </div>

        <button
          onClick={onOpenAddNote}
          className="btn-pearl-capsule"
          style={{ height: "30px", padding: "0 12px", fontSize: "12px", gap: "4px", color: "var(--color-primary)" }}
        >
          <MessageSquare size={13} />
          Add Note
        </button>
      </div>

      {/* Activity Timeline List */}
      {activities.length === 0 ? (
        <div
          style={{
            padding: "var(--space-xl) var(--space-md)",
            textAlign: "center",
            color: "var(--color-ink-muted-48)",
            fontSize: "13px",
          }}
        >
          No activity logs recorded yet for this customer.
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: "24px" }}>
          {/* Vertical Connecting Hairline */}
          <div
            style={{
              position: "absolute",
              left: "11px",
              top: "12px",
              bottom: "12px",
              width: "1px",
              backgroundColor: "var(--color-hairline)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
            {activities.map((item) => {
              const date = new Date(item.createdAt);
              const dateStr = date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const timeStr = date.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={item.id} style={{ position: "relative" }}>
                  {/* Timeline Node Icon Circle */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-24px",
                      top: "2px",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-canvas)",
                      border: "1px solid var(--color-hairline)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {getActivityIcon(item.type)}
                  </div>

                  {/* Activity Card */}
                  <div
                    style={{
                      backgroundColor: "var(--color-canvas)",
                      border: "1px solid var(--color-hairline)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-sm) var(--space-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-ink)" }}>
                        {item.title}
                      </span>
                      <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontSize: "11px" }}>
                        {dateStr} at {timeStr}
                      </span>
                    </div>

                    {item.description && (
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontSize: "13px",
                          lineHeight: 1.45,
                          color: "var(--color-ink-muted-80)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    {item.user && (
                      <div
                        style={{
                          marginTop: "4px",
                          paddingTop: "4px",
                          borderTop: "1px solid var(--color-divider-soft)",
                          fontSize: "11px",
                          color: "var(--color-ink-muted-48)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>Logged by:</span>
                        <strong style={{ color: "var(--color-ink)" }}>
                          {item.user.firstName} {item.user.lastName}
                        </strong>
                        <span>({item.user.role})</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
