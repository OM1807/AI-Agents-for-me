import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { type DataItem } from '@/lib/utils/requirements-formatter';
import {
  AlertTriangle,
  Clock,
  Users,
  Lightbulb,
  FilePenLine,
  ChevronDown,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { JiraIcon, ConfluenceIcon, GitIcon } from '@/components/icons';
import { ConfluenceSpaceSelector } from '@/components/features/chat/Helper/ConfluenceSpaceSelector';
import { GithubRepoSelector } from '@/components/features/chat/Helper/GithubRepoSelector';
import { JiraProjectSelector } from '@/components/features/chat/Helper/JiraProjectSelector';
import { JiraTicketSelector } from '@/components/features/chat/Helper/JiraTicketSelector';
import { DataIndex, DataRCA, DataSolution } from '@/types';

interface RCAAgentProps {
  data: DataItem[];
  isStreaming: boolean;
  append: (message: any) => void;
}

export function RCAAgent({ data, isStreaming, append }: RCAAgentProps) {
  const [activeTab, setActiveTab] = useState<
    'immediate' | 'short_term' | 'long_term'
  >('immediate');

  // Modal states
  const [showConfluenceSpaceModal, setShowConfluenceSpaceModal] =
    useState(false);
  const [showGithubRepoModal, setShowGithubRepoModal] = useState(false);
  const [showJiraProjectModal, setShowJiraProjectModal] = useState(false);
  const [showJiraTicketModal, setShowJiraTicketModal] = useState(false);

  // Parse and find the latest data-index, data-rca, and data-solutions
  const { latestIndex, latestRCA, solutionData } = useMemo(() => {
    const indexItems = data.filter(
      item => item.type === 'data-index'
    ) as DataIndex[];
    const rcaItems = data.filter(item => item.type === 'data-rca') as DataRCA[];
    const solutionItems = data.filter(
      item => item.type === 'data-solution'
    ) as DataSolution[];

    return {
      latestIndex: indexItems[indexItems.length - 1] || null,
      latestRCA: rcaItems[rcaItems.length - 1] || null,
      solutionData: solutionItems,
    };
  }, [data]);

  // Function to find extended solution data by solution ID
  const getExtendedSolutionData = (solutionId: string) => {
    return solutionData.find(
      item => item.data.content.solution_id === solutionId
    );
  };

  if (!latestIndex || !latestRCA) {
    return (
      <div className='flex h-48 items-center justify-center'>
        <div className='text-muted-foreground'>Loading RCA analysis...</div>
      </div>
    );
  }

  const summary = latestIndex.data.content.summary;
  const incident = latestRCA.data.content.incident;
  const solutions = latestRCA.data.content.possible_solutions;
  const contextualCtas = latestRCA.data.content.contextual_ctas.rca_level;

  const groupedSolutions = {
    immediate: solutions.filter(s => s.type === 'immediate'),
    short_term: solutions.filter(s => s.type === 'short_term'),
    long_term: solutions.filter(s => s.type === 'long_term'),
  };

  const handleActionClick = (action: any) => {
    // Determine which modal to open based on exact action type
    const actionType = action.type;

    switch (actionType) {
      case 'send_to_confluence':
        setShowConfluenceSpaceModal(true);
        break;
      case 'draft_pr':
        setShowGithubRepoModal(true);
        break;
      case 'create_jira':
        setShowJiraProjectModal(true);
        break;
      case 'comment_jira':
        setShowJiraTicketModal(true);
        break;
      default:
        console.log('Unknown action type:', actionType);
        break;
    }
  };

  const handleDetailSolution = (
    solution: DataRCA['data']['content']['possible_solutions'][0]
  ) => {
    append({
      role: 'user',
      content: `Give me solution in detail for: ${solution.title}(${solution.type})`,
    });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_to_confluence':
        return <ConfluenceIcon className='h-4 w-4' />;
      case 'draft_pr':
        return <GitIcon className='h-4 w-4' />;
      case 'create_jira':
        return <JiraIcon className='h-4 w-4' />;
      case 'comment_jira':
        return <JiraIcon className='h-4 w-4' />;
      default:
        return <FilePenLine className='h-4 w-4' />;
    }
  };

  // Modal callback handlers
  const handleConfluenceSpaceConfirm = (spaceKey: string) => {
    append({
      role: 'user',
      content: `Document Solution in confluence: ${spaceKey}`,
    });
  };

  const handleGithubRepoConfirm = (repoName: string, branchName: string) => {
    append({
      role: 'user',
      content: `Create PR: ${repoName} and ${branchName}`,
    });
  };

  const handleJiraProjectConfirm = (projectKey: string) => {
    append({
      role: 'user',
      content: `Create JIRA ticket: ${projectKey}`,
    });
  };

  const handleJiraTicketConfirm = (issueKey: string) => {
    append({
      role: 'user',
      content: `Comment in JIRA: ${issueKey}`,
    });
  };

  // Modal close handlers
  const handleModalClose = (modalType: string) => {
    switch (modalType) {
      case 'confluence':
        setShowConfluenceSpaceModal(false);
        break;
      case 'github':
        setShowGithubRepoModal(false);
        break;
      case 'jira-project':
        setShowJiraProjectModal(false);
        break;
      case 'jira-ticket':
        setShowJiraTicketModal(false);
        break;
    }
  };

  return (
    <div className='h-full space-y-6 overflow-y-auto scroll-smooth p-4'>
      {/* Action Buttons */}
      {contextualCtas && contextualCtas.length > 0 && (
        <div className='flex justify-end'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size='sm'
                className='flex items-center gap-2 bg-[#11054c] text-xs text-[#fff]'
              >
                <MoreHorizontal className='h-4 w-4' />
                Contextual CTA Actions
                <ChevronDown className='h-3 w-3' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              {contextualCtas
                .filter(action => action.available)
                .map(action => (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    disabled={!action.available}
                    className='flex cursor-pointer items-center gap-2'
                  >
                    {getActionIcon(action.type)}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Header Summary Card */}
      <Card className='p-4'>
        <div className='flex items-start gap-3'>
          <div className='mt-1 rounded-full bg-[#FEE4E2] p-2'>
            <FilePenLine className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div>
              <CardTitle className='text-md'>{summary.title}</CardTitle>
              <CardDescription className='mt-1 text-sm'>
                {summary.description}
              </CardDescription>
            </div>
            <div className='space-y-3'>
              <div className='flex items-center gap-2 text-xs'>
                <AlertTriangle className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground'>Severity:</span>
                <span className='font-medium'>{summary.severity}</span>
              </div>
              <div className='flex items-center gap-2 text-xs'>
                <Users className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground'>Confidence:</span>
                <span className='font-medium'>{summary.confidence}%</span>
              </div>
              <div className='flex items-center gap-2 text-xs'>
                <Clock className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground'>Timeframe:</span>
                <span className='font-medium'>{summary.timeframe}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Incident Details and Solutions Accordion */}
      <Accordion
        defaultValue={['incident-details']}
        type='multiple'
        className='w-full'
      >
        <AccordionItem value='incident-details'>
          <AccordionTrigger className='flex items-center gap-2 text-lg font-semibold'>
            <div className='mt-1 rounded-full bg-[#8472cd] p-2'>
              <Search className='h-4 w-4' color='#fff' />
            </div>
            {incident.title}
          </AccordionTrigger>
          <AccordionContent className='space-y-6 p-6'>
            {/* Incident Details */}
            <CardDescription className='mb-4 text-base'>
              {incident.description}
            </CardDescription>

            {/* Solutions Tabs */}
            <div className='space-y-4'>
              <Tabs className='w-full'>
                <TabsList className='mb-4 grid w-full grid-cols-3 bg-gray-50 p-1'>
                  <TabsTrigger
                    value='immediate'
                    isActive={activeTab === 'immediate'}
                    onClick={() => setActiveTab('immediate')}
                  >
                    Immediate
                  </TabsTrigger>
                  <TabsTrigger
                    value='short_term'
                    isActive={activeTab === 'short_term'}
                    onClick={() => setActiveTab('short_term')}
                  >
                    Short-term
                  </TabsTrigger>
                  <TabsTrigger
                    value='long_term'
                    isActive={activeTab === 'long_term'}
                    onClick={() => setActiveTab('long_term')}
                  >
                    Long-term
                  </TabsTrigger>
                </TabsList>

                {(['immediate', 'short_term', 'long_term'] as const).map(
                  tabType => (
                    <TabsContent
                      key={tabType}
                      value={tabType}
                      isActive={activeTab === tabType}
                      className='space-y-4'
                    >
                      {groupedSolutions[tabType].length === 0 ? (
                        <div className='text-muted-foreground py-8 text-center'>
                          No {tabType.replace('_', '-')} solutions available
                        </div>
                      ) : (
                        groupedSolutions[tabType].map(solution => {
                          const extendedData = getExtendedSolutionData(
                            solution.id
                          );

                          return (
                            <Card key={solution.id}>
                              <CardHeader className='pb-3'>
                                {/* Action buttons moved to dedicated section at top */}
                                <div className='mb-4 flex items-center justify-end gap-2'>
                                  <Button
                                    size='sm'
                                    onClick={() =>
                                      handleDetailSolution(solution)
                                    }
                                    className='flex items-center gap-2 bg-[#11054c] text-xs text-[#fff]'
                                  >
                                    <Lightbulb className='h-3 w-3' />
                                    Detail Solution
                                  </Button>

                                  {/* Solution-specific CTAs Dropdown */}
                                  {extendedData?.data.content.contextual_ctas &&
                                    extendedData.data.content.contextual_ctas
                                      .length > 0 && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            size='sm'
                                            className='flex items-center gap-1.5 bg-[#11054c] text-xs text-[#fff]'
                                          >
                                            <MoreHorizontal className='h-4 w-4' />
                                            Contextual CTA Actions
                                            <ChevronDown className='h-3 w-3' />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align='end'
                                          className='w-48'
                                        >
                                          {extendedData.data.content.contextual_ctas
                                            .filter(cta => cta.available)
                                            .map(cta => (
                                              <DropdownMenuItem
                                                key={cta.id}
                                                onClick={() =>
                                                  handleActionClick(cta)
                                                }
                                                disabled={!cta.available}
                                                className='flex cursor-pointer items-center gap-2'
                                              >
                                                {getActionIcon(cta.type)}
                                                <span>{cta.label}</span>
                                              </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                </div>

                                <div className='flex items-start justify-between border-l-4 border-l-green-500 bg-green-50/70 p-4'>
                                  <div className='flex items-start gap-3'>
                                    <div className='mt-1 rounded-full bg-green-100 p-2'>
                                      <Lightbulb className='h-4 w-4 text-green-600' />
                                    </div>
                                    <div>
                                      <CardTitle className='text-base'>
                                        <span className='font-semibold text-green-600'>
                                          Suggested Fix:
                                        </span>
                                      </CardTitle>
                                      <CardDescription className='mt-1'>
                                        {solution.description}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className='space-y-4'>
                                {/* Basic Solution Content */}
                                <div className='rounded-lg border border-gray-200 p-4'>
                                  <MarkdownRenderer
                                    content={solution.markdown_content}
                                    isStreaming={isStreaming}
                                  />
                                </div>

                                {/* Extended Solution Content */}
                                {extendedData && (
                                  <div className='space-y-3'>
                                    <div className='border-t pt-4'>
                                      <h4 className='mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900'>
                                        <Lightbulb className='h-5 w-5 text-green-600' />
                                        Detailed Solution
                                      </h4>
                                      <div className='rounded-lg border border-gray-200 p-4'>
                                        <MarkdownRenderer
                                          content={
                                            extendedData.data.content
                                              .markdown_content
                                          }
                                          isStreaming={isStreaming}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </TabsContent>
                  )
                )}
              </Tabs>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Modal Components */}
      <ConfluenceSpaceSelector
        isOpen={showConfluenceSpaceModal}
        onClose={() => handleModalClose('confluence')}
        onConfirm={handleConfluenceSpaceConfirm}
        title='Select Confluence Space'
        description='Choose a Confluence space to document the solution'
      />

      <GithubRepoSelector
        isOpen={showGithubRepoModal}
        onClose={() => handleModalClose('github')}
        onConfirm={handleGithubRepoConfirm}
        title='Select GitHub Repository'
        description='Choose a repository and branch to create a PR'
      />

      <JiraProjectSelector
        isOpen={showJiraProjectModal}
        onClose={() => handleModalClose('jira-project')}
        onConfirm={handleJiraProjectConfirm}
        title='Select Jira Project'
        description='Choose a Jira project to create a ticket'
      />

      <JiraTicketSelector
        isOpen={showJiraTicketModal}
        onClose={() => handleModalClose('jira-ticket')}
        onConfirm={handleJiraTicketConfirm}
        title='Select Jira Ticket'
        description='Choose a Jira ticket to add a comment'
      />
    </div>
  );
}
