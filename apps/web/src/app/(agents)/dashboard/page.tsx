'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { LineChartIcon } from '@/components/icons/LineChartIcon';
import {
  ActiveProjectIcon,
  DevelopmentIcon,
  ProductManagementIcon,
  PromptLibraryIcon,
  QualityAssuranceIcon,
  TestCoverageIcon,
  TimeSavedIcon,
} from '@/components/icons/Dashboard/index';
import {
  DevelopmentBackground,
  QualityAssuranceBackground,
  ProductManagementBackground,
  PromptLibraryBackground,
} from '@/components/icons/Dashboard/backgrounds';

// Metrics data using AgentCard
const DASHBOARD_METRICS = [
  {
    id: 'code_quality',
    heading: 'Code Quality',
    description: '85%',
    icon: <LineChartIcon className='h-8 w-8' />,
    iconBg: 'bg-blue-500',
    textColor: 'text-blue-900',
  },
  {
    id: 'test_coverage',
    heading: 'Test Coverage',
    description: '92%',
    icon: <TestCoverageIcon className='h-8 w-8' />,
    iconBg: 'bg-green-500',
    textColor: 'text-green-600',
  },
  {
    id: 'active_projects',
    heading: 'Active Projects',
    description: '24',
    icon: <ActiveProjectIcon className='h-8 w-8' />,
    iconBg: 'bg-purple-500',
    textColor: 'text-violet-500',
  },
  {
    id: 'time_saved',
    heading: 'Time Saved',
    description: '15 hours',
    icon: <TimeSavedIcon className='h-8 w-8' />,
    iconBg: 'bg-orange-500',
    textColor: 'text-amber-500',
  },
];

const DashboardPage = () => {
  const router = useRouter();
  const { name, isHydrated } = useUser();

  // Get first name from full name, fallback to 'User' if no name
  const getDisplayName = () => {
    if (!name) return 'User';
    return name.split(' ')[0]; // Get first name only
  };

  return (
    <div className='space-y-8'>
      {/* Welcome Section */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          {isHydrated ? `Welcome back ${getDisplayName()}` : 'Welcome back!'}
        </h1>
        <p className='text-muted-foreground'>
          Your comprehensive SDLC automation and intelligence platform.
        </p>
      </div>

      {/* Metrics Cards using AgentCard */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {DASHBOARD_METRICS.map(metric => (
          <div
            key={metric.id}
            className='group relative rounded-xl border-2 border-transparent bg-white p-6 shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-gray-900'
          >
            {/* Icon with colored background */}
            <div className='mb-4'>
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${metric.iconBg}`}
              >
                <div className='text-white'>{metric.icon}</div>
              </div>
            </div>

            {/* Heading */}
            <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100'>
              {metric.heading}
            </h3>

            {/* Large Colored Description */}
            <p
              className={`text-2xl leading-tight font-black ${metric.textColor}`}
            >
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* SDLC Modules Section */}
      <div className='space-y-6'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            SDLC Modules
          </h2>
          <div className='text-center'>
            <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100'>
              Choose Your SDLC Focus Area
            </h3>
            <p className='text-muted-foreground text-sm'>
              Start with the module that matters most to your role, or explore
              the complete platform
            </p>
          </div>
        </div>

        {/* SDLC Modules - Card Structure */}
        <div className='grid gap-8 md:grid-cols-2'>
          {/* Development Module Card */}
          <div
            className='group cursor-pointer overflow-hidden rounded-xl border-2 border-transparent bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-gray-900'
            onClick={() => router.push('/development')}
          >
            {/* Background Development SVG - Top Section */}
            <div className='h-48 w-full overflow-hidden'>
              <DevelopmentBackground className='h-full w-full' />
            </div>

            {/* Content Section - White Background */}
            <div className='bg-white p-6 dark:bg-gray-900'>
              {/* Icon and Title */}
              <div className='mb-4 flex items-center gap-2'>
                <DevelopmentIcon className='h-6 w-6 text-blue-600' />
                <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                  Development
                </h3>
              </div>

              {/* Description */}
              <p className='mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400'>
                AI-powered code reviews, Documentation, intelligent code
                generation, and comprehensive repository management
              </p>

              {/* Key Features Section */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
                  Key Features
                </h4>

                <div className='flex flex-wrap gap-2'>
                  <span className='rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800'>
                    Smart Code Review
                  </span>
                  <span className='rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800'>
                    AI Generation
                  </span>
                  <span className='rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800'>
                    Repository Management
                  </span>
                </div>

                {/* Integration Lines */}
                <div className='mt-4 space-y-1'>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>🔗</span>
                    <span>Integration with GitHub, GitLab, Bitbucket</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>⚡</span>
                    <span>Real-time code analysis & suggestions</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>📝</span>
                    <span>Automated documentation generation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Assurance Module Card */}
          <div
            className='group cursor-pointer overflow-hidden rounded-xl border-2 border-transparent bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-gray-900'
            onClick={() => router.push('/quality-assurance')}
          >
            {/* Background QA SVG - Top Section */}
            <div className='h-48 w-full overflow-hidden'>
              <QualityAssuranceBackground className='h-full w-full' />
            </div>

            {/* Content Section - White Background */}
            <div className='bg-white p-6 dark:bg-gray-900'>
              {/* Icon and Title */}
              <div className='mb-4 flex items-center gap-2'>
                <QualityAssuranceIcon className='h-6 w-6 text-purple-600' />
                <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                  Quality Assurance
                </h3>
              </div>

              {/* Description */}
              <p className='mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400'>
                Automated test generation, intelligent test execution, and
                comprehensive defect management
              </p>

              {/* Key Features Section */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
                  Key Features
                </h4>

                <div className='flex flex-wrap gap-2'>
                  <span className='rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800'>
                    AI Test Generation
                  </span>
                  <span className='rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800'>
                    Automated Execution
                  </span>
                  <span className='rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800'>
                    Defect Tracking
                  </span>
                </div>

                {/* Integration Lines */}
                <div className='mt-4 space-y-1'>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>🔗</span>
                    <span>Integration with Jira, TestRail, Selenium</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>⚡</span>
                    <span>Bug Report Analyzer</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>🧪</span>
                    <span>Performance and security testing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Management Module Card */}
          <div
            className='group cursor-pointer overflow-hidden rounded-xl border-2 border-transparent bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-gray-900'
            onClick={() => router.push('/product-management')}
          >
            {/* Background Product Management SVG - Top Section */}
            <div className='h-48 w-full overflow-hidden'>
              <ProductManagementBackground className='h-full w-full' />
            </div>

            {/* Content Section - White Background */}
            <div className='bg-white p-6 dark:bg-gray-900'>
              {/* Icon and Title */}
              <div className='mb-4 flex items-center gap-2'>
                <ProductManagementIcon className='h-6 w-6 text-green-600' />
                <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                  Product Management
                </h3>
              </div>

              {/* Description */}
              <p className='mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400'>
                Transform requirements into actionable tickets with AI-powered
                analysis and intelligent project planning
              </p>

              {/* Key Features Section */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
                  Key Features
                </h4>

                <div className='flex flex-wrap gap-2'>
                  <span className='rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800'>
                    Requirements Analysis
                  </span>
                  <span className='rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800'>
                    Ticket Generation
                  </span>
                  <span className='rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800'>
                    Project Planning
                  </span>
                </div>

                {/* Integration Lines */}
                <div className='mt-4 space-y-1'>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>🔗</span>
                    <span>Integration with Jira, Confluence, Notion</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>📋</span>
                    <span>Automated ticket creation & prioritization</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>📊</span>
                    <span>Sprint planning & backlog management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Library Module Card */}
          <div
            className='group cursor-pointer overflow-hidden rounded-xl border-2 border-transparent bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-gray-900'
            onClick={() => router.push('/prompt-library')}
          >
            {/* Background Prompt Library SVG - Top Section */}
            <div className='h-48 w-full overflow-hidden'>
              <PromptLibraryBackground className='h-full w-full' />
            </div>

            {/* Content Section - White Background */}
            <div className='bg-white p-6 dark:bg-gray-900'>
              {/* Icon and Title */}
              <div className='mb-4 flex items-center gap-2'>
                <PromptLibraryIcon className='h-6 w-6 text-orange-600' />
                <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                  Prompt Library
                </h3>
              </div>

              {/* Description */}
              <p className='mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400'>
                Discover and utilize curated AI prompts for various development
                and business scenarios
              </p>

              {/* Key Features Section */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
                  Key Features
                </h4>

                <div className='flex flex-wrap gap-2'>
                  <span className='rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800'>
                    Curated Prompts
                  </span>
                  <span className='rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800'>
                    Custom Templates
                  </span>
                  <span className='rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800'>
                    AI Optimization
                  </span>
                </div>

                {/* Integration Lines */}
                <div className='mt-4 space-y-1'>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>📚</span>
                    <span>Categorized prompt collections</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>🎯</span>
                    <span>Context-aware suggestions</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <span className='mr-2'>⭐</span>
                    <span>Community-driven ratings & reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
