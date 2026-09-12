import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save, CheckCircle2 } from "lucide-react";

import { getPolicy, putPolicy } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CodePanel } from "@/components/CodePanel";

const ENTITY_LABELS = {
  email: "Email address",
  phone: "Phone number",
  credit_card: "Credit card",
  ssn: "SSN",
  ip_address: "IP address",
  api_key: "API key",
  aws_key: "AWS key",
};

const PolicyEditor = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["policy"], queryFn: getPolicy });
  const [form, setForm] = useState(null);
  const [rawToml, setRawToml] = useState("");
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (data) {
      setForm(data.policy);
      setRawToml(data.raw_toml);
      setValidationError(null);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload) => putPolicy(payload),
    onSuccess: (result) => {
      if (result.success) {
        setValidationError(null);
        setRawToml(result.raw_toml);
        toast.success("Policy applied", { description: result.reloaded ? "Hot-reloaded via SIGHUP" : "Saved" });
        queryClient.invalidateQueries({ queryKey: ["policy"] });
      } else {
        setValidationError(result.validation_output);
      }
    },
    onError: (err) => toast.error("Save failed", { description: err?.message }),
  });

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" data-testid="loading-skeleton" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const updateEntity = (entity, checked) => {
    const entities = checked
      ? [...form.pii_redactor.entities, entity]
      : form.pii_redactor.entities.filter((e) => e !== entity);
    setForm({ ...form, pii_redactor: { ...form.pii_redactor, entities } });
  };

  const updateReplacement = (entity, token) => {
    setForm({
      ...form,
      pii_redactor: { ...form.pii_redactor, replacements: { ...form.pii_redactor.replacements, [entity]: token } },
    });
  };

  const addRule = () => {
    setForm({
      ...form,
      custom_rules: [...form.custom_rules, { name: "", enabled: true, keywords: [], action: "block", message: "" }],
    });
  };

  const updateRule = (idx, patch) => {
    const rules = form.custom_rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setForm({ ...form, custom_rules: rules });
  };

  const removeRule = (idx) => {
    setForm({ ...form, custom_rules: form.custom_rules.filter((_, i) => i !== idx) });
  };

  const handleSave = () => {
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Policy Editor</h1>
          <p className="text-sm text-muted-foreground">Edits are validated by guardrail-rs before being applied and hot-reloaded.</p>
        </div>
        <Button data-testid="policy-save-button" onClick={handleSave} disabled={mutation.isPending}>
          <Save className="h-4 w-4" /> Validate &amp; save
        </Button>
      </div>

      {validationError && (
        <Alert variant="destructive" data-testid="policy-validation-alert">
          <AlertTitle>Policy validation failed</AlertTitle>
          <AlertDescription className="font-mono text-xs whitespace-pre-wrap">{validationError}</AlertDescription>
        </Alert>
      )}
      {mutation.data?.success && !validationError && (
        <Alert data-testid="policy-validation-success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Applied</AlertTitle>
          <AlertDescription className="text-xs">Config validated and hot-reloaded into the running proxy.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Prompt injection detection</h2>
              <Switch
                data-testid="policy-injection-switch"
                checked={form.regex_injection.enabled}
                onCheckedChange={(checked) => setForm({ ...form, regex_injection: { ...form.regex_injection, enabled: checked } })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Action on match</Label>
              <Select
                value={form.regex_injection.action}
                onValueChange={(v) => setForm({ ...form, regex_injection: { ...form.regex_injection, action: v } })}
              >
                <SelectTrigger data-testid="policy-injection-action"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block</SelectItem>
                  <SelectItem value="log_only">Log only (dry run)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 space-y-3" data-testid="policy-pii-entities">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">PII detection &amp; redaction</h2>
              <Switch
                checked={form.pii_redactor.enabled}
                onCheckedChange={(checked) => setForm({ ...form, pii_redactor: { ...form.pii_redactor, enabled: checked } })}
              />
            </div>
            <div className="space-y-2">
              {Object.keys(ENTITY_LABELS).map((entity) => (
                <div key={entity} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={form.pii_redactor.entities.includes(entity)}
                    onChange={(e) => updateEntity(entity, e.target.checked)}
                    data-testid={`policy-pii-entity-${entity}`}
                  />
                  <span className="text-sm flex-1">{ENTITY_LABELS[entity]}</span>
                  <Input
                    className="w-28 h-8 font-mono text-xs"
                    value={form.pii_redactor.replacements[entity] || ""}
                    onChange={(e) => updateReplacement(entity, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Toxicity classifier</h2>
              <Switch
                checked={form.toxicity.enabled}
                onCheckedChange={(checked) => setForm({ ...form, toxicity: { ...form.toxicity, enabled: checked } })}
              />
            </div>
            <p className="text-xs text-muted-foreground">Requires an ONNX model to be published; leave disabled until then.</p>
            <div>
              <Label className="text-xs mb-1.5 block">Threshold: {form.toxicity.threshold}</Label>
              <Slider
                data-testid="policy-toxicity-threshold"
                value={[form.toxicity.threshold]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => setForm({ ...form, toxicity: { ...form.toxicity, threshold: v } })}
              />
            </div>
          </Card>

          <Card className="p-4 sm:p-5 space-y-3" data-testid="policy-custom-rules-table">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Custom keyword rules</h2>
              <Button variant="outline" size="sm" onClick={addRule} data-testid="policy-add-rule-button">
                <Plus className="h-3.5 w-3.5" /> Add rule
              </Button>
            </div>
            {form.custom_rules.length === 0 ? (
              <p className="text-xs text-muted-foreground">No custom rules yet.</p>
            ) : (
              <div className="space-y-3">
                {form.custom_rules.map((rule, idx) => (
                  <div key={idx} className="border border-border rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="rule name"
                        className="h-8 text-xs flex-1"
                        value={rule.name}
                        onChange={(e) => updateRule(idx, { name: e.target.value })}
                      />
                      <Switch checked={rule.enabled} onCheckedChange={(c) => updateRule(idx, { enabled: c })} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRule(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--gr-block))]" />
                      </Button>
                    </div>
                    <Input
                      placeholder="keywords, comma separated"
                      className="h-8 text-xs font-mono"
                      value={rule.keywords.join(", ")}
                      onChange={(e) => updateRule(idx, { keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    />
                    <Input
                      placeholder="block message shown to caller"
                      className="h-8 text-xs"
                      value={rule.message}
                      onChange={(e) => updateRule(idx, { message: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold mb-3">Raw guardrail.toml (currently applied)</h2>
          <CodePanel title="guardrail.toml" content={rawToml} maxHeightClass="max-h-[720px]" data-testid="policy-raw-toml-preview" />
        </Card>
      </div>
    </div>
  );
};

export default PolicyEditor;
