import {
  CheckCircle,
  Brain,
  Search,
  MessageSquare,
  Scale,
  CheckCircle2,
  Code,
  Briefcase,
} from 'lucide-react';

export type PromptCategory = 'All' | 'Development' | 'Product Management';

export interface CategoryFilter {
  id: PromptCategory;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PromptData {
  id: string;
  title: string;
  category: Exclude<PromptCategory, 'All'>;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  content: string;
}

export const PROMPT_CATEGORIES: CategoryFilter[] = [
  {
    id: 'All',
    label: 'All',
  },
  {
    id: 'Development',
    label: 'Development',
    icon: Code,
  },
  {
    id: 'Product Management',
    label: 'Product Management',
    icon: Briefcase,
  },
];

export const PROMPT_LIBRARY: PromptData[] = [
  {
    id: 'enforce-coding-guidelines',
    title: 'Validate Coding Conventions',
    category: 'Development',
    description:
      'Assess implementation against established style guidelines and structural principles.',
    icon: CheckCircle,
    iconBgColor: 'bg-green-100 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    content: `Analyze the following code for adherence to our team's coding standards (naming conventions, formatting, modularity, comments). Suggest improvements and rate the code on a scale of 1-10 for maintainability.`,
  },
  {
    id: 'generate-module-architecture',
    title: 'Reconstruct System Design',
    category: 'Development',
    description:
      'Derive architectural patterns from existing implementations without prior documentation.',
    icon: Brain,
    iconBgColor: 'bg-pink-100 dark:bg-pink-900/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
    content: `Reverse engineer the architecture of this module. Output a hierarchy of components, services, and dependencies in markdown format. Identify reusable blocks and legacy patterns if any.`,
  },
  {
    id: 'detect-code-smells',
    title: 'Identify Technical Debt',
    category: 'Development',
    description:
      'Surface structural weaknesses and maintainability risks in source code.',
    icon: Search,
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    content: `Scan the provided codebase for common code smells (e.g., long methods, large classes, duplication, unclear naming). List them with reasons and suggest refactoring techniques.`,
  },
  {
    id: 'prd-summarizer',
    title: 'Specification Digest',
    category: 'Product Management',
    description:
      'Extract core objectives and deliverables from detailed requirement documents.',
    icon: MessageSquare,
    iconBgColor: 'bg-gray-100 dark:bg-gray-900/20',
    iconColor: 'text-gray-600 dark:text-gray-400',
    content: `Summarize the following product requirements document into key objectives, user stories, KPIs, and open questions. Highlight anything ambiguous or missing.`,
  },
  {
    id: 'feature-comparison-analyzer',
    title: 'Option Evaluation Framework',
    category: 'Product Management',
    description:
      'Compare proposed capabilities across multiple decision factors.',
    icon: Scale,
    iconBgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    content: `Compare the two feature specifications below based on user value, engineering effort, and business impact. Recommend one with clear reasoning.`,
  },
  {
    id: 'feedback-to-feature-ideas',
    title: 'Insight Extraction Tool',
    category: 'Product Management',
    description:
      'Convert unstructured user input into prioritized enhancement opportunities.',
    icon: CheckCircle2,
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    content: `Analyze this raw user feedback and extract potential feature ideas. Group them by theme, prioritize by impact/feasibility, and tag them with appropriate modules.`,
  },
];
