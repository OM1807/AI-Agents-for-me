import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JiraIcon } from '@/components/icons';
import { FileText, Settings, X, Plus } from 'lucide-react';
import { JiraTicketsModal } from './JiraTicketsModal';
import { AddIncidentModal } from '@/components/shared/AddIncidentModal';
import { integrationApi } from '@/lib/api/api';
import type {
  AtlassianIssue,
  PRDBasedType,
  IncidentBasedType,
  EnhancedAtlassianIssue,
} from '@/types';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { useProject } from '@/hooks/useProject';
import { cn } from '@/lib/utils';
import ConfirmDisconnectModal from './ConfirmDisconnectModal';
import { formatDistanceToNow } from 'date-fns';

interface JiraDocumentsProps {
  type: PRDBasedType | IncidentBasedType;
}

export function JiraDocuments({ type }: JiraDocumentsProps) {
  const { resetAtlassianMCPConnection, atlassianMCPConnection } = useOAuth();
  const { accessToken } = useUser();
  const {
    setPrdjira,
    prdjira,
    setIncidentjira,
    incidentjira,
    resetPrdjira,
    resetIncidentjira,
    resetCachedJiraProjects,
    resetCachedJiraTickets,
  } = useProject();
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const content = {
    prd: {
      title: 'Jira PRD Tickets',
      emptyText: 'No PRD tickets selected.',
      disconnectMessage:
        'Are you sure you want to disconnect Jira? This will remove all PRD tickets and their associated data. This action cannot be undone.',
    },
    incident: {
      title: 'Jira Incidents',
      emptyText: 'No incident configured.',
      disconnectMessage:
        'Are you sure you want to disconnect Jira? This will remove all incident data. This action cannot be undone.',
    },
  };

  const { title, emptyText } = content[type];

  // Get issue type color
  const getIssueTypeColor = (issueType: string) => {
    switch (issueType?.toLowerCase()) {
      case 'story':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'bug':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'task':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'highest':
      case 'blocker':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lowest':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsDisconnecting(true);
    try {
      const response = await integrationApi.delete(
        atlassianMCPConnection.id,
        accessToken
      );

      if (response.success) {
        resetAtlassianMCPConnection();
        resetPrdjira();
        resetIncidentjira();
        resetCachedJiraProjects();
        resetCachedJiraTickets();
        toast.success('Jira disconnected successfully');
        setShowDisconnectModal(false);
      } else {
        toast.error(
          `Failed to disconnect: ${response.error || 'Unknown error'}`
        );
      }
    } catch {
      toast.error('Failed to disconnect Jira');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConfirm = (
    selectedTickets: EnhancedAtlassianIssue[],
    ticketIds: string[]
  ) => {
    if (type === 'prd') {
      setPrdjira({ tickets: selectedTickets, selectedTickets: ticketIds });
    }
    setShowModal(false);
  };

  const handleConfirmSingle = (selectedTicket: EnhancedAtlassianIssue) => {
    if (type === 'incident') {
      // Transform AtlassianIssue to IncidentService format
      const incidentData = {
        id: selectedTicket.key, // Use ticket key as ID
        title: selectedTicket.fields.summary,
        type: selectedTicket.fields?.issuetype?.name || 'Unknown',
        last_seen: selectedTicket.fields?.created || new Date().toISOString(),
        link: `https://jira.com/browse/${selectedTicket.key}`,
        projectId: selectedTicket.projectKey,
        projectIds: [selectedTicket.projectKey],
        projectName: selectedTicket.projectName,
        projectNames: [selectedTicket.projectName],
      };
      setIncidentjira({ incident: incidentData });
    }
    setShowModal(false);
  };

  const handleRemoveTicket = (ticketId: string) => {
    if (type === 'prd') {
      const filteredTickets = prdjira.tickets.filter(
        ticket => ticket.id !== ticketId
      );
      const filteredSelectedTickets = prdjira.selectedTickets.filter(
        id => id !== ticketId
      );

      setPrdjira({
        tickets: filteredTickets,
        selectedTickets: filteredSelectedTickets,
      });
    } else {
      // For incidents, just clear the single incident
      setIncidentjira({ incident: null });
    }
  };

  const handleDisconnectClick = () => {
    setShowDisconnectModal(true);
  };

  return (
    <>
      <div className='bg-card rounded-lg border p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <JiraIcon className='h-5 w-5' />
            <h3 className='font-medium'>{title}</h3>
          </div>

          <div className='flex items-center gap-2'>
            {type === 'incident' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowAddModal(true)}
                className='gap-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800'
              >
                <Plus className='h-4 w-4' />
                Add Link
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowModal(true)}
              className='gap-2'
            >
              <Settings className='h-4 w-4' />
              Manage
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleDisconnectClick}
              className='border-red-700 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-900'
            >
              Disconnect
            </Button>
          </div>
        </div>

        <div>
          {(
            type === 'prd'
              ? prdjira.tickets.length === 0
              : !incidentjira.incident
          ) ? (
            <div className='py-4 text-center'>
              <FileText className='text-muted-foreground mx-auto h-8 w-8' />
              <p className='text-muted-foreground mt-2 text-sm'>{emptyText}</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Click &ldquo;Manage&rdquo; to{' '}
                {type === 'incident' ? 'configure incident' : 'select tickets'}.
              </p>
            </div>
          ) : type === 'prd' ? (
            <div className='max-h-80 min-h-0 flex-1 overflow-auto bg-white'>
              {prdjira.tickets.map((ticket: AtlassianIssue) => (
                <div
                  key={ticket.id}
                  className='bg-background relative border-b p-4'
                >
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveTicket(ticket.id)}
                    className='text-muted-foreground/60 hover:bg-muted hover:text-foreground absolute top-4 right-4 rounded-full p-1 transition-all duration-200'
                    title='Remove this ticket'
                  >
                    <X className='h-4 w-4' />
                  </button>

                  <div className='space-y-2 pr-8'>
                    {/* Issue type and Priority badges */}
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className={cn(
                          'text-xs font-medium',
                          getIssueTypeColor(ticket.fields?.issuetype?.name)
                        )}
                      >
                        {ticket.fields?.issuetype?.name}
                      </Badge>
                      <Badge
                        variant='outline'
                        className={cn(
                          'text-xs font-medium',
                          getPriorityColor(ticket.fields?.priority?.name)
                        )}
                      >
                        {ticket.fields?.priority?.name}
                      </Badge>
                    </div>

                    {/* Ticket key */}
                    <div className='text-sm font-semibold text-gray-700'>
                      {ticket.key}
                    </div>

                    {/* Ticket summary/title */}
                    <h4 className='text-xs font-medium text-gray-900'>
                      {ticket.fields?.summary}
                    </h4>

                    {/* Description or acceptance criteria preview */}
                    {ticket.fields?.description && (
                      <div className='mt-2'>
                        <p className='text-xs font-medium text-gray-500'>
                          Acceptance Criteria:
                        </p>
                        <div className='mt-1 space-y-1 text-xs text-gray-600'>
                          {/* Parse and show bullet points from description */}
                          {typeof ticket.fields?.description === 'string' &&
                            ticket.fields.description
                              .split('\n')
                              .filter(line => line.trim())
                              .slice(0, 3)
                              .map((line, idx) => (
                                <div key={idx} className='flex gap-2'>
                                  <span className='text-gray-400'>•</span>
                                  <span className='flex-1'>
                                    {line.trim().replace(/^[-*•]\s*/, '')}
                                  </span>
                                </div>
                              ))}
                          {typeof ticket.fields?.description === 'string' &&
                            ticket.fields?.description
                              .split('\n')
                              .filter(line => line.trim()).length > 3 && (
                              <span className='text-gray-400'>
                                +{' '}
                                {ticket.fields?.description
                                  .split('\n')
                                  .filter(line => line.trim()).length - 3}{' '}
                                more
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Additional metadata */}
                    <div className='flex items-center gap-3 text-xs text-gray-500'>
                      {(ticket as any).projectName && (
                        <>
                          <span className='flex items-center gap-1'>
                            <span className='font-medium'>Project:</span>
                            {(ticket as any).projectName}
                          </span>
                          <span className='text-gray-400'>•</span>
                        </>
                      )}
                      <span className='flex items-center gap-1'>
                        <span className='font-medium'>Status:</span>
                        {ticket.fields?.status?.name}
                      </span>
                      {ticket.fields?.assignee && (
                        <>
                          <span className='text-gray-400'>•</span>
                          <span className='flex items-center gap-1'>
                            <span className='font-medium'>Assignee:</span>
                            {ticket.fields?.assignee?.displayName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Incidents Layout - Single incident display similar to DataDog
            <>
              {incidentjira.incident && (
                <div
                  key={incidentjira.incident.id}
                  className='group relative flex flex-col bg-white px-4 py-3'
                >
                  {/* Remove button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveTicket(incidentjira.incident!.id);
                    }}
                    className='absolute top-3 right-3 text-gray-400 hover:text-gray-600'
                    title='Remove this incident'
                  >
                    <X className='h-4 w-4' />
                  </button>

                  {/* Title */}
                  <h4 className='mb-2 pr-8 text-sm font-medium text-gray-900'>
                    {incidentjira.incident.title}
                  </h4>

                  {/* Description */}
                  <p className='mb-2 text-xs leading-relaxed text-gray-600'>
                    Incident reference from Jira ticket system.
                  </p>

                  {/* Simple Badges */}
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      Project:{' '}
                      {(incidentjira.incident as any).projectNames?.join(
                        ', '
                      ) || 'Unknown'}
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Type: {incidentjira.incident.type}
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Reported:{' '}
                      {incidentjira.incident.last_seen
                        ? formatDistanceToNow(
                            new Date(incidentjira.incident.last_seen),
                            {
                              addSuffix: true,
                            }
                          )
                        : 'Unknown'}
                    </Badge>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <JiraTicketsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={type === 'prd' ? handleConfirm : undefined}
        onConfirmSingle={type === 'incident' ? handleConfirmSingle : undefined}
        type={type}
        mode={type === 'incident' ? 'single' : 'multi'}
      />

      {/* Add Custom Incident Modal */}
      <AddIncidentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        provider='jira'
        icon={<JiraIcon className='h-5 w-5' />}
      />

      {/* Disconnect Confirmation Modal */}
      <ConfirmDisconnectModal
        open={showDisconnectModal}
        message={content[type]?.disconnectMessage}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        isLoading={isDisconnecting}
      />
    </>
  );
}
