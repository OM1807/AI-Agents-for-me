// ========================================
// SESSION TYPES
// ========================================

export interface CreateSessionResponse {
  session_id: number;
  agent_type: string;
  project_name: string;
  status: string;
  created_at: string;
}

export type SupportedAgentType =
  | 'code_analysis'
  | 'code_reviewer'
  | 'test_case_generation'
  | 'requirements_to_tickets'
  | string;

export interface CreateSessionOptions {
  onSuccess?: (sessionId: string) => void;
}
