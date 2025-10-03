'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JiraIcon } from '@/components/icons';
import { atlassianApi } from '@/lib/api/api';
import { useUser } from '@/hooks/useUser';
interface PublishJiraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (project: string, board: string, sprint?: string) => void;
}

type Step = 'connect' | 'confirm' | 'publish';

export function PublishJiraModal({
  open,
  onOpenChange,
  onPublish,
}: PublishJiraModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('publish');
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Get access token
  const { accessToken } = useUser();

  // Ref to prevent duplicate API calls
  const hasFetchedProjects = useRef(false);

  const fetchProjects = useCallback(async () => {
    if (!accessToken) {
      setProjectsError('Please log in to access Jira projects');
      return;
    }

    setIsLoadingProjects(true);
    setProjectsError(null);

    try {
      const response = await atlassianApi.getProjects(accessToken);

      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setProjectsError('Failed to fetch Jira projects');
      }
    } catch (err) {
      setProjectsError('Failed to fetch projects. Please try again.');
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [accessToken]);

  // Fetch projects when modal opens
  useEffect(() => {
    if (open && accessToken && !hasFetchedProjects.current) {
      hasFetchedProjects.current = true;
      fetchProjects();
    }
  }, [open, accessToken, fetchProjects]);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate API call to connect JIRA account
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep('confirm');
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConfirm = () => {
    setCurrentStep('publish');
  };

  const handlePublish = async () => {
    onPublish(
      selectedProject,
      selectedBoard.trim() || '',
      selectedSprint.trim() || undefined
    );
    onOpenChange(false);

    hasFetchedProjects.current = false;
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setCurrentStep('connect');
    setSelectedProject('');
    setSelectedBoard('');
    setSelectedSprint('');
    setProjects([]);
    setProjectsError(null);
    hasFetchedProjects.current = false;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'connect':
        return (
          <>
            <div className='flex flex-col items-center space-y-4 text-center'>
              {/* Connection Icon */}
              <div className='relative'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-blue-200 bg-blue-50'>
                  <JiraIcon className='h-8 w-8 text-blue-600' />
                </div>
                <div className='absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600'>
                  <Check className='h-4 w-4 text-white' />
                </div>
              </div>
            </div>

            <DialogFooter className='flex-col gap-2 sm:flex-row'>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className='w-full sm:w-auto'
              >
                {isConnecting ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    Connecting...
                  </>
                ) : (
                  'Connect JIRA Account'
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case 'confirm':
        return (
          <>
            <div className='flex flex-col items-center space-y-4 text-center'>
              {/* Success Icon */}
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
                <Check className='h-8 w-8 text-green-600' />
              </div>

              <div className='space-y-2'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Account Successfully Connected
                </h3>
                <p className='text-sm text-gray-600'>
                  Your Atlassian account has been linked successfully. You can
                  now proceed to select your JIRA project details.
                </p>
              </div>
            </div>

            <DialogFooter className='flex-col gap-2 sm:flex-row'>
              <Button onClick={handleConfirm} className='w-full sm:w-auto'>
                Continue
              </Button>
            </DialogFooter>
          </>
        );

      case 'publish':
        return (
          <>
            <div className='space-y-4'>
              <div>
                <p className='text-sm text-gray-600'>
                  Select the target project, board, and sprint to publish your
                  requirements directly to JIRA.
                </p>
              </div>

              <div className='space-y-4'>
                {/* Project Selection */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Project
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-between text-left'
                        disabled={isLoadingProjects}
                      >
                        {isLoadingProjects ? (
                          <>
                            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600' />
                            Loading projects...
                          </>
                        ) : selectedProject ? (
                          projects.find(
                            p => (p?.project_key || p?.key) === selectedProject
                          )?.name || 'Select Project'
                        ) : (
                          'Select Project'
                        )}
                        <ChevronDown className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-[var(--radix-dropdown-menu-trigger-width)]'>
                      {projectsError ? (
                        <DropdownMenuItem disabled className='text-red-600'>
                          {projectsError}
                        </DropdownMenuItem>
                      ) : projects.length === 0 ? (
                        <DropdownMenuItem disabled>
                          No projects found
                        </DropdownMenuItem>
                      ) : (
                        projects.map(project => (
                          <DropdownMenuItem
                            key={project.id}
                            onClick={() =>
                              setSelectedProject(
                                project?.project_key || project?.key
                              )
                            }
                          >
                            {project.name}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Board Selection */}
                {/* <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Board
                  </label>
                  <Input
                    type='text'
                    placeholder='Enter board name'
                    value={selectedBoard}
                    onChange={e => setSelectedBoard(e.target.value)}
                    disabled={!selectedProject}
                  />
                </div> */}

                {/* Sprint Selection (Optional) */}
                {/* <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Sprint (Optional)
                  </label>
                  <Input
                    type='text'
                    placeholder='Enter sprint name or leave empty'
                    value={selectedSprint}
                    onChange={e => setSelectedSprint(e.target.value)}
                    disabled={!selectedBoard}
                  />
                </div> */}
              </div>
            </div>

            <DialogFooter className='mt-4 flex w-full justify-between gap-4'>
              <Button
                variant='outline'
                onClick={handleClose}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!selectedProject}
                className='flex-1'
              >
                Publish
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='p-0 sm:max-w-lg'>
        <DialogHeader className='relative border-b p-6'>
          <DialogTitle className='flex items-center gap-2'>
            Connect JIRA & Publish
          </DialogTitle>
          <DialogClose onClose={handleClose} />
        </DialogHeader>
        <div className='p-6 pt-0'>{renderStepContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
