import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

import { getAuditLog, getAuditLogDetail } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DecisionBadge } from "@/components/DecisionBadge";
import { AuditLogDetailDrawer } from "@/components/AuditLogDetailDrawer";

const PAGE_SIZE = 20;

const AuditLog = () => {
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", search, decision, page],
    queryFn: () => getAuditLog({ decision, search: search || undefined, skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
    refetchInterval: 5000,
  });

  const handleRowClick = async (row) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Every decision guardrail-rs has made, ingested from its NDJSON audit log.</p>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="audit-filter-search"
              placeholder="Search request id, reason, code..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <Select
            value={decision}
            onValueChange={(v) => {
              setDecision(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-40" data-testid="audit-filter-decision">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decisions</SelectItem>
              <SelectItem value="allow">Allowed</SelectItem>
              <SelectItem value="redact">Redacted</SelectItem>
              <SelectItem value="block">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" data-testid="loading-skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center" data-testid="audit-empty-state">
            No audit events match this filter yet.
          </div>
        ) : (
          <div className="overflow-auto">
            <Table data-testid="audit-log-table">
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
                <TableRow className="h-10">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Request ID</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow
                    key={row.request_id}
                    className="h-10 cursor-pointer hover:bg-muted/50"
                    data-testid="audit-log-row"
                    onClick={() => handleRowClick(row)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{row.timestamp}</TableCell>
                    <TableCell>
                      <DecisionBadge decision={row.decision} size="sm" />
                    </TableCell>
                    <TableCell className="truncate max-w-[420px] text-sm">{row.reason || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.request_id?.slice(0, 12)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-xs">
                      {row.latency_total_ms != null ? `${row.latency_total_ms.toFixed(3)}ms` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>{total} total events</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      <AuditLogDetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} record={selected} />
    </div>
  );
};

export default AuditLog;
