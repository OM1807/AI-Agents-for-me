import {
  Target,
  Play,
  Bug,
  TrendingUp,
  TestTube,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';

export interface MetricData {
  id: string;
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
}

export interface FeatureData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  actionText?: string;
}

export interface TestRunData {
  id: string;
  name: string;
  status: 'Passed' | 'Failed' | 'Running' | 'Pending';
  duration: string;
  coverage: number;
}

export const QA_METRICS: MetricData[] = [
  {
    id: 'test-coverage',
    value: '92%',
    label: 'Test Coverage',
    icon: Target,
    iconBgColor: 'bg-green-100 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'tests-executed',
    value: '1,247',
    label: 'Tests Executed',
    icon: Play,
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'bugs-found',
    value: '23',
    label: 'Bugs Found',
    icon: Bug,
    iconBgColor: 'bg-orange-100 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'pass-rate',
    value: '95%',
    label: 'Pass Rate',
    icon: TrendingUp,
    iconBgColor: 'bg-purple-100 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
];

export const QA_FEATURES: FeatureData[] = [
  {
    id: 'intelligent-test-generation',
    title: 'Intelligent Test Case Generation',
    subtitle: 'Generate Test Cases from PRD, JIRA & Others',
    description:
      'Auto-generate functional and scenario-based test cases using structured documents and project tracking tools',
    icon: TestTube,
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    actionText: 'Start Generating Test Cases',
  },
  {
    id: 'test-execution',
    title: 'Test Execution',
    subtitle: 'Automated runs',
    description: 'Execute test suites with intelligent scheduling',
    icon: PlayCircle,
    iconBgColor: 'bg-green-100 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'defect-management',
    title: 'Defect Management',
    subtitle: 'Issue tracking',
    description: 'Track and manage defects with AI classification',
    icon: AlertTriangle,
    iconBgColor: 'bg-orange-100 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
];

export const RECENT_TEST_RUNS: TestRunData[] = [
  {
    id: 'frontend-unit-tests',
    name: 'Frontend Unit Tests',
    status: 'Passed',
    duration: '2m 34s',
    coverage: 94,
  },
  {
    id: 'api-integration-tests',
    name: 'API Integration Tests',
    status: 'Passed',
    duration: '5m 12s',
    coverage: 89,
  },
  {
    id: 'e2e-user-flows',
    name: 'E2E User Flows',
    status: 'Failed',
    duration: '8m 45s',
    coverage: 76,
  },
];
