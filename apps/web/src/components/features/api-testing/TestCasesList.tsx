'use client';

import { TestCasesCard } from './TestCasesCard';
import { TestCasesListProps } from '@/types/agent-api-suite';

export function TestCasesList({
  testCases,
  selectedTestCases,
  onToggleTestCase,
  onRemoveTestCase,
}: TestCasesListProps) {
  return (
    <div className='space-y-3'>
      {testCases.map(testCase => (
        <TestCasesCard
          key={testCase.id}
          testCase={testCase}
          isSelected={selectedTestCases.includes(testCase.id)}
          onToggle={() => onToggleTestCase(testCase.id)}
          onRemove={() => onRemoveTestCase(testCase.id)}
        />
      ))}
    </div>
  );
}
