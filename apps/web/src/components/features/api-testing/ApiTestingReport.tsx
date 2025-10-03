'use client';

import React, { useState, useMemo } from 'react';
import { SummaryCards } from './SummaryCards';
import { ActionBar } from './ActionBar';
import { CodeGeneratedView } from './CodeGeneratedView';
import {
  formatApiTestingData,
  getProcessingStatus,
} from '@/lib/utils/api-testing-formatter';
import { useOAuth } from '@/hooks/useOAuth';
import type { Message } from 'ai';
import { ApiTestingReportProps, ViewType } from '@/types/agent-api-suite';

export function ApiTestingReport({ data, append }: ApiTestingReportProps) {
  const [activeView, setActiveView] = useState<ViewType>('code');
  const { gitHubConnection } = useOAuth();

  // Handle Create PR button click
  const handleCreatePR = () => {
    append({
      role: 'user',
      content: 'draft pr for generated api test cases',
    } as Message);
  };

  // Process stream data using the formatter
  const processedData = useMemo(() => {
    return formatApiTestingData(data);
  }, [data]);

  // Get processing status for loading states
  const processingStatus = useMemo(() => {
    return getProcessingStatus(data);
  }, [data]);

  return (
    <div className='h-full overflow-y-auto'>
      <div className='space-y-6'>
        {/* Summary Cards */}
        <SummaryCards
          testCasesAutomated={processedData.summary.testCasesAutomated}
          failed={processedData.summary.totalEndpointsCovered}
        />

        {/* Action Bar with Toggle and Create PR */}
        <ActionBar
          activeView={activeView}
          onViewChange={setActiveView}
          onCreatePR={handleCreatePR}
          showCreatePR={gitHubConnection.isConnected}
        />

        {/* Conditional Content Based on Toggle */}
        {/* {activeView === 'code' ? ( */}
        <CodeGeneratedView projects={processedData.projects} append={append} />
        {/* ) : ( */}
        {/* <AutomationReportTable
            data={processedData.automationReport}
            append={append}
          />
        )} */}

        {/* Loading State */}
        {!processingStatus.hasIndex && (
          <div className='py-8 text-center'>
            <p className='text-gray-500'>Loading API testing suite data...</p>
          </div>
        )}

        {/* Empty State */}
        {processingStatus.hasIndex && processedData.projects.length === 0 && (
          <div className='py-8 text-center'>
            <p className='text-gray-500'>No API testing data available.</p>
          </div>
        )}

        {/* Processing Status */}
        {processingStatus.hasIndex && !processingStatus.isComplete && (
          <div className='py-4 text-center'>
            <p className='text-sm text-gray-500'>
              Processing test files... ({processingStatus.testFilesCount}/
              {processingStatus.expectedTestFiles} completed)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
