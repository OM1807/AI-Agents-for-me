'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { TestCasesModal } from './TestCasesModal';
import { TestCasesList } from './TestCasesList';
import { TestCasesComponentProps } from '@/types/agent-api-suite';
import { FileIcon, JiraIcon } from '@/components/icons';
import { useProject } from '@/hooks/useProject';
import { useOAuth } from '@/hooks/useOAuth';
import { JiraTicketsModal } from '@/components/shared/JiraTicketsModal';

export function ConnectTestCases({ className }: TestCasesComponentProps) {
  const [showTestCasesModal, setShowTestCasesModal] = useState(false);
  const {
    testCases,
    resetTestCases,
    docsjira,
    setDocsjira,
    removeTestCase,
    toggleTestCase,
  } = useProject();
  const { atlassianMCPConnection, resetAtlassianMCPConnection } = useOAuth();
  const isConnected =
    testCases.testCases.length > 0 || atlassianMCPConnection.isConnected;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJiraTicketsModal, setShowJiraTicketsModal] = useState(false);

  const handleDisconnect = () => {
    setIsRefreshing(true);
    resetTestCases();
    if (atlassianMCPConnection.isConnected) {
      resetAtlassianMCPConnection();
    }
  };

  const handleConnect = () => {
    setShowTestCasesModal(true);
  };

  const handleManageJiraTickets = () => {
    setShowJiraTicketsModal(true);
  };

  const handleJiraTicketsConfirm = (selectedTickets: any[]) => {
    setDocsjira({
      tickets: selectedTickets,
      selectedTickets: selectedTickets.map((ticket: any) => ticket.key),
    });
    setShowJiraTicketsModal(false);
  };

  if (!isConnected) {
    return (
      <div className={className}>
        <SectionWrapper
          icon={<FileIcon className='h-4 w-4' />}
          title='Connect Test Cases'
        >
          <div className='space-y-6 rounded-lg border border-dashed border-gray-300 p-6'>
            <div className='flex flex-col items-center justify-center py-8'>
              <div className='space-y-4 text-center'>
                <div className='mx-auto flex h-13 w-13 items-center justify-center rounded-full'>
                  <FileIcon className='h-10 w-10 text-gray-600' />
                </div>
                <div>
                  <h3 className='font-outfit text-xl font-medium text-gray-900'>
                    Add Test Cases Source
                  </h3>
                  <p className='font-outfit mt-1 text-sm text-gray-500'>
                    Link or upload Test Cases or connect your Test Cases Data
                    Source to help the AI understand what to automate tests.
                  </p>
                </div>
                <Button
                  onClick={handleConnect}
                  className='h-[48px] w-[290px] bg-[#11054C] px-6 py-2 text-white hover:bg-[#11054C]/90'
                >
                  Connect Test Cases
                </Button>
              </div>
            </div>
          </div>

          <TestCasesModal
            open={showTestCasesModal}
            onOpenChange={setShowTestCasesModal}
          />
        </SectionWrapper>
      </div>
    );
  }

  return (
    <div className={className}>
      <SectionWrapper
        icon={<FileIcon className='h-4 w-4' />}
        title='Connect Test Cases'
      >
        <div className='space-y-4'>
          {/* Connection Header */}
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              {testCases.testCases.length > 0 && (
                <Button
                  onClick={handleConnect}
                  variant='outline'
                  size='sm'
                  className='border-blue-200 bg-white text-blue-600 hover:bg-blue-50'
                >
                  Add More Files
                </Button>
              )}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleDisconnect}
              className='border-red-200 bg-white text-red-600 hover:bg-red-50'
            >
              Disconnect
            </Button>
          </div>

          {/* Loading state */}
          {isRefreshing && (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin' />
              <span className='ml-2'>Refreshing test cases...</span>
            </div>
          )}

          {/* Uploaded Test Case Files */}
          {!isRefreshing && testCases.testCases.length > 0 && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium text-gray-900'>
                  Uploaded Test Case Files
                </h4>
                <Badge variant='secondary' className='text-xs'>
                  {testCases.selectedTestCases.length} of{' '}
                  {testCases.testCases.length} selected
                </Badge>
              </div>
              <TestCasesList
                testCases={testCases.testCases}
                selectedTestCases={testCases.selectedTestCases}
                onToggleTestCase={toggleTestCase}
                onRemoveTestCase={removeTestCase}
              />
            </div>
          )}

          {/* Jira Test Cases */}
          {!isRefreshing && atlassianMCPConnection.isConnected && (
            <div className='space-y-4'>
              <h4 className='text-sm font-medium text-gray-900'>
                Jira Test Cases
              </h4>
              {docsjira.selectedTickets.length === 0 ? (
                <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-6'>
                  <div className='text-center'>
                    <JiraIcon className='mx-auto h-8 w-8 text-gray-400' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900'>
                      No test case tickets selected.
                    </h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      Click Manage to select Jira tickets for test cases.
                    </p>
                    <Button
                      onClick={handleManageJiraTickets}
                      className='mt-4'
                      variant='outline'
                    >
                      Select Jira Tickets
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  {docsjira.tickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className='flex items-center justify-between rounded-lg border border-gray-200 p-4'
                    >
                      <div className='flex items-center gap-3'>
                        <JiraIcon className='h-5 w-5 text-blue-600' />
                        <div>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant='outline'
                              className='border-blue-200 bg-blue-50 text-xs text-blue-700'
                            >
                              {ticket.issueType || 'Story'}
                            </Badge>
                            <span className='text-sm font-medium text-gray-900'>
                              {ticket.key}
                            </span>
                          </div>
                          <h4 className='mt-1 text-base font-medium text-gray-900'>
                            {ticket.summary || ticket.title}
                          </h4>
                          {ticket.description && (
                            <p className='mt-1 text-sm text-gray-600'>
                              {ticket.description.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        Test Case
                      </Badge>
                    </div>
                  ))}

                  {/* Show message if no results found */}
                  {docsjira.tickets.length === 0 && (
                    <div className='py-8 text-center'>
                      <p className='text-gray-500'>No tickets found</p>
                    </div>
                  )}

                  <div className='flex justify-end'>
                    <Button
                      onClick={handleManageJiraTickets}
                      variant='outline'
                      size='sm'
                    >
                      Manage Selection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <TestCasesModal
          open={showTestCasesModal}
          onOpenChange={setShowTestCasesModal}
        />

        {/* Jira Tickets Modal */}
        <JiraTicketsModal
          isOpen={showJiraTicketsModal}
          onClose={() => setShowJiraTicketsModal(false)}
          onConfirm={handleJiraTicketsConfirm}
          type='incident'
        />
      </SectionWrapper>
    </div>
  );
}
