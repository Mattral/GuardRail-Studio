import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CodePanel = ({ title, content, maxHeightClass = "max-h-[420px]", className, "data-testid": testId }) => {
  const [copied, setCopied] = useState(false);
  const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      /* no-op */
    }
  };

  return (
    <div
      data-testid={testId || "code-panel"}
      className={cn("rounded-lg border bg-[hsl(var(--gr-code-bg))] border-[hsl(var(--gr-code-border))]", className)}
    >
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--gr-code-border))]">
          <span className="text-xs font-medium text-muted-foreground font-mono">{title}</span>
          <Button variant="secondary" size="sm" onClick={handleCopy} data-testid="code-panel-copy-button" className="h-7 px-2">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      )}
      <pre className={cn("p-3 overflow-auto font-mono text-xs leading-5 whitespace-pre-wrap break-all", maxHeightClass)}>
        {text}
      </pre>
    </div>
  );
};

export default CodePanel;
