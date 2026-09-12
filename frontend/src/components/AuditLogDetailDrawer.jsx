import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { DecisionBadge } from "@/components/DecisionBadge";
import { CodePanel } from "@/components/CodePanel";

export const AuditLogDetailDrawer = ({ open, onOpenChange, record }) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent data-testid="audit-log-detail-drawer">
        <div className="mx-auto w-full max-w-2xl px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="flex items-center gap-3">
              Decision detail
              {record && <DecisionBadge decision={record.decision} />}
            </DrawerTitle>
            <DrawerDescription className="font-mono text-xs">{record?.request_id}</DrawerDescription>
          </DrawerHeader>
          {record && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Timestamp</div>
                  <div className="font-mono text-xs">{record.timestamp}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Model / Provider</div>
                  <div className="font-mono text-xs">{record.model} / {record.provider}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Pipeline latency</div>
                  <div className="font-mono text-xs tabular-nums">{record.latency_pipeline_ms?.toFixed?.(3) ?? "—"} ms</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total latency</div>
                  <div className="font-mono text-xs tabular-nums">{record.latency_total_ms?.toFixed?.(3) ?? "—"} ms</div>
                </div>
              </div>
              {record.reason && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Reason</div>
                  <div className="text-sm">{record.reason}</div>
                </div>
              )}
              {record.pii_entities_found?.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">PII entities found</div>
                  <div className="text-sm font-mono">{record.pii_entities_found.join(", ")}</div>
                </div>
              )}
              <CodePanel title="raw record" content={record} data-testid="audit-detail-raw-json" />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AuditLogDetailDrawer;
