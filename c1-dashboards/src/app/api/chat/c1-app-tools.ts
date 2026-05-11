export type C1AppToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
};

export const C1_APP_TOOL_DEFINITIONS: C1AppToolDefinition[] = [
  {
    name: "get_usage_metrics",
    description: "Get usage metrics for the specified date range.",
    inputSchema: {
      type: "object",
      properties: {
        dateRange: {
          type: "string",
          description: 'Number of days as numeric string ("7", "14", "30")',
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        totalEvents: { type: "number" },
        totalUsers: { type: "number" },
        totalErrors: { type: "number" },
        totalCost: { type: "number" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "string" },
              events: { type: "number" },
              users: { type: "number" },
              errors: { type: "number" },
              cost: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_top_endpoints",
    description: "Get top API endpoints by request count.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        dateRange: { type: "string" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        endpoints: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              requests: { type: "number" },
              avgLatency: { type: "number" },
              errorRate: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_resource_breakdown",
    description: "Get resource usage breakdown by type.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        resources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              events: { type: "number" },
              users: { type: "number" },
              cost: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_error_breakdown",
    description: "Get error breakdown by category.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        errors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              count: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_server_health",
    description: "Get current server health metrics (CPU, memory, latency).",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        cpu: { type: "number" },
        memory: { type: "number" },
        latencyP95: { type: "number" },
        errorRate: { type: "number" },
        timeseries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time: { type: "string" },
              cpu: { type: "number" },
              memory: { type: "number" },
              latencyP95: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_experiment_results",
    description: "Get A/B experiment results with conversion rates.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              variant: { type: "string" },
              conversionRate: { type: "number" },
              users: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_geo_usage",
    description: "Get geographic usage breakdown by region.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        regions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              region: { type: "string" },
              users: { type: "number" },
              events: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_funnel_metrics",
    description: "Get conversion funnel metrics.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step: { type: "string" },
              users: { type: "number" },
            },
          },
        },
      },
    },
  },
];
