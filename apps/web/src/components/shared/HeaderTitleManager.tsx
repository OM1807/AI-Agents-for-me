'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useHeader } from '@/hooks/useHeader';

// Define route to title mapping
const routeTitleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/development': 'Your AI Agents for the Development Journey',
  '/development/code-reviewer-agent': 'Code Reviewer Configuration Panel',
  '/development/root-cause-analysis': 'Root Cause Analysis Configuration Panel',
  '/development/code-understanding':
    'Documentation & Knowledge Configuration Panel',
  '/quality-assurance': 'Your AI Agents for the Quality Assurance Journey',
  '/quality-assurance/test-gen-ai-agent': 'TestGen AI Configuration Panel',
  '/quality-assurance/api-testing-suite-agent':
    'API Testing Suite Agent Configuration Panel',
  '/quality-assurance/test-execution-agent':
    'Test Execution Configuration Panel',
  '/quality-assurance/defect-management-agent':
    'Defect Management Configuration Panel',
  '/product-management': 'Your AI Agent for the Product Management Journey',
  '/product-management/requirement-to-ticket-agent':
    'Requirements To Ticket Configuration Panel',
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
