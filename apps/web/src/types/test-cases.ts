// ========================================
// TEST CASE TYPES
// ========================================

export interface TestCase {
  id: string;
  title: string;
  type: 'functional' | 'edge' | 'negative' | 'regression';
  description: string;
  priority: string;
  environment: string;
  module: string;
  preconditions?: string[];
  test_steps?: Array<{
    step_id: string;
    action: string;
    test_data?: string;
    expected_result?: string;
  }>;
  steps?: Array<{
    step: number;
    action: string;
    test_data?: string | null;
    expected?: string;
  }>;
  expected_result?: string;
  expected_results?: string[];
}

export interface TestCaseSource {
  type: string;
  provider: string;
  properties: {
    key?: string;
    id?: string;
    url?: string;
    title: string;
  };
  test_case_index: Array<{
    id: string;
    title: string;
    type: string;
    file: string;
  }>;
}

export interface GroupedTestCases {
  functional: TestCase[];
  edge: TestCase[];
  negative: TestCase[];
  regression: TestCase[];
}

export interface SourceWithTestCases {
  source: TestCaseSource;
  artifactId: string;
  testCases: GroupedTestCases;
}

export interface DataItem {
  type: string;
  data: {
    artifact_type: string;
    actual_file_path: string;
    file_path: string;
    filename: string;
    content_type: string;
    artifact_id: string;
    content: TestCaseSource | TestCase;
  };
}

export interface TestRunData {
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  coverage: number;
  duration: string;
  tests: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}
