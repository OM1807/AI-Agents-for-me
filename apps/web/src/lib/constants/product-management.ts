import {
  Target,
  Calendar,
  Users,
  BarChart3,
  Clipboard,
  Map,
  Users2,
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
}

export const PROJECT_METRICS: MetricData[] = [
  {
    id: 'active-projects',
    value: '24',
    label: 'Active Projects',
    icon: Target,
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'on-time-delivery',
    value: '87%',
    label: 'On-time Delivery',
    icon: Calendar,
    iconBgColor: 'bg-green-100 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'requirements',
    value: '156',
    label: 'Requirements',
    icon: Users,
    iconBgColor: 'bg-purple-100 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'stakeholder-satisfaction',
    value: '92%',
    label: 'Stakeholder Satisfaction',
    icon: BarChart3,
    iconBgColor: 'bg-orange-100 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
];

export const PROJECT_FEATURES: FeatureData[] = [
  {
    id: 'requirements-analysis',
    title: 'Requirements Analysis',
    subtitle: 'AI-powered insights',
    description: 'Analyze and prioritize requirements with AI assistance',
    icon: Clipboard,
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'roadmap-planning',
    title: 'Roadmap Planning',
    subtitle: 'Strategic planning',
    description:
      'Create and manage product roadmaps with timeline optimization',
    icon: Map,
    iconBgColor: 'bg-purple-100 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'stakeholder-management',
    title: 'Stakeholder Management',
    subtitle: 'Communication hub',
    description: 'Coordinate with stakeholders and track alignment',
    icon: Users2,
    iconBgColor: 'bg-green-100 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
];

export interface ProjectData {
  id: string;
  title: string;
  status: 'In Progress' | 'Planning' | 'Review' | 'Completed' | 'On Hold';
  progress: number;
  team: string;
}

export const CURRENT_PROJECTS: ProjectData[] = [
  {
    id: 'mobile-app-redesign',
    title: 'Mobile App Redesign',
    status: 'In Progress',
    progress: 65,
    team: 'Design Team',
  },
  {
    id: 'api-v2-development',
    title: 'API v2.0 Development',
    status: 'Planning',
    progress: 25,
    team: 'Backend Team',
  },
  {
    id: 'user-dashboard-enhancement',
    title: 'User Dashboard Enhancement',
    status: 'Review',
    progress: 90,
    team: 'Frontend Team',
  },
];

const EPICS_BULLET_POINTS = [
  {
    text: 'Title: eg. TC-LOGIN-001',
  },
  {
    text: 'Epic Name: eg. Verify login with valid credentials',
  },
  {
    text: 'Description: eg. Ensure user can successfully log in with a valid username and password.',
  },
  {
    text: 'Acceptance Criteria: List of high-level deliverables or conditions of success.',
  },
  {
    text: 'Timeline / Milestones: Key target dates.eg. Important, Not important etc.',
  },
];

const STORIES_BULLET_POINTS = [
  {
    text: 'Title: eg. TC-LOGIN-001',
  },
  {
    text: 'Description:',
    subPoints: [
      {
        text: 'Context: Background details or problem statement.',
      },

      {
        text: 'Requirements / Acceptance Criteria: Clearly list what must be delivered.',
      },
      {
        text: 'Steps to Reproduce (for bugs): Numbered list.',
      },
      {
        text: 'Expected Result:',
      },
      {
        text: 'Actual Result:',
      },
    ],
  },
];

const TASKS_BULLET_POINTS = [
  {
    text: 'Title: eg. TC-LOGIN-001',
  },
  {
    text: 'Description:',
    subPoints: [
      {
        text: 'Objective: Short explanation of the work to be done.',
      },

      {
        text: 'Requirements / Acceptance Criteria: Clearly list what must be delivered.',
        subPoints: [
          {
            text: 'Steps 1',
          },
          {
            text: 'Steps 2',
          },
        ],
      },
      {
        text: 'Acceptance Criteria:',
        subPoints: [
          {
            text: 'Steps 1',
          },
          {
            text: 'Steps 2',
          },
        ],
      },
    ],
  },
];

export const GENERAL_INFO_BULLET_POINTS = {
  epic: EPICS_BULLET_POINTS,
  story: STORIES_BULLET_POINTS,
  task: TASKS_BULLET_POINTS,
};
