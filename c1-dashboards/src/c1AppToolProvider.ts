type C1AppToolCallParams = {
  name: string;
  arguments?: Record<string, unknown>;
};

type C1AppToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: unknown;
  isError?: boolean;
};

type C1AppToolHandler = (
  args: Record<string, unknown>
) => Promise<unknown> | unknown;

const ARTIFICIAL_DELAY_MS = 800;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const dateOffset = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAgo);
  return date.toISOString().slice(0, 10);
};

const timeseries = <T,>(count: number, fn: (index: number) => T): T[] =>
  Array.from({ length: count }, (_, index) => fn(index));

const toolHandlers: Record<string, C1AppToolHandler> = {
  get_usage_metrics: (args) => {
    const days = Number(args.dateRange ?? args.days ?? 14);
    return {
      totalEvents: 48200 + days * 120,
      totalUsers: 3200 + days * 40,
      totalErrors: 142 + days * 3,
      totalCost: 1250.5 + days * 15,
      data: timeseries(days, (index) => ({
        day: dateOffset(-days + index + 1),
        events: 2800 + index * 37,
        users: 180 + index * 5,
        errors: 5 + (index % 9),
        cost: 70 + index * 1.8,
      })),
    };
  },
  get_top_endpoints: (args) => {
    const limit = Number(args.limit ?? 5);
    const paths = [
      "/api/users",
      "/api/events",
      "/api/auth",
      "/api/data",
      "/api/search",
      "/api/upload",
      "/api/export",
      "/api/notify",
    ];
    return {
      endpoints: paths.slice(0, limit).map((path, index) => ({
        path,
        requests: 12000 - index * 900,
        avgLatency: 45 + index * 12,
        errorRate: Math.round((0.5 + index * 0.3) * 100) / 100,
      })),
    };
  },
  get_resource_breakdown: () => ({
    resources: [
      { name: "API", events: 22000, users: 1800, cost: 450 },
      { name: "Web App", events: 18000, users: 2400, cost: 380 },
      { name: "Mobile", events: 8200, users: 900, cost: 220 },
      { name: "Webhook", events: 3500, users: 120, cost: 95 },
    ],
  }),
  get_error_breakdown: () => ({
    errors: [
      { category: "TimeoutError", count: 45 },
      { category: "AuthError", count: 32 },
      { category: "RateLimitError", count: 28 },
      { category: "ValidationError", count: 22 },
      { category: "NotFoundError", count: 15 },
    ],
  }),
  get_server_health: () => ({
    cpu: 48,
    memory: 71,
    latencyP95: 138,
    errorRate: 1.4,
    timeseries: timeseries(24, (index) => ({
      time: `${String(index).padStart(2, "0")}:00`,
      cpu: 35 + (index % 10) * 3,
      memory: 60 + (index % 8) * 2,
      latencyP95: 80 + (index % 12) * 7,
    })),
  }),
  get_experiment_results: () => ({
    variants: [
      { variant: "Control", conversionRate: 3.2, users: 5200 },
      { variant: "Variant A", conversionRate: 4.1, users: 5150 },
      { variant: "Variant B", conversionRate: 3.8, users: 5100 },
    ],
  }),
  get_geo_usage: () => ({
    regions: [
      { region: "North America", users: 4200, events: 18000 },
      { region: "Europe", users: 3100, events: 14000 },
      { region: "Asia Pacific", users: 1800, events: 8000 },
      { region: "Latin America", users: 600, events: 2800 },
      { region: "Africa", users: 200, events: 900 },
    ],
  }),
  get_funnel_metrics: () => ({
    steps: [
      { step: "Visit", users: 10000 },
      { step: "Sign Up", users: 3200 },
      { step: "Activate", users: 1800 },
      { step: "Subscribe", users: 450 },
      { step: "Retain (30d)", users: 320 },
    ],
  }),
};

export const c1AppToolProvider = {
  async callTool(params: C1AppToolCallParams): Promise<C1AppToolResult> {
    const args = params.arguments ?? {};
    const startedAt = performance.now();

    console.info("[C1AppTools] call:start", {
      name: params.name,
      arguments: args,
    });

    const handler = toolHandlers[params.name];
    if (!handler) {
      const message = `Unknown c1app tool: ${params.name}`;
      console.error("[C1AppTools] call:error", { name: params.name, error: message });
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }

    try {
      await sleep(ARTIFICIAL_DELAY_MS);

      const result = await handler(args);
      console.info("[C1AppTools] call:success", {
        name: params.name,
        durationMs: Math.round(performance.now() - startedAt),
        result,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown c1app tool error";
      console.error("[C1AppTools] call:error", {
        name: params.name,
        durationMs: Math.round(performance.now() - startedAt),
        error: message,
      });
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }
  },
};
