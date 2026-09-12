import { cn } from "@/lib/utils";

const TONE_TEXT = {
  allow: "text-[hsl(var(--gr-allow))]",
  redact: "text-[hsl(var(--gr-redact))]",
  block: "text-[hsl(var(--gr-block))]",
  neutral: "text-foreground",
};

export const KpiStatCard = ({ label, value, icon: Icon, tone = "neutral", sublabel, "data-testid": testId }) => {
  return (
    <div data-testid={testId} className="rounded-lg border bg-card p-4 sm:p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", TONE_TEXT[tone])} />}
      </div>
      <div className={cn("text-2xl font-semibold tabular-nums font-mono", TONE_TEXT[tone])}>{value}</div>
      {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
    </div>
  );
};

export default KpiStatCard;
