'use client';

import AgentCard from '@/components/shared/AgentCard';
import {
  CodeUnderstandingIcon,
  CodeReviewerIcon,
  GitHelperIcon,
  SecurityScannerIcon,
  ObservabilityAndDebuggingIcon,
} from '@/components/icons/Development';

const DEVELOPMENT_TOOLS = [
  {
    id: 'code_understanding_agent',
    heading: 'Documentation & Knowledge Agent',
    description: 'Visualize and document GitHub codebases with AI agents',
    icon: <CodeUnderstandingIcon className='h-8 w-8' />,
    navigateTo: '/development/code-understanding',
    agentType: 'code_analysis',
  },
  {
    id: 'code_reviewer_agent',
    heading: 'Code Reviewer Agent',
    icon: <CodeReviewerIcon className='h-8 w-8' />,
    description: 'Review your codebase instantly with intelligent AI agents.',
    navigateTo: '/development/code-reviewer-agent',
    agentType: 'code_reviewer',
  },
  {
    id: 'root_cause_analysis_agent',
    heading: 'Root Cause Analysis Agent',
    description:
      'Monitor logs, trace errors, and uncover root causes with AI-powered insights',
    icon: <ObservabilityAndDebuggingIcon className='h-8 w-8' />,
    navigateTo: '/development/root-cause-analysis',
    agentType: 'root_cause_analysis',
  },

  {
    id: 'git_helper_agent',
    heading: 'Git Helper Agent',
    description:
      'Simplify Git operations and resolve conflicts with AI guidance',
    icon: <GitHelperIcon className='h-8 w-8' />,
    navigateTo: '/development/git-helper',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'security_scanner_agent',
    heading: 'Security Scanner Agent',
    description: 'Detect vulnerabilities in code and suggest secure fixes',
    icon: <SecurityScannerIcon className='h-8 w-8' />,
    navigateTo: '/development/security-scanner',
    badgeStatus: 'COMING SOON' as const,
  },
];

export default function DevelopmentPage() {
  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='space-y-4'>
        <p className='text-muted-foreground text-sm'>
          Unlock the power of dedicated AI assistants to support every stage of
          your SDLC journey—from understanding code to automating standards
          checks, PR reviews, and Git operations.
        </p>
      </div>

      {/* Development Tools Grid */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {DEVELOPMENT_TOOLS.map(tool => (
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
