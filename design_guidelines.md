{
  "product": {
    "name": "GuardRail Studio",
    "positioning": "Security control-plane dashboard for an LLM firewall (reverse-proxy sidecar). Dense, data-forward, precise. Think Grafana + Cloudflare Logs + Stripe Radar, without consumer-AI aesthetics.",
    "primary_users": ["backend engineers", "platform engineers", "security engineers"],
    "success_actions": [
      "Detect proxy/upstream health regressions quickly",
      "Understand allow/block/redact decisions with reasons",
      "Safely test prompts and verify redaction before upstream",
      "Edit policy with confidence (validation + diff + hot reload)",
      "Investigate incidents via audit log search + drilldown"
    ]
  },

  "brand_attributes": {
    "keywords": ["trustworthy", "technical", "precise", "calm urgency", "control-room", "auditability"],
    "anti_keywords": ["AI-slop", "purple gradients", "blobby cards", "sparkle/robot motifs", "marketing hero layouts"],
    "visual_metaphors": ["status lights", "terminal readouts", "log explorer", "policy pipeline"],
    "density_principle": "High information density with strict hierarchy: status → trends → logs/details. Use whitespace as grouping, not as emptiness."
  },

  "typography": {
    "font_pairing": {
      "ui_sans": {
        "name": "IBM Plex Sans",
        "usage": "All UI chrome, headings, labels, tables",
        "source": "Already imported in /src/App.css"
      },
      "mono": {
        "name": "JetBrains Mono",
        "usage": "Request IDs, JSON/TOML blocks, latency numbers, regex/keywords",
        "source": "Already imported in /src/App.css"
      }
    },
    "tailwind_usage": {
      "headings": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
        "h2": "text-base md:text-lg font-medium text-muted-foreground",
        "section_title": "text-sm font-semibold tracking-tight text-foreground"
      },
      "body": {
        "default": "text-sm md:text-base text-foreground",
        "muted": "text-xs text-muted-foreground"
      },
      "mono_blocks": {
        "inline": "font-mono text-xs",
        "block": "font-mono text-xs leading-5"
      }
    },
    "number_formatting": {
      "latency": "Always show ms with fixed precision (e.g., 123.4ms). Use tabular-nums for alignment: class 'tabular-nums'.",
      "rates": "Use compact notation for big counts (e.g., 12.4k) but allow hover tooltip for exact."
    }
  },

  "color_system": {
    "intent": "Neutral, high-contrast base with restrained accents. Decision colors are the primary semantic channel.",
    "decision_states": {
      "allow": {
        "label": "ALLOWED",
        "bg": "hsl(152 55% 92%)",
        "fg": "hsl(155 55% 22%)",
        "border": "hsl(152 45% 78%)",
        "dot": "hsl(152 60% 38%)"
      },
      "redact": {
        "label": "REDACTED",
        "bg": "hsl(42 95% 92%)",
        "fg": "hsl(28 80% 26%)",
        "border": "hsl(40 90% 78%)",
        "dot": "hsl(36 90% 45%)"
      },
      "block": {
        "label": "BLOCKED",
        "bg": "hsl(0 85% 94%)",
        "fg": "hsl(0 70% 30%)",
        "border": "hsl(0 80% 82%)",
        "dot": "hsl(0 75% 45%)"
      }
    },
    "status_neutrals": {
      "bg": "hsl(210 40% 98%)",
      "surface": "hsl(0 0% 100%)",
      "surface_2": "hsl(210 40% 96%)",
      "border": "hsl(214 32% 91%)",
      "text": "hsl(222 47% 11%)",
      "muted": "hsl(215 16% 47%)"
    },
    "accent": {
      "primary": "hsl(221 83% 53%)",
      "primary_fg": "hsl(210 40% 98%)",
      "ring": "hsl(221 83% 53%)",
      "note": "Use blue only for navigation/selection/focus, not for decision states."
    },
    "charts": {
      "allow_line": "hsl(152 60% 38%)",
      "redact_line": "hsl(36 90% 45%)",
      "block_line": "hsl(0 75% 45%)",
      "latency_line": "hsl(221 83% 53%)",
      "grid": "hsl(214 32% 91%)"
    },
    "gradients_and_texture": {
      "allowed_usage": "Very subtle, only as a top-of-page header wash or decorative corner glow; never behind tables/code blocks; never >20% viewport.",
      "safe_gradient_examples": [
        "bg-[radial-gradient(1200px_circle_at_10%_0%,hsl(221_83%_96%),transparent_55%)]",
        "bg-[radial-gradient(900px_circle_at_90%_10%,hsl(152_55%_95%),transparent_60%)]"
      ],
      "noise_overlay": {
        "css": "background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"2\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.06\"/></svg>');",
        "usage": "Apply to app background wrapper only (not cards) with low opacity."
      }
    }
  },

  "design_tokens_css": {
    "where": "/app/frontend/src/index.css (extend :root tokens)",
    "tokens": {
      "--gr-allow": "152 60% 38%",
      "--gr-redact": "36 90% 45%",
      "--gr-block": "0 75% 45%",
      "--gr-allow-bg": "152 55% 92%",
      "--gr-redact-bg": "42 95% 92%",
      "--gr-block-bg": "0 85% 94%",
      "--gr-code-bg": "210 40% 96%",
      "--gr-code-border": "214 32% 91%",
      "--gr-focus": "221 83% 53%",
      "--radius": "0.5rem",
      "--radius-lg": "0.75rem",
      "--shadow-soft": "0 1px 0 rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.06)"
    },
    "tailwind_mapping_note": "Use Tailwind arbitrary values when needed: bg-[hsl(var(--gr-allow-bg))], text-[hsl(var(--gr-allow))]."
  },

  "layout_and_grid": {
    "app_shell": {
      "pattern": "Left sidebar + top header + main content. Sidebar collapsible on mobile into Sheet.",
      "sidebar_width": "w-[260px] (desktop), w-full (mobile sheet)",
      "content_max": "max-w-[1400px] for readability; do not center text globally; align content to left with consistent gutters.",
      "gutters": "px-4 sm:px-6 lg:px-8",
      "vertical_rhythm": "space-y-6 for page sections; cards use p-4 sm:p-5"
    },
    "dashboard_grid": {
      "top_row": "3–4 stat cards (health + allow/redact/block rates)",
      "middle_row": "time-series chart (full width) + recent activity feed (right on lg)",
      "bottom_row": "audit log preview table"
    },
    "information_density_controls": {
      "tables": "Use compact row height, sticky header, and monospace for IDs. Provide column visibility toggles later if needed.",
      "code_panels": "Use ScrollArea with max-h and copy buttons; never let code blocks push layout infinitely."
    }
  },

  "components": {
    "component_path": {
      "navigation": [
        "/app/frontend/src/components/ui/navigation-menu.jsx",
        "/app/frontend/src/components/ui/breadcrumb.jsx",
        "/app/frontend/src/components/ui/sheet.jsx"
      ],
      "structure": [
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/resizable.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/tabs.jsx"
      ],
      "forms": [
        "/app/frontend/src/components/ui/form.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/textarea.jsx",
        "/app/frontend/src/components/ui/select.jsx",
        "/app/frontend/src/components/ui/switch.jsx",
        "/app/frontend/src/components/ui/checkbox.jsx",
        "/app/frontend/src/components/ui/slider.jsx",
        "/app/frontend/src/components/ui/label.jsx"
      ],
      "feedback": [
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/alert.jsx",
        "/app/frontend/src/components/ui/skeleton.jsx",
        "/app/frontend/src/components/ui/sonner.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx"
      ],
      "data_display": [
        "/app/frontend/src/components/ui/table.jsx",
        "/app/frontend/src/components/ui/accordion.jsx",
        "/app/frontend/src/components/ui/collapsible.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/drawer.jsx"
      ],
      "time_range": [
        "/app/frontend/src/components/ui/calendar.jsx",
        "/app/frontend/src/components/ui/popover.jsx"
      ]
    },
    "custom_components_to_create": [
      {
        "name": "DecisionBadge",
        "file": "/app/frontend/src/components/DecisionBadge.jsx",
        "purpose": "Single source of truth for ALLOWED/REDACTED/BLOCKED styling + icon + accessible label.",
        "props": ["decision: 'allow'|'redact'|'block'", "size: 'sm'|'md'"],
        "data_testid": "decision-badge"
      },
      {
        "name": "CodePanel",
        "file": "/app/frontend/src/components/CodePanel.jsx",
        "purpose": "Monospace scrollable JSON/TOML viewer with copy button + optional diff view.",
        "data_testid": "code-panel"
      },
      {
        "name": "HealthPill",
        "file": "/app/frontend/src/components/HealthPill.jsx",
        "purpose": "Upstream/proxy health indicator (OK/DEGRADED/DOWN) with dot + last checked timestamp.",
        "data_testid": "health-pill"
      },
      {
        "name": "KpiStatCard",
        "file": "/app/frontend/src/components/KpiStatCard.jsx",
        "purpose": "Reusable stat card with label, value, delta, tiny sparkline placeholder.",
        "data_testid": "kpi-stat-card"
      },
      {
        "name": "AuditLogDetailDrawer",
        "file": "/app/frontend/src/components/AuditLogDetailDrawer.jsx",
        "purpose": "Drawer for expanded JSON detail from a table row (mobile-first).",
        "data_testid": "audit-log-detail-drawer"
      }
    ]
  },

  "page_blueprints": {
    "overview_dashboard": {
      "primary_sections": [
        {
          "name": "Status strip",
          "layout": "Card with 2 columns: Proxy health + Upstream health + last refresh + polling indicator",
          "components": ["Card", "HealthPill", "Badge", "Tooltip"],
          "data_testids": ["overview-status-strip", "proxy-health", "upstream-health"]
        },
        {
          "name": "Decision KPIs",
          "layout": "Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
          "cards": ["Allow rate", "Redact rate", "Block rate", "p95 latency"],
          "components": ["KpiStatCard", "DecisionBadge"],
          "data_testids": ["kpi-allow", "kpi-redact", "kpi-block", "kpi-latency"]
        },
        {
          "name": "Trends",
          "layout": "Large Card with time-series chart + legend chips",
          "library": "recharts",
          "data_testids": ["overview-trends-chart"]
        },
        {
          "name": "Recent activity",
          "layout": "Right column feed on lg; list of last 20 decisions with decision badge + rule + request id",
          "components": ["ScrollArea", "DecisionBadge"],
          "data_testids": ["recent-activity-feed"]
        },
        {
          "name": "Audit preview",
          "layout": "Compact Table with sticky header; click row opens detail drawer",
          "components": ["Table", "Drawer"],
          "data_testids": ["audit-preview-table"]
        }
      ]
    },

    "test_a_prompt": {
      "layout": "Two-pane on lg using Resizable: left = prompt composer, right = result inspector. On mobile: Tabs (Compose/Result).",
      "left_pane": {
        "sections": [
          "Upstream selector (Mock/Gemini)",
          "Role select (system/user/assistant)",
          "Prompt textarea",
          "Preset chips: prompt injection, PII samples, toxicity",
          "Run button + options (stream off/on if supported)"
        ],
        "components": ["Select", "Textarea", "Button", "ToggleGroup", "Tooltip"],
        "data_testids": ["prompt-upstream-select", "prompt-role-select", "prompt-content-textarea", "prompt-run-button"]
      },
      "right_pane": {
        "sections": [
          "Decision header: DecisionBadge + latency + request id",
          "Reasons list (matched rules/stages)",
          "Tabs: Summary | Raw JSON | Redaction Diff (mock only)",
          "Copy buttons for request/response"
        ],
        "components": ["Tabs", "Badge", "CodePanel", "Accordion"],
        "data_testids": ["prompt-result-panel", "prompt-decision-badge", "prompt-raw-json", "prompt-redaction-diff"]
      },
      "diff_guidance": {
        "approach": "Use a simple line-based diff viewer (react-diff-viewer) OR a minimal custom diff with <pre> blocks and highlighted spans.",
        "note": "Keep diff background neutral; use subtle green/red highlights with low saturation."
      }
    },

    "policy_editor": {
      "layout": "Three-column on xl: left nav (pipeline stages), middle form, right raw TOML preview/diff. On mobile: Tabs (Form/Raw).",
      "sections": [
        {
          "name": "Injection detection",
          "controls": ["Switch enabled", "Select action (block/redact/allow)", "Textarea custom message"],
          "data_testids": ["policy-injection-switch", "policy-injection-action"]
        },
        {
          "name": "PII entities",
          "controls": "Table-like list: entity name, enabled checkbox, redaction token input",
          "data_testids": ["policy-pii-entities"]
        },
        {
          "name": "Toxicity",
          "controls": ["Slider threshold", "Select action"],
          "data_testids": ["policy-toxicity-threshold", "policy-toxicity-action"]
        },
        {
          "name": "Custom keyword rules",
          "controls": "Editable table with add/edit dialog: name, keywords (chips), action, message",
          "components": ["Table", "Dialog", "Input", "Badge"],
          "data_testids": ["policy-custom-rules-table", "policy-add-rule-button"]
        },
        {
          "name": "Save + validate",
          "controls": ["Save button", "Validate button", "Inline Alert for errors"],
          "data_testids": ["policy-save-button", "policy-validate-button", "policy-validation-alert"]
        }
      ],
      "raw_preview": {
        "component": "CodePanel",
        "features": ["copy", "download", "diff vs last applied"],
        "data_testids": ["policy-raw-toml-preview"]
      }
    },

    "audit_log": {
      "layout": "Top filter bar + table + detail drawer.",
      "filters": [
        "Search (request id / keyword)",
        "Decision multi-select (allow/redact/block)",
        "Time range (calendar popover)",
        "Stage select"
      ],
      "table_columns": ["timestamp", "decision", "stage", "reason", "request_id", "latency"],
      "interactions": [
        "Row click opens detail drawer",
        "Inline filter chips from row values (Cloudflare-like pivot)"
      ],
      "components": ["Input", "Select", "Calendar", "Popover", "Table", "Drawer"],
      "data_testids": ["audit-filter-search", "audit-filter-decision", "audit-filter-time", "audit-log-table"]
    },

    "settings": {
      "layout": "Two cards: Upstream mode + Proxy connection info.",
      "components": ["Card", "Switch", "Input", "Badge"],
      "data_testids": ["settings-upstream-mode", "settings-proxy-info"]
    }
  },

  "motion_and_microinteractions": {
    "principles": [
      "Motion communicates state changes (polling refresh, new log entry, save applied).",
      "Keep durations short (120–180ms) and easing 'ease-out'.",
      "Avoid layout jank: animate opacity/translate, not height for large blocks."
    ],
    "patterns": {
      "new_log_flash": "Use existing .flash-new class for newly arrived audit rows (already in App.css).",
      "button_press": "active:scale-[0.98] with transition-[transform] duration-150",
      "hover": "hover:bg-muted/60 for rows; hover:border-border for cards",
      "polling_indicator": "Small dot with animate-pulse next to 'Last updated'"
    },
    "framer_motion": {
      "use_cases": ["drawer enter/exit", "tab content fade", "toast entrance"],
      "install": "npm i framer-motion",
      "note": "Optional; keep minimal to avoid perf issues in tables."
    }
  },

  "data_dense_ui_patterns": {
    "tables": {
      "row_height": "h-10 (compact)",
      "header": "sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70",
      "cells": {
        "ids": "font-mono text-xs text-muted-foreground",
        "latency": "font-mono tabular-nums text-xs",
        "reason": "truncate max-w-[420px]"
      },
      "row_states": {
        "hover": "hover:bg-muted/50",
        "selected": "data-[state=selected]:bg-muted",
        "clickable": "cursor-pointer"
      }
    },
    "code_blocks": {
      "container": "rounded-lg border bg-[hsl(var(--gr-code-bg))]",
      "toolbar": "flex items-center justify-between px-3 py-2 border-b",
      "content": "p-3 overflow-auto max-h-[420px]",
      "copy_button": "Button variant='secondary' size='sm'"
    },
    "diff": {
      "colors": "Use subtle backgrounds: added bg-emerald-50, removed bg-rose-50; text remains neutral.",
      "note": "Never use saturated neon diff colors; keep it readable."
    }
  },

  "iconography": {
    "library": "lucide-react",
    "install": "npm i lucide-react",
    "usage": {
      "allow": "CheckCircle2",
      "redact": "ShieldAlert",
      "block": "ShieldX",
      "latency": "Timer",
      "logs": "ListFilter",
      "policy": "SlidersHorizontal",
      "settings": "Settings",
      "health": "Activity"
    },
    "rules": [
      "No emoji icons.",
      "Icons are 16–18px in tables, 18–20px in headers.",
      "Always pair icon with text label for critical states."
    ]
  },

  "libraries": {
    "charts": {
      "recommended": "recharts",
      "install": "npm i recharts",
      "usage_notes": [
        "Use a single time-series chart with 3 decision lines + latency line (secondary axis).",
        "Limit ticks; show tooltip with exact values.",
        "Use strokeWidth=2, dot={false}, and a subtle CartesianGrid."
      ]
    },
    "diff_view": {
      "recommended": "react-diff-viewer-continued",
      "install": "npm i react-diff-viewer-continued",
      "fallback": "If avoiding dependency, render two CodePanels side-by-side with highlighted tokens."
    },
    "polling": {
      "recommended": "@tanstack/react-query",
      "install": "npm i @tanstack/react-query",
      "usage_notes": ["Use refetchInterval 3000–5000ms for health/metrics.", "Show stale indicator when last update >2 intervals."]
    }
  },

  "empty_loading_error_states": {
    "loading": {
      "pattern": "Skeleton rows/cards; keep layout stable.",
      "components": ["Skeleton"],
      "data_testids": ["loading-skeleton"]
    },
    "empty_audit": {
      "copy": {
        "title": "No audit events yet",
        "body": "Once the proxy starts receiving traffic, decisions will appear here. Try the Test a Prompt console to generate a sample event."
      },
      "cta": "Button: 'Open Test Console'",
      "data_testids": ["audit-empty-state", "audit-empty-open-test-console"]
    },
    "metrics_unavailable": {
      "copy": {
        "title": "Metrics unavailable",
        "body": "The proxy is reachable but metrics endpoint is not returning data. Check sidecar config and ports."
      },
      "severity": "warning",
      "data_testids": ["metrics-unavailable-alert"]
    },
    "proxy_unreachable": {
      "copy": {
        "title": "Proxy unreachable",
        "body": "Guardrail sidecar is not responding. Verify the reverse-proxy is running and the configured port is correct."
      },
      "severity": "destructive",
      "data_testids": ["proxy-unreachable-alert"]
    },
    "policy_validation_failure": {
      "copy": {
        "title": "Policy validation failed",
        "body": "Fix the highlighted fields and re-validate. You can also inspect the raw TOML diff to spot unintended changes."
      },
      "severity": "destructive",
      "data_testids": ["policy-validation-failed-alert"]
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text and badges.",
      "Decision states must not rely on color alone: include icon + label.",
      "Keyboard navigation: focus rings visible on all interactive elements.",
      "Tables: ensure row actions are reachable via keyboard; provide aria-labels for icon-only buttons."
    ],
    "focus_styles": "Use ring-2 ring-[hsl(var(--gr-focus))] ring-offset-2 ring-offset-background on focus-visible.",
    "reduced_motion": "Respect prefers-reduced-motion: disable flash animations and large transitions."
  },

  "data_testid_conventions": {
    "rule": "All interactive and key informational elements MUST include data-testid.",
    "format": "kebab-case describing role, not appearance",
    "examples": [
      "data-testid=\"sidebar-nav-audit-log\"",
      "data-testid=\"overview-trends-chart\"",
      "data-testid=\"policy-save-button\"",
      "data-testid=\"audit-log-row\" (append request id in code if needed)"
    ]
  },

  "instructions_to_main_agent": [
    "Do NOT use .transition-all globally; remove/avoid the .transition-all class usage in new code. Prefer transition-colors or transition-[transform] per element.",
    "Keep the UI light by default (white/near-white surfaces) with strong borders and subtle shadows; reserve dark surfaces for code blocks only.",
    "Implement DecisionBadge first and reuse everywhere (overview cards, test result header, audit table).",
    "Use Resizable for desktop split panes (Test Console, Policy Editor). On mobile, switch to Tabs to avoid cramped split views.",
    "Use monospace for request IDs, JSON/TOML, latency numbers; add 'tabular-nums' for numeric alignment.",
    "Add polling with React Query for health/metrics; show last updated timestamp and stale indicator.",
    "Audit Log table: sticky header, compact rows, row click opens Drawer with full JSON in CodePanel.",
    "Policy Editor: always show inline validation errors near fields + a top Alert summary; include raw TOML preview and diff.",
    "Icons: use lucide-react only; no emojis."
  ],

  "image_urls": {
    "note": "This is an internal dev-tool dashboard; avoid stock photography. Prefer subtle SVG noise + simple geometric accents. No external images required.",
    "optional": [
      {
        "category": "empty_state_illustration",
        "description": "If you want a minimal illustration, use a tiny inline SVG (shield + log lines) rather than a photo.",
        "url": "inline-svg"
      }
    ]
  },

  "appendix_general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
