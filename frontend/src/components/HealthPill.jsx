import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  up: { label: "OK", dot: "bg-[hsl(var(--gr-allow))]", text: "text-[hsl(var(--gr-allow))]" },
  degraded: { label: "DEGRADED", dot: "bg-[hsl(var(--gr-redact))]", text: "text-[hsl(var(--gr-redact))]" },
  down: { label: "DOWN", dot: "bg-[hsl(var(--gr-block))]", text: "text-[hsl(var(--gr-block))]" },
  unknown: { label: "UNKNOWN", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

export const HealthPill = ({ status = "unknown", label, className, "data-testid": testId }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  return (
    <span data-testid={testId} data-status={status} className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot, status === "up" && "animate-pulse")} />
      {label || cfg.label}
    </span>
  );
};

export default HealthPill;
