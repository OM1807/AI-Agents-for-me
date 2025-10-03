// ========================================
// PROJECT TYPES
// ========================================

export type OutputConfigType = {
  type: string;
  contents: string[];
};

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Planning' | 'On Hold' | 'Completed';
  progress: number;
  team: string[];
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  tags: string[];
}

export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Draft' | 'Review' | 'Approved' | 'Rejected';
  assignee?: string;
  dueDate?: string;
  tags: string[];
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
  }>;
}

export interface ApiSpec {
  id: string;
  name: string;
  type: 'file' | 'url';
  source: string; // File content or URL
  uploadedAt: string;
  size?: number;
  version?: string;
  specType?: string; // e.g., 'OAS 3.1', 'Swagger 2.0'
  description?: string;
  path?: string; // e.g., '/api/v1/openapi.json'
}

export interface ApiSpecState {
  specs: ApiSpec[];
  selectedSpecs: string[];
}

export interface ApiTestCase {
  id: string;
  name: string;
  type: 'file' | 'url';
  source: string; // File content or URL
  uploadedAt: string;
  size?: number;
}

export interface TestCasesState {
  testCases: ApiTestCase[];
  selectedTestCases: string[];
}

export interface ApiFramework {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ApiFrameworkState {
  frameworks: ApiFramework[];
}
