import { NavLink } from "react-router-dom";
import { Activity, Play, SlidersHorizontal, ListFilter, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";
import { HealthPill } from "@/components/HealthPill";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: Activity, testId: "sidebar-nav-overview" },
  { to: "/test", label: "Test a Prompt", icon: Play, testId: "sidebar-nav-test" },
  { to: "/policy", label: "Policy Editor", icon: SlidersHorizontal, testId: "sidebar-nav-policy" },
  { to: "/audit", label: "Audit Log", icon: ListFilter, testId: "sidebar-nav-audit-log" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testId: "sidebar-nav-settings" },
];

const Layout = ({ children }) => {
  const { data: health } = useQuery({ queryKey: ["health"], queryFn: getHealth, refetchInterval: 5000 });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex md:w-[260px] flex-col border-r border-border bg-card shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <ShieldCheck className="h-5 w-5 text-[hsl(var(--gr-accent))]" />
          <span className="font-semibold tracking-tight">GuardRail Studio</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              data-testid={item.testId}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-border space-y-1.5" data-testid="sidebar-status-summary">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Proxy</span>
            <HealthPill status={health?.proxy?.status || "unknown"} data-testid="sidebar-proxy-health" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Upstream</span>
            <span className="text-xs font-mono text-foreground">{health?.active_upstream || "—"}</span>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 md:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[hsl(var(--gr-accent))]" />
            <span className="font-semibold">GuardRail Studio</span>
          </div>
          <HealthPill status={health?.proxy?.status || "unknown"} />
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] space-y-6 w-full">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
