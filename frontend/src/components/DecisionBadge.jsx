import { CheckCircle2, ShieldAlert, ShieldX, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIG = {
  allow: {
    label: "ALLOWED",
    icon: CheckCircle2,
    classes: "bg-[hsl(var(--gr-allow-bg))] text-[hsl(var(--gr-allow))] border-[hsl(var(--gr-allow-border))]",
  },
  redact: {
    label: "REDACTED",
    icon: ShieldAlert,
    classes: "bg-[hsl(var(--gr-redact-bg))] text-[hsl(var(--gr-redact))] border-[hsl(var(--gr-redact-border))]",
  },
  block: {
    label: "BLOCKED",
    icon: ShieldX,
    classes: "bg-[hsl(var(--gr-block-bg))] text-[hsl(var(--gr-block))] border-[hsl(var(--gr-block-border))]",
  },
  unknown: {
    label: "UNKNOWN",
    icon: HelpCircle,
    classes: "bg-muted text-muted-foreground border-border",
  },
};

export const DecisionBadge = ({ decision, size = "md", className, "data-testid": testId }) => {
  const cfg = CONFIG[decision] || CONFIG.unknown;
  const Icon = cfg.icon;
  const sizeClasses = size === "sm" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span
      data-testid={testId || "decision-badge"}
      data-decision={decision}
      className={cn(
        "inline-flex items-center rounded-md border font-semibold tracking-wide whitespace-nowrap",
        sizeClasses,
        cfg.classes,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {cfg.label}
    </span>
  );
};

export default DecisionBadge;
