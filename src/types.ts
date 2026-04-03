import { z } from "zod";

export interface AgentAction {
  type:
    | "http_request"
    | "file_write"
    | "db_query"
    | "api_call"
    | "data_parse"
    | "compute";
  params: Record<string, string>;
  description: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action_type: string;
  action_params: Record<string, string>;
  description: string;
  allowed: boolean;
  reason: string;
  matched_policy: string | null;
  confidence: number;
}

export interface AgentState {
  policies: string[];
  audit_log: AuditEntry[];
  current_task: string | null;
}

export const PolicyVerdictSchema = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  matched_policy: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export type PolicyVerdict = z.infer<typeof PolicyVerdictSchema>;
