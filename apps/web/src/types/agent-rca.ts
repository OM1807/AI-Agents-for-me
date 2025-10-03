export interface DataIndex {
  type: 'data-index';
  data: {
    content: {
      summary: {
        title: string;
        description: string;
        severity: string;
        confidence: number;
        timeframe: string;
        impact: string;
      };
    };
  };
}

export interface DataRCA {
  type: 'data-rca';
  data: {
    content: {
      incident: {
        id: string;
        title: string;
        description: string;
        severity: string;
        detected_at: string;
        resolved_at: string | null;
        duration_minutes: number;
      };
      possible_solutions: Array<{
        id: string;
        type: 'immediate' | 'short_term' | 'long_term';
        title: string;
        description: string;
        effort: string;
        confidence: number;
        auto_fixable: boolean;
        solution_type: string;
        markdown_content: string;
      }>;
      contextual_ctas: {
        rca_level: Array<{
          id: string;
          type: string;
          label: string;
          description: string;
          available: boolean;
          condition: string;
        }>;
      };
    };
  };
}

export interface DataSolution {
  type: 'data-solution';
  data: {
    artifact_id: string;
    content: {
      solution_id: string;
      markdown_content: string;
      contextual_ctas: Array<{
        id: string;
        type: string;
        label: string;
        description: string;
        available: boolean;
        condition: string;
      }>;
    };
  };
}
