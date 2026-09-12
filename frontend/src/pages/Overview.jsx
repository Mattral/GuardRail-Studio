import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CheckCircle2, ShieldAlert, ShieldX, Timer, ExternalLink } from "lucide-react";
import { format } from "date-fns";

import { getHealth, getMetrics, getAuditLogRecent } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthPill } from "@/components/HealthPill";
import { KpiStatCard } from "@/components/KpiStatCard";
import { DecisionBadge } from "@/components/DecisionBadge";

const Overview = () => {
  const { data: health, isLoading: healthLoading } = useQuery({ queryKey: ["health"], queryFn: getHealth, refetchInterval: 5000 });
  const { data: metrics, isLoading: metricsLoading } = useQuery({ queryKey: ["metrics"], queryFn: getMetrics, refetchInterval: 5000 });
  const { data: recent } = useQuery({ queryKey: ["audit-recent"], queryFn: () => getAuditLogRecent(15), refetchInterval: 5000 });

  const chartData = (metrics?.history || []).map((h) => ({
    time: format(new Date(h.timestamp * 1000), "HH:mm:ss"),
    Allowed: h.allow_total,
    Redacted: h.redact_total,
    Blocked: h.block_total,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Live status of the guardrail-rs firewall proxy</p>
        </div>
      </div>

      <Card className="p-4 sm:p-5" data-testid="overview-status-strip">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between" data-testid="proxy-health">
            <span className="text-sm font-medium">Firewall proxy (guardrail-rs)</span>
            {healthLoading ? <Skeleton className="h-4 w-16" /> : <HealthPill status={health?.proxy?.status} label={health?.proxy?.status?.toUpperCase()} />}
          </div>
          <div className="flex items-center justify-between" data-testid="upstream-health">
            <span className="text-sm font-medium">Active upstream: <span className="font-mono text-xs">{health?.active_upstream}</span></span>
            {healthLoading ? <Skeleton className="h-4 w-16" /> : <HealthPill status={health?.active_upstream === "mock" ? health?.mock_upstream?.status : "up"} />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Gemini configured</span>
            <span className={"text-xs font-mono " + (health?.gemini_configured ? "text-[hsl(var(--gr-allow))]" : "text-muted-foreground")}>
              {health?.gemini_configured ? "YES" : "NO"}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" data-testid="loading-skeleton" />)
        ) : (
          <>
            <KpiStatCard data-testid="kpi-allow" label="Allowed" value={metrics?.current?.allow_total ?? 0} icon={CheckCircle2} tone="allow" sublabel="cumulative since proxy start" />
            <KpiStatCard data-testid="kpi-redact" label="Redacted" value={metrics?.current?.redact_total ?? 0} icon={ShieldAlert} tone="redact" sublabel="PII stripped, request forwarded" />
            <KpiStatCard data-testid="kpi-block" label="Blocked" value={metrics?.current?.block_total ?? 0} icon={ShieldX} tone="block" sublabel="never reached upstream" />
            <KpiStatCard data-testid="kpi-latency" label="p95 pipeline latency" value={`${metrics?.current?.p95_pipeline_latency_ms ?? 0}ms`} icon={Timer} tone="neutral" sublabel="evaluation only, excludes upstream" />
          </>
        )}
      </div>

      <Card className="p-4 sm:p-5" data-testid="overview-trends-chart">
        <h2 className="text-sm font-semibold mb-3">Decision trends (last 60 min)</h2>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Not enough data yet. Send a few test prompts to populate this chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Allowed" stroke="hsl(152 60% 38%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Redacted" stroke="hsl(36 90% 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Blocked" stroke="hsl(0 75% 45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-4 sm:p-5" data-testid="recent-activity-feed">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <Link to="/audit">
            <Button variant="ghost" size="sm" className="text-xs">
              View audit log <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
        {!recent || recent.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center" data-testid="audit-empty-state">
            No audit events yet. Try the{" "}
            <Link to="/test" className="underline" data-testid="audit-empty-open-test-console">
              Test a Prompt
            </Link>{" "}
            console to generate one.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[360px] overflow-auto">
            {recent.map((r) => (
              <div key={r.request_id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/50 text-sm">
                <DecisionBadge decision={r.decision} size="sm" />
                <span className="font-mono text-xs text-muted-foreground truncate flex-1">{r.reason || "—"}</span>
                <span className="font-mono text-xs text-muted-foreground">{r.request_id?.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Overview;
