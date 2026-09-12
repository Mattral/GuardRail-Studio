import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightLeft, CheckCircle2 } from "lucide-react";

import { getUpstream, putUpstream } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["upstream"], queryFn: getUpstream, refetchInterval: 5000 });

  const mutation = useMutation({
    mutationFn: (mode) => putUpstream(mode),
    onSuccess: (result, mode) => {
      if (result.success) {
        toast.success(`Upstream switched to ${mode}`, { description: "Proxy restarted and re-validated." });
        queryClient.invalidateQueries({ queryKey: ["upstream"] });
        queryClient.invalidateQueries({ queryKey: ["health"] });
      } else {
        toast.error("Switch failed", { description: result.validation_output });
      }
    },
    onError: (err) => toast.error("Switch failed", { description: err?.message }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Upstream selection and proxy connection details.</p>
      </div>

      <Card className="p-4 sm:p-5 space-y-4" data-testid="settings-upstream-mode">
        <h2 className="text-sm font-semibold">Upstream LLM</h2>
        <p className="text-xs text-muted-foreground">
          Switching restarts the guardrail-rs proxy sidecar with the new upstream target. All firewall stages remain enforced regardless of upstream.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className={`border rounded-md p-4 flex items-center justify-between ${data?.mode === "mock" ? "border-[hsl(var(--gr-accent))] bg-accent/40" : "border-border"}`}
          >
            <div>
              <div className="text-sm font-medium">Mock upstream</div>
              <div className="text-xs text-muted-foreground font-mono">{data?.mock_url}</div>
            </div>
            {data?.mode === "mock" ? (
              <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
            ) : (
              <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate("mock")}>
                <ArrowRightLeft className="h-3.5 w-3.5" /> Switch
              </Button>
            )}
          </div>
          <div
            className={`border rounded-md p-4 flex items-center justify-between ${data?.mode === "gemini" ? "border-[hsl(var(--gr-accent))] bg-accent/40" : "border-border"}`}
          >
            <div>
              <div className="text-sm font-medium">Gemini (real)</div>
              <div className="text-xs text-muted-foreground font-mono truncate max-w-[220px]">{data?.gemini_url}</div>
              <div className="text-xs mt-1">
                {data?.gemini_configured ? (
                  <span className="text-[hsl(var(--gr-allow))]">API key configured</span>
                ) : (
                  <span className="text-[hsl(var(--gr-block))]">API key not configured</span>
                )}
              </div>
            </div>
            {data?.mode === "gemini" ? (
              <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={mutation.isPending || !data?.gemini_configured}
                onClick={() => mutation.mutate("gemini")}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Switch
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 space-y-3" data-testid="settings-proxy-info">
        <h2 className="text-sm font-semibold">Proxy connection info</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Proxy URL</dt>
            <dd className="font-mono text-xs">{data?.proxy_url}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Metrics URL</dt>
            <dd className="font-mono text-xs">{data?.metrics_url}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Config path</dt>
            <dd className="font-mono text-xs">{data?.config_path}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Audit log path</dt>
            <dd className="font-mono text-xs">{data?.audit_log_path}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
};

export default Settings;
