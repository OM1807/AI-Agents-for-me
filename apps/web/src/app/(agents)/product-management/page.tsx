'use client';
import { AgentCard } from '@/components/shared/AgentCard';
import {
  SprintPlanningAgent,
  RiskPlanningAgent,
  RetrospectiveTrackerAgent,
  StakeholderCommunicationAgent,
  ProjectHealthMonitoringAgent,
  RequirementtoTicketAgent,
} from '@/components/icons/ProductManagement';
import { useEffect } from 'react';
import { useProject } from '@/hooks/useProject';

const PRODUCT_MANAGEMENT_TOOLS = [
  {
    id: 'requirement_to_ticket_agent',
    heading: 'Requirement to Ticket Agent',
    description: 'Convert PRDs and requirements directly into Jira tickets.',
    icon: <RequirementtoTicketAgent className='h-6 w-6' />,
    navigateTo: '/product-management/requirement-to-ticket-agent',
    agentType: 'requirements_to_tickets',
  },
  {
    id: 'sprint_planning_agent',
    heading: 'Sprint Planning Agent',
    description:
      'Assist in workload estimation and sprint planning with AI insights.',
    icon: <SprintPlanningAgent className='h-6 w-6' />,
    navigateTo: '/product-management/sprint-planning-agent',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'risk_planning_agent',
    heading: 'Risk Planning Agent',
    description: 'Identify and mitigate project risks proactively.',
    icon: <RiskPlanningAgent className='h-6 w-6' />,
    navigateTo: '/product-management/risk-planning-agent',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'status_reporting_agent',
    heading: 'Status Reporting Agent',
    description: 'Auto-generate real-time project status updates.',
    icon: <RetrospectiveTrackerAgent className='h-6 w-6' />,
    navigateTo: '/product-management/retrospective-tracker-agent',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'retrospective_tracker_agent',
    heading: 'Retrospective Tracker Agent',
    description:
      'Capture action items from retrospectives and track follow-ups.',
    icon: <RetrospectiveTrackerAgent className='h-6 w-6' />,
    navigateTo: '/product-management/stakeholder-communication-agent',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'stakeholder_communication_agent',
    heading: 'Stakeholder Communication Agent',
    description: 'Automate stakeholder updates with tailored insights',
    icon: <StakeholderCommunicationAgent className='h-6 w-6' />,
    navigateTo: '/product-management/project-health-monitoring-agent',
    badgeStatus: 'COMING SOON' as const,
  },
  {
    id: 'project_health_monitoring_agent',
    heading: 'Project Health Monitoring Agent',
    description: 'Predict and track overall project health with AI metrics.',
    icon: <ProjectHealthMonitoringAgent className='h-6 w-6' />,
    navigateTo: '/product-management/requirement-to-ticket-agent',
    badgeStatus: 'COMING SOON' as const,
  },
];

export default function ProductManagementPage() {
  const { resetProject } = useProject();

  // Reset project store when page loads
  useEffect(() => {
    resetProject();
    sessionStorage.removeItem('sessionId');
  }, [resetProject]);

  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='space-y-4'>
        <p className='text-muted-foreground text-sm'>
          Automated test generation, execution, and comprehensive defect
          management
        </p>
      </div>

      {/* Product Management Agents Grid */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {PRODUCT_MANAGEMENT_TOOLS.map(tool => (
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
