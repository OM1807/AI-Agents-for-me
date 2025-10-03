'use client';
import { AgentCard } from '@/components/shared/AgentCard';
import {
  TestGenAIAgentIcon,
  TestExecutionAgentIcon,
  DefectManagementAgentIcon,
  SelfHealingTestSuiteIcon,
  APITestingSuiteIcon,
  PerformanceTestingIcon,
  E2ETestSuiteBuilderIcon,
  SyntheticDataGeneratorIcon,
} from '@/components/icons/QualtiyAssurance';

const QUALITY_ASSURANCE_TOOLS = [
  {
    id: 'test_gen_ai_agent',
    heading: 'TestGen AI Agent',
    description:
      'Auto-generate functional and scenario-based test cases using structured documents and project tracking tools',
    icon: <TestGenAIAgentIcon className='h-8 w-8' />,
    navigateTo: '/quality-assurance/test-gen-ai-agent',
    agentType: 'test_case_generation',
  },
  {
    id: 'api_testing_suite_agent',
    heading: 'API Testing Suite Agent',
    description: 'Generate automated API test suites with validations.',
    icon: <APITestingSuiteIcon className='h-8 w-8' />,
    navigateTo: '/quality-assurance/api-testing-suite-agent',
    agentType: 'api_testing_suite',
  },
  {
    id: 'test_execution_agent',
    heading: 'Test Execution Agent',
    description:
      'Ensure your code adheres to best practices and team-defined rules.',
    icon: <TestExecutionAgentIcon className='h-8 w-8' />,
    navigateTo: '/quality-assurance/test-execution-agent',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'defect_management_agent',
    heading: 'Defect Management Agent',
    description: 'AI-powered pull request reviews with detailed feedback.',
    icon: <DefectManagementAgentIcon className='h-8 w-8' />,
    navigateTo: '/quality-assurance/defect-management-agent',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'self_healing_test_suite_agent',
    heading: 'Self-Healing Test Suite Agent',
    description: 'AI-powered self-healing of broken test scripts.',
    icon: <SelfHealingTestSuiteIcon className='h-8 w-8' />,
    navigateTo: '/quality-assurance/self-healing-test-suite',
    badgeStatus: 'COMING SOON' as const,
  },

  {
    id: 'performance_testing_agent',
    heading: 'Performance Testing Agent',
    description: 'Simulate load and optimize system performance.',
    icon: <PerformanceTestingIcon className='h-8 w-8' />,
    navigateTo: '/quality-assurance/performance-testing',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'e2e_test_suite_builder_agent',
    heading: 'E2E Test Suite Builder Agent',
    description: 'Build end-to-end test suites with smart locators.',
    icon: <E2ETestSuiteBuilderIcon className='h-8 w-8' />,
    navigateTo: '/quality-assurance/e2e-test-suite-builder',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'synthetic_data_generator_agent',
    heading: 'Synthetic Data Generator Agent',
    description: 'Generate test data that mimics real-world usage safely.',
    icon: <SyntheticDataGeneratorIcon className='h-8 w-8' />,
    navigateTo: '/quality-assurance/synthetic-data-generator',
    badgeStatus: 'COMING SOON' as const,
  },
];

export default function QualityAssurancePage() {
  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='space-y-4'>
        <p className='text-muted-foreground text-sm'>
          Automated test generation, execution, and comprehensive defect
          management
        </p>
      </div>

      {/* Quality Assurance Agents Grid */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {QUALITY_ASSURANCE_TOOLS.map(tool => (
          <AgentCard
            key={tool.id}
            icon={tool.icon}
            heading={tool.heading}
            description={tool.description}
            navigateTo={tool.navigateTo}
            badgeStatus={tool.badgeStatus}
            agentType={tool.agentType}
          />
        ))}
      </div>
    </div>
  );
}
