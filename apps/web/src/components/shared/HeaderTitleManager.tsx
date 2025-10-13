'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useHeader } from '@/hooks/useHeader';

// Define route to title mapping
const routeTitleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/development': 'Engineering Automation Hub',
  '/development/code-reviewer-agent': 'Automated Code Review Workspace',
  '/development/root-cause-analysis': 'Incident Investigation Center',
  '/development/code-understanding': 'Codebase Intelligence Studio',
  '/quality-assurance': 'Testing & Validation Suite',
  '/quality-assurance/test-gen-ai-agent': 'Intelligent Test Generation Console',
  '/quality-assurance/api-testing-suite-agent': 'API Validation Workshop',
  '/quality-assurance/test-execution-agent': 'Test Runner Command Center',
  '/quality-assurance/defect-management-agent': 'Issue Tracking Hub',
  '/product-management': 'Product Strategy Workspace',
  '/product-management/requirement-to-ticket-agent':
    'Requirement Conversion Studio',
  '/prompt-library': 'Prompt Library',
  '/help': 'Help & Support',
  '/settings': 'Settings',
  '/login': 'Login',
};

export function HeaderTitleManager() {
  const pathname = usePathname();
  const { setTitle } = useHeader();

  useEffect(() => {
    // First try exact match
    if (routeTitleMap[pathname]) {
      setTitle(routeTitleMap[pathname]);
      return;
    }

    // Then try to find a match by checking if the current path starts with a known route
    const matchedRoute = Object.keys(routeTitleMap)
      .filter(route => route !== '/')
      .find(route => pathname.startsWith(route));

    if (matchedRoute) {
      setTitle(routeTitleMap[matchedRoute]);
    }
  }, [pathname, setTitle]);

  // This component doesn't render anything
  return null;
}

// mcp__atlassian__getPagesInConfluenceSpace
// mcp__atlassian__getConfluenceSpaces
