'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  SparkleIcon,
  Send,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import {
  SpinnerIcon,
  JiraIcon,
  NotionIcon,
  ConfluenceIcon,
} from '@/components/icons';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  exportSourceAsCSV,
  copyTestCaseAsJSON,
  copySourceAsJSON,
} from '@/lib/utils/test-case-export';

interface TestCase {
  id: string;
  title: string;
  type: 'functional' | 'edge' | 'negative' | 'regression';
  description: string;
  priority: string;
  environment: string;
  module: string;
  preconditions?: string[];
  test_steps?: Array<{
    step_id: string;
    action: string;
    test_data?: string;
    expected_result?: string;
  }>;
  steps?: Array<{
    step: number;
    action: string;
    test_data?: string | null;
    expected?: string;
  }>;
  expected_result?: string;
  expected_results?: string[];
}

interface TestCaseSource {
  type: string;
  provider: string;
  properties: {
    key?: string;
    id?: string;
    url?: string;
    title: string;
  };
  test_case_index: Array<{
    id: string;
    title: string;
    type: string;
    file: string;
  }>;
}

interface DataItem {
  type: string;
  data: {
    artifact_type: string;
    actual_file_path: string;
    file_path: string;
    filename: string;
    content_type: string;
    artifact_id: string;
    content: TestCaseSource | TestCase;
  };
}

interface TestCaseViewerProps {
  data: DataItem[];
  append: (message: any) => void;
}

interface GroupedTestCases {
  functional: TestCase[];
  edge: TestCase[];
  negative: TestCase[];
  regression: TestCase[];
}

interface SourceWithTestCases {
  source: TestCaseSource;
  artifactId: string;
  testCases: GroupedTestCases;
}

const TestCaseViewer: React.FC<TestCaseViewerProps> = ({ data, append }) => {
  const [sources, setSources] = useState<SourceWithTestCases[]>([]);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [copiedTestCase, setCopiedTestCase] = useState<string | null>(null);
  const [copiedSource, setCopiedSource] = useState<string | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setSources([]);
      return;
    }

    // Collect all unique sources (keeping the latest version for each artifact_id)
    const sourcesMap = new Map<string, SourceWithTestCases>();
    const allTestCases = new Map<
      string,
      { testCase: TestCase; filePath: string }
    >();

    // First pass: collect all test cases and sources
    data.forEach((item: DataItem) => {
      if (item.type === 'data-source' && item.data?.content) {
        const content = item.data.content as TestCaseSource;
        if ('properties' in content) {
          // Always use the latest source data for each artifact_id
          sourcesMap.set(item.data.artifact_id, {
            source: content,
            artifactId: item.data.artifact_id,
            testCases: {
              functional: [],
              edge: [],
              negative: [],
              regression: [],
            },
          });
        }
      } else if (item.type === 'data-testcase' && item.data?.content) {
        const testCase = item.data.content as TestCase;
        allTestCases.set(testCase.id, {
          testCase,
          filePath: item.data.file_path,
        });
      }
    });

    // Second pass: assign test cases to sources based on the latest source's test_case_index
    allTestCases.forEach(({ testCase, filePath }, testCaseId) => {
      let assigned = false;

      // Try to find a source that includes this test case in its index
      sourcesMap.forEach(sourceData => {
        // Only include test cases that are in the source's current index
        const isInIndex = sourceData.source.test_case_index?.some(
          indexItem => indexItem.id === testCaseId
        );

        if (isInIndex) {
          const type = testCase.type as keyof GroupedTestCases;
          if (
            sourceData.testCases[type] &&
            !sourceData.testCases[type].some(tc => tc.id === testCaseId)
          ) {
            sourceData.testCases[type].push(testCase);
            assigned = true;
          }
        }
      });

      // If not assigned by index, try to match by file path (for orphaned test cases)
      if (!assigned) {
        sourcesMap.forEach((sourceData, sourceId) => {
          if (filePath.includes(sourceId)) {
            // Double-check this test case isn't excluded from the latest index
            const isExcluded =
              sourceData.source.test_case_index &&
              !sourceData.source.test_case_index.some(
                item => item.id === testCaseId
              );

            if (!isExcluded) {
              const type = testCase.type as keyof GroupedTestCases;
              if (
                sourceData.testCases[type] &&
                !sourceData.testCases[type].some(tc => tc.id === testCaseId)
              ) {
                sourceData.testCases[type].push(testCase);
              }
            }
          }
        });
      }
    });

    setSources(Array.from(sourcesMap.values()));
  }, [data]);

  const getProviderIcon = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'jira':
        return <JiraIcon className='h-6 w-6' />;
      case 'notion':
        return <NotionIcon className='h-6 w-6' />;
      case 'confluence':
        return <ConfluenceIcon className='h-6 w-6' />;
      default:
        return <FileText className='h-6 w-6 text-gray-600' />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'functional':
        return <CheckCircle2 className='h-6 w-6 text-green-600' />;
      case 'edge':
        return <AlertCircle className='h-6 w-6 text-yellow-600' />;
      case 'negative':
        return <XCircle className='h-6 w-6 text-red-600' />;
      case 'regression':
        return <RefreshCw className='h-6 w-6 text-blue-600' />;
      default:
        return <FileText className='h-6 w-6 text-gray-600' />;
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'functional':
        return 'Core functionality and happy path scenarios';
      case 'edge':
        return 'Boundary conditions and limit testing';
      case 'negative':
        return 'Error handling and invalid input scenarios';
      case 'regression':
        return 'Backward compatibility and existing feature validation';
      default:
        return 'Test scenarios';
    }
  };

  const handleCopyTestCase = (testCase: TestCase, e: React.MouseEvent) => {
    e.stopPropagation();
    copyTestCaseAsJSON(testCase);
    setCopiedTestCase(testCase.id);
    setTimeout(() => setCopiedTestCase(null), 2000);
  };

  const handleCopySource = (
    sourceData: SourceWithTestCases,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    copySourceAsJSON(sourceData);
    setCopiedSource(sourceData.artifactId);
    setTimeout(() => setCopiedSource(null), 2000);
  };

  const handleDownloadCSV = (
    sourceData: SourceWithTestCases,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    exportSourceAsCSV(sourceData);
  };

  const renderTestCase = (testCase: TestCase) => {
    return (
      <AccordionItem
        key={testCase.id}
        value={testCase.id}
        className='border bg-slate-50'
      >
        <AccordionTrigger className='px-4 py-3 hover:bg-gray-50/70'>
          <div className='flex w-full items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-sm font-medium text-gray-700'>
                {testCase.id}
              </span>
              <span className='text-sm text-gray-600'>{testCase.title}</span>
            </div>
            <button
              onClick={e => handleCopyTestCase(testCase, e)}
              className={`mr-2 rounded-md p-1.5 transition-all ${
                copiedTestCase === testCase.id
                  ? 'bg-green-100 text-green-600'
                  : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
              title={
                copiedTestCase === testCase.id
                  ? 'Copied!'
                  : 'Copy test case as JSON'
              }
              aria-label={`Copy test case ${testCase.id}`}
            >
              {copiedTestCase === testCase.id ? (
                <Check className='h-3.5 w-3.5' />
              ) : (
                <Copy className='h-3.5 w-3.5' />
              )}
            </button>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className='space-y-4 p-4'>
            <div>
              <p className='text-sm font-semibold text-gray-700'>
                Description:
              </p>
              <p className='mt-1 text-sm text-gray-600'>
                {testCase.description}
              </p>
            </div>

            <div className='flex flex-wrap gap-6 text-sm'>
              <div>
                <span className='font-semibold text-gray-700'>Priority:</span>
                <span className='ml-2 text-gray-600'>{testCase.priority}</span>
              </div>
              <div>
                <span className='font-semibold text-gray-700'>
                  Environment:
                </span>
                <span className='ml-2 text-gray-600'>
                  {testCase.environment}
                </span>
              </div>
              <div>
                <span className='font-semibold text-gray-700'>Module:</span>
                <span className='ml-2 text-gray-600'>{testCase.module}</span>
              </div>
            </div>

            {testCase.preconditions && testCase.preconditions.length > 0 && (
              <div>
                <p className='text-sm font-semibold text-gray-700'>
                  Preconditions
                </p>
                <ul className='mt-2 space-y-1 text-sm text-gray-600'>
                  {testCase.preconditions.map((condition, idx) => (
                    <li key={idx} className='flex items-start'>
                      <span className='mr-2'>•</span>
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Handle both test_steps and steps */}
            {((testCase.test_steps && testCase.test_steps.length > 0) ||
              ((testCase as any).steps &&
                (testCase as any).steps.length > 0)) && (
              <div>
                <p className='text-sm font-semibold text-gray-700'>
                  Test Steps
                </p>
                <div className='mt-2 overflow-hidden rounded-lg border border-gray-200'>
                  <Table>
                    <TableHeader className='bg-gray-50'>
                      <TableRow>
                        <TableHead className='w-20 px-4 py-3 whitespace-normal'>
                          #Steps
                        </TableHead>
                        <TableHead className='px-4 py-3 whitespace-normal'>
                          Action
                        </TableHead>
                        <TableHead className='px-4 py-3 whitespace-normal'>
                          Test Data
                        </TableHead>
                        <TableHead className='px-4 py-3 whitespace-normal'>
                          Expected Result
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(testCase.test_steps || (testCase as any).steps)?.map(
                        (step: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className='px-4 py-3 font-medium whitespace-normal'>
                              {step.step || step.step_id || idx + 1}
                            </TableCell>
                            <TableCell className='px-4 py-3 whitespace-normal'>
                              {step.action}
                            </TableCell>
                            <TableCell className='px-4 py-3 font-mono whitespace-normal text-gray-600'>
                              {step.test_data || 'NA'}
                            </TableCell>
                            <TableCell className='px-4 py-3 whitespace-normal text-gray-600'>
                              {step.expected || step.expected_result || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Handle both expected_result and expected_results */}
            {(testCase.expected_result ||
              ((testCase as any).expected_results &&
                (testCase as any).expected_results.length > 0)) && (
              <div>
                <p className='text-sm font-semibold text-gray-700'>
                  Expected Result{(testCase as any).expected_results ? 's' : ''}
                </p>
                {(testCase as any).expected_results ? (
                  <ul className='mt-2 space-y-1 text-sm text-gray-600'>
                    {(testCase as any).expected_results.map(
                      (result: string, idx: number) => (
                        <li key={idx} className='flex items-start'>
                          <span className='mr-2'>•</span>
                          <span>{result}</span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className='mt-1 text-sm text-gray-600'>
                    {testCase.expected_result}
                  </p>
                )}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  const renderTypeSection = (
    sourceId: string,
    type: keyof GroupedTestCases,
    title: string,
    cases: TestCase[]
  ) => {
    const hasTestCases = cases.length > 0;

    if (!hasTestCases) return null;

    return (
      <Accordion
        type='multiple'
        defaultValue={[`${sourceId}-${type}`]}
        className='w-full'
      >
        <AccordionItem
          value={`${sourceId}-${type}`}
          className='border-0 shadow-none'
        >
          <AccordionTrigger className='rounded-lg bg-slate-100 px-4 py-3 hover:bg-gray-200 data-[state=open]:rounded-lg'>
            <div className='flex w-full items-center gap-2'>
              {getTypeIcon(type)}
              <div>
                <span className='text-sm font-medium text-gray-800'>
                  {title}
                </span>
                &nbsp;&nbsp;
                <span className='text-xs text-gray-500'>
                  &bull; {getTypeDescription(type)}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className='rounded-lg border-0 bg-white/50 py-2'>
            <Accordion type='multiple' className='space-y-2'>
              {cases.map(testCase => renderTestCase(testCase))}
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  const handleSendMessage = (
    sourceId: string,
    type: string,
    provider: string
  ) => {
    if (inputValue.trim()) {
      append({
        role: 'user',
        content: `For ${provider} ${type}: ${sourceId}, \n${inputValue.trim()}`,
      });
      setInputValue('');
      setOpenPopover(null);
    }
  };

  const renderSource = (sourceData: SourceWithTestCases) => {
    const { source, artifactId, testCases } = sourceData;
    // Get the identifier (key, id, or url)
    const identifier = source.properties.key || source.properties.id || '';

    return (
      <AccordionItem key={artifactId} value={artifactId} className='bg-white'>
        <AccordionTrigger className='px-4 py-3 hover:bg-gray-50'>
          <div className='flex w-full items-center gap-2'>
            <div className='flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-blue-50'>
              {getProviderIcon(source.provider)}
            </div>
            <div className='flex flex-1 flex-col items-start'>
              {source.provider === 'jira' && (
                <span className='text-sm font-semibold text-gray-700'>
                  {identifier}
                </span>
              )}
              <h3 className='flex-wrap text-sm text-gray-900'>
                {source.properties.title}
              </h3>
            </div>
            <div className='ml-auto flex items-center gap-1'>
              <button
                onClick={e => handleCopySource(sourceData, e)}
                className={`rounded-lg p-2 transition-all ${
                  copiedSource === artifactId
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
                title={
                  copiedSource === artifactId
                    ? 'Copied!'
                    : 'Copy all test cases as JSON'
                }
                aria-label={`Copy all test cases for ${identifier}`}
              >
                {copiedSource === artifactId ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </button>
              <button
                onClick={e => handleDownloadCSV(sourceData, e)}
                className='rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700'
                title='Download test cases as CSV'
                aria-label={`Download test cases for ${identifier} as CSV`}
              >
                <Download className='h-4 w-4' />
              </button>
              <Popover
                open={openPopover === artifactId}
                onOpenChange={open => {
                  setOpenPopover(open ? artifactId : null);
                  if (!open) setInputValue('');
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    onClick={e => e.stopPropagation()}
                    className='group mr-2 rounded-lg p-2 transition-colors hover:bg-gray-100'
                    aria-label='Edit source options'
                  >
                    <SparkleIcon
                      className={`h-4 w-4 transition-colors ${
                        openPopover === artifactId
                          ? 'fill-blue-600 text-blue-600'
                          : 'text-gray-500 group-hover:text-gray-700'
                      }`}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent side='right' align='start' className='w-80 p-2'>
                  <div className='relative flex items-end'>
                    <Textarea
                      placeholder='Ask anything about analysis or request clarification'
                      className='resize-none bg-gray-50 pr-12 focus:bg-white'
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(
                            identifier,
                            source.type,
                            source.provider
                          );
                        }
                      }}
                      onKeyUp={e => e.stopPropagation()}
                      style={{ minHeight: '50px', overflowY: 'auto' }}
                    />
                    <button
                      type='button'
                      onClick={() =>
                        handleSendMessage(
                          identifier,
                          source.type,
                          source.provider
                        )
                      }
                      disabled={!inputValue.trim()}
                      className='absolute right-1 bottom-1 p-1.5 text-blue-600 transition-colors hover:text-blue-700 disabled:text-gray-300'
                    >
                      <div className='flex items-center justify-center rounded-full bg-gray-100 p-1.5'>
                        <Send className='h-3 w-3' />
                      </div>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='bg-gray-50/50'>
          <div className='space-y-4 px-4 py-4'>
            {renderTypeSection(
              artifactId,
              'functional',
              'Functional Test Cases',
              testCases.functional
            )}
            {renderTypeSection(
              artifactId,
              'edge',
              'Edge Case Test Cases',
              testCases.edge
            )}
            {renderTypeSection(
              artifactId,
              'negative',
              'Negative Test Cases',
              testCases.negative
            )}
            {renderTypeSection(
              artifactId,
              'regression',
              'Regression Test Cases',
              testCases.regression
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  // All sources expanded by default
  const expandedItems = sources.map(s => s.artifactId);

  if (!data || data.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='space-y-4 text-center'>
          <SpinnerIcon className='mx-auto h-12 w-12 animate-spin text-gray-400' />
          <p className='text-gray-600'>Analyzing test requirements...</p>
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='space-y-4 text-center'>
          <FileText className='mx-auto h-12 w-12 text-gray-400' />
          <p className='text-gray-600'>Loading test suite information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full overflow-y-auto'>
      <Accordion
        type='multiple'
        defaultValue={expandedItems}
        className='space-y-4'
      >
        {sources.map(sourceData => renderSource(sourceData))}
      </Accordion>
    </div>
  );
};

export default TestCaseViewer;
