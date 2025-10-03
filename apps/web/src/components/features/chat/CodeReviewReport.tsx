'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
  Shield,
  Gauge,
  Palette,
  CheckCircle,
  Send,
  Check,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CodeReviewIssue {
  severity: string; // Use backend severity directly
  file: string;
  line?: number;
  title: string;
  description: string;
  suggestedFix: string;
  codeExample?: {
    before: string;
    after: string;
  };
  references?: { id: string; title: string; url: string }[] | string[];
}

interface CodeReviewSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  issues: CodeReviewIssue[];
  expanded?: boolean;
}

interface CodeReviewReportProps {
  data: any;
  append?: (message: any) => void;
}

const getSeverityColor = (severity: string) => {
  const severityLower = severity?.toLowerCase();
  switch (severityLower) {
    case 'critical':
    case 'high':
      return 'bg-red-500 text-white';
    case 'major':
    case 'medium':
      return 'bg-orange-500 text-white';
    case 'minor':
    case 'low':
      return 'bg-yellow-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export function CodeReviewReport({ data, append }: CodeReviewReportProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>(
    {}
  );
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleIssue = (issueId: string) => {
    setExpandedIssues(prev => ({
      ...prev,
      [issueId]: !prev[issueId],
    }));
  };

  const handleSendMessage = () => {
    if (inputValue.trim() && append) {
      // Send in the exact format specified
      const content = `Modify Review: ${inputValue.trim()}`;

      append({
        role: 'user',
        content: content,
      });
      setInputValue('');
      setOpenPopover(null);
    }
  };

  // Copy functionality for individual sections
  const handleCopySection = async (
    section: CodeReviewSection,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      const sectionContent =
        `## ${section.title}\n${section.description}\n\n` +
        section.issues
          .map(issue => {
            return (
              `### ${issue.title} [${issue.severity}]\n` +
              `File: ${issue.file}${issue.line ? `:${issue.line}` : ''}\n` +
              `Description: ${issue.description}\n` +
              `Fix: ${issue.suggestedFix}\n` +
              (issue.codeExample
                ? `Before: ${issue.codeExample.before}\n` +
                  `After: ${issue.codeExample.after}\n`
                : '') +
              '\n'
            );
          })
          .join('\n');

      await navigator.clipboard.writeText(sectionContent);
      setCopiedSection(section.id);
      setTimeout(() => setCopiedSection(null), 1500);
      toast.success(`${section.title} copied to clipboard`);
    } catch {
      toast.error('Failed to copy section');
    }
  };

  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return { comments: [], summary: null };
    }

    const latestIndexArtifact = [...data].reverse().find((item: any) => {
      const artifactData = item.data || item;
      return artifactData.artifact_type === 'index';
    });

    if (!latestIndexArtifact) {
      return { comments: [], summary: null };
    }

    const indexData =
      latestIndexArtifact.data?.content || latestIndexArtifact.content;

    // Get all comment IDs from all files in the index
    const expectedCommentIds: string[] = [];
    if (indexData?.files) {
      Object.values(indexData.files).forEach((fileData: any) => {
        if (fileData?.commentIds) {
          expectedCommentIds.push(...fileData.commentIds);
        }
      });
    }

    const totalComments = indexData?.summary?.totalComments || 0;

    if (totalComments === 0) {
      return { comments: [], summary: indexData };
    }

    const latestCommentsArtifact = [...data].reverse().find((item: any) => {
      const artifactData = item.data || item;
      return artifactData.artifact_type === 'comments';
    });

    if (!latestCommentsArtifact) {
      return { comments: [], summary: indexData };
    }

    const allComments =
      latestCommentsArtifact.data?.content?.comments ||
      latestCommentsArtifact.content?.comments ||
      [];

    const filteredComments = allComments.filter((comment: any) =>
      expectedCommentIds.includes(comment.id)
    );

    return { comments: filteredComments, summary: indexData };
  }, [data]);

  const reviewSections: CodeReviewSection[] = useMemo(() => {
    const { comments } = processedData;

    if (comments.length === 0) {
      return [];
    }

    const normalizeType = (type: string) => {
      if (type === 'best_practices') return 'best_practice';
      return type;
    };

    const uniqueTypes = [
      ...new Set(
        comments
          .map((comment: any) => normalizeType(comment.type))
          .filter((type: any): type is string => Boolean(type))
      ),
    ] as string[];

    const sectionConfig: Record<string, Omit<CodeReviewSection, 'issues'>> = {
      security: {
        id: 'security',
        title: 'Security Issues',
        description:
          'Identify vulnerabilities that could expose your application to risks or attacks.',
        icon: <Shield className='h-5 w-5 text-red-500' />,
      },
      performance: {
        id: 'performance',
        title: 'Performance Issues',
        description:
          'Spot inefficient code patterns that may slow down execution or increase resource usage.',
        icon: <Gauge className='h-5 w-5 text-orange-500' />,
      },
      style: {
        id: 'style',
        title: 'Style Issues',
        description:
          'Highlight deviations from coding standards to improve readability and maintainability.',
        icon: <Palette className='h-5 w-5 text-blue-500' />,
      },
      best_practice: {
        id: 'best_practice',
        title: 'Best Practice Issues',
        description:
          'Ensure your code follows recommended practices for reliability and long-term scalability.',
        icon: <CheckCircle className='h-5 w-5 text-green-500' />,
      },
      maintainability: {
        id: 'maintainability',
        title: 'Maintainability Issues',
        description:
          'Identify code patterns that may make the codebase harder to maintain and update over time.',
        icon: <Gauge className='h-5 w-5 text-purple-500' />,
      },
      documentation: {
        id: 'documentation',
        title: 'Documentation Issues',
        description:
          'Identify issues with code documentation, comments, and README files that affect project clarity.',
        icon: <CheckCircle className='h-5 w-5 text-indigo-500' />,
      },
    };

    const sectionMap: Record<string, CodeReviewSection> = {};

    uniqueTypes.forEach((type: string) => {
      const config = sectionConfig[type] || {
        id: type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Issues`,
        description: `Issues related to ${type} that need attention.`,
        icon: <CheckCircle className='h-5 w-5 text-gray-500' />,
      };

      sectionMap[type] = {
        ...config,
        issues: [],
      };
    });
    comments.forEach((comment: any) => {
      const commentType = normalizeType(comment.type || 'style');
      const section = sectionMap[commentType] || sectionMap['style'];

      const transformedIssue: CodeReviewIssue = {
        severity: comment.severity || 'unknown',
        file: comment.file || 'Unknown file',
        line: comment.line,
        title: comment.title || 'Untitled issue',
        description: comment.description || 'No description provided',
        suggestedFix:
          comment.suggestedFix?.description ||
          comment.suggestedFix?.code ||
          'No suggested fix provided',
        codeExample:
          comment.codeSnippet && comment.suggestedFix?.code
            ? {
                before: comment.codeSnippet,
                after: comment.suggestedFix.code,
              }
            : undefined,
        references: comment.references || [],
      };

      section.issues.push(transformedIssue);
    });

    const finalSections = Object.values(sectionMap);
    const uniqueSections = finalSections.filter(
      (section, index, self) =>
        index === self.findIndex(s => s.id === section.id)
    );

    return uniqueSections;
  }, [processedData]);

  useEffect(() => {
    const defaultSectionStates: Record<string, boolean> = {};
    const defaultIssueStates: Record<string, boolean> = {};

    reviewSections.forEach((section, index) => {
      defaultSectionStates[section.id] = index === 0;

      section.issues.forEach((_, index) => {
        const issueId = `${section.id}-issue-${index}`;
        defaultIssueStates[issueId] = false;
      });
    });

    setExpandedSections(defaultSectionStates);
    setExpandedIssues(defaultIssueStates);
  }, [reviewSections]);

  return (
    <div className='flex flex-col'>
      {/* Scrollable Review Sections */}
      <div className='scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 max-h-[calc(100vh-300px)] overflow-y-auto'>
        <div className='space-y-4 p-4 pb-8'>
          {reviewSections.map(section => (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className='rounded-xl border border-gray-200 bg-white'
            >
              {/* Section Header */}
              <div
                className={`flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 ${
                  expandedSections[section.id] ? 'rounded-t-xl' : 'rounded-xl'
                }`}
                onClick={() => toggleSection(section.id)}
              >
                <div className='flex items-center gap-3'>
                  {section.icon}
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-semibold text-gray-900'>
                        {section.title}
                      </h3>
                      <Badge
                        variant='secondary'
                        className='bg-gray-100 text-xs text-gray-600'
                      >
                        {section.issues.length} issue
                        {section.issues.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className='text-sm text-gray-600'>
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    <Popover
                      open={openPopover === section.id}
                      onOpenChange={open => {
                        setOpenPopover(open ? section.id : null);
                        if (!open) setInputValue('');
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          onClick={e => e.stopPropagation()}
                          className='group rounded-lg p-1 transition-colors hover:bg-gray-100'
                          aria-label='Ask AI about this section'
                        >
                          <Sparkles
                            className={`h-4 w-4 transition-colors ${
                              openPopover === section.id
                                ? 'fill-purple-600 text-purple-600'
                                : 'text-purple-500 group-hover:text-purple-700'
                            }`}
                          />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side='right' className='w-80'>
                        <div className='space-y-2'>
                          <p className='text-sm font-medium'>
                            Ask AI about {section.title}
                          </p>
                          <div className='flex gap-2'>
                            <Textarea
                              placeholder={`Ask about ${section.title.toLowerCase()}...`}
                              value={inputValue}
                              onChange={e => setInputValue(e.target.value)}
                              className='flex-1 resize-none'
                              rows={2}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                            />
                            <Button
                              size='sm'
                              onClick={() => handleSendMessage()}
                              disabled={!inputValue.trim()}
                              className='self-end'
                            >
                              <Send className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <button
                      onClick={e => handleCopySection(section, e)}
                      className={`rounded-lg p-1 transition-colors ${
                        copiedSection === section.id
                          ? 'bg-green-100 text-green-600'
                          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                      title={
                        copiedSection === section.id
                          ? 'Copied!'
                          : `Copy ${section.title}`
                      }
                      aria-label={`Copy ${section.title}`}
                    >
                      {copiedSection === section.id ? (
                        <Check className='h-4 w-4' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                  {expandedSections[section.id] ? (
                    <ChevronUp className='h-5 w-5 text-gray-400' />
                  ) : (
                    <ChevronDown className='h-5 w-5 text-gray-400' />
                  )}
                </div>
              </div>

              {/* Section Content - Figma Design */}
              {expandedSections[section.id] && (
                <div className='overflow-hidden rounded-b-xl border-t'>
                  {section.issues.length > 0 ? (
                    <div className='divide-y divide-gray-100'>
                      {section.issues.map((issue, issueIndex) => {
                        const issueId = `${section.id}-issue-${issueIndex}`;
                        return (
                          <div
                            key={issueIndex}
                            id={`issue-${issueId}`}
                            className='bg-white'
                          >
                            {/* Compact Issue Row - Figma Style */}
                            <div
                              className='flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50'
                              onClick={() => toggleIssue(issueId)}
                            >
                              <div className='flex min-w-0 flex-1 items-center gap-3'>
                                <Badge
                                  className={`${getSeverityColor(issue.severity)} flex-shrink-0 text-xs font-medium`}
                                >
                                  {issue.severity}
                                </Badge>
                                <div className='min-w-0 flex-1'>
                                  <div className='truncate text-sm text-gray-500'>
                                    {issue.file}
                                    {issue.line && `:${issue.line}`}
                                  </div>
                                  <div className='truncate text-sm font-medium text-gray-900'>
                                    {issue.title}
                                  </div>
                                </div>
                              </div>
                              <ChevronDown
                                className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
                                  expandedIssues[issueId]
                                    ? 'rotate-180 transform'
                                    : ''
                                }`}
                              />
                            </div>

                            {/* Expandable Content */}
                            {expandedIssues[issueId] && (
                              <div className='border-t border-gray-100 bg-gray-50 px-4 pb-4'>
                                <div className='space-y-4 pt-4'>
                                  {/* Issue Description */}
                                  <div>
                                    <p className='text-sm leading-relaxed text-gray-700'>
                                      {issue.description}
                                    </p>
                                  </div>

                                  {/* Suggested Fix */}
                                  <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                                    <div className='mb-2 flex items-center gap-2'>
                                      <div className='rounded-full bg-green-500 p-1'>
                                        <CheckCircle className='h-3 w-3 text-white' />
                                      </div>
                                      <span className='text-sm font-medium text-green-800'>
                                        Suggested Fix:
                                      </span>
                                    </div>
                                    <p className='text-sm text-green-700'>
                                      {issue.suggestedFix}
                                    </p>
                                  </div>

                                  {/* Code Example - Simple Diff Style */}
                                  {issue.codeExample && (
                                    <div className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
                                      <pre className='overflow-x-auto font-mono text-sm'>
                                        {issue.codeExample.before
                                          .split('\n')
                                          .map((line, index) => {
                                            const cleanLine = line.replace(
                                              /^[+-]\s*/,
                                              ''
                                            );
                                            return (
                                              <div
                                                key={`before-${index}`}
                                                className='text-red-600'
                                              >
                                                {cleanLine.trim()
                                                  ? `- ${cleanLine}`
                                                  : ''}
                                              </div>
                                            );
                                          })}
                                        {issue.codeExample.after
                                          .split('\n')
                                          .map((line, index) => {
                                            const cleanLine = line.replace(
                                              /^[+-]\s*/,
                                              ''
                                            );
                                            return (
                                              <div
                                                key={`after-${index}`}
                                                className='text-green-600'
                                              >
                                                {cleanLine.trim()
                                                  ? `+ ${cleanLine}`
                                                  : ''}
                                              </div>
                                            );
                                          })}
                                      </pre>
                                    </div>
                                  )}

                                  {/* Reference Documentation */}
                                  {issue.references &&
                                    issue.references.length > 0 && (
                                      <div className='pt-2'>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant='link'
                                              className='h-auto p-0 text-sm text-blue-600 hover:text-blue-800'
                                            >
                                              📖 Reference Documentation
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent
                                            className='w-80'
                                            side='right'
                                            align='start'
                                          >
                                            <div className='space-y-2'>
                                              <p className='text-sm font-medium'>
                                                References
                                              </p>
                                              <ul className='list-disc space-y-1 pl-4 text-sm'>
                                                {(issue.references || []).map(
                                                  (ref, refIndex) => (
                                                    <li key={refIndex}>
                                                      <a
                                                        href={
                                                          typeof ref ===
                                                          'string'
                                                            ? ref
                                                            : ref.url
                                                        }
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className='break-all text-blue-600 hover:underline'
                                                      >
                                                        {typeof ref === 'string'
                                                          ? ref
                                                          : ref.title}
                                                      </a>
                                                    </li>
                                                  )
                                                )}
                                              </ul>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className='px-4 py-8 text-center'>
                      <div className='mb-2 text-gray-400'>
                        <CheckCircle className='mx-auto h-12 w-12' />
                      </div>
                      <p className='font-medium text-gray-600'>
                        No issues found
                      </p>
                      <p className='text-sm text-gray-500'>
                        This section passed all checks
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
