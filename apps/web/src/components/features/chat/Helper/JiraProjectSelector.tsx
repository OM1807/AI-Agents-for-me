'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { JiraIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useAtlassian } from '@/hooks/useAtlassian';
import { useUser } from '@/hooks/useUser';
import { JiraProjectSelectorProps } from '@/types';

export function JiraProjectSelector({
  isOpen,
  onClose,
  onConfirm,
  title = 'Select Jira Project',
  description = 'Choose a Jira project for ticket creation',
}: JiraProjectSelectorProps) {
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { accessToken } = useUser();
  const { projects, getProjects, isLoading } = useAtlassian();

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    return projects.filter(
      project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  // Load projects on modal open
  const loadProjects = useCallback(async () => {
    if (!accessToken) return;
    await getProjects();
  }, [accessToken, getProjects]);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProjectKey('');
      setSearchQuery('');
      if (projects.length === 0) {
        loadProjects();
      }
    }
  }, [isOpen, projects.length, loadProjects]);

  const handleConfirm = () => {
    if (selectedProjectKey) {
      onConfirm(selectedProjectKey);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedProjectKey('');
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <JiraIcon className='h-5 w-5' />
            {title}
          </DialogTitle>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search input */}
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search projects...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-8'
              disabled={isLoading.projects}
            />
          </div>

          {/* Projects list */}
          <div className='max-h-60 overflow-y-auto rounded-md border'>
            {isLoading.projects ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                <span className='text-muted-foreground text-sm'>
                  Loading projects...
                </span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className='text-muted-foreground p-8 text-center'>
                <p className='text-sm'>
                  {searchQuery
                    ? 'No projects found matching your search'
                    : 'No projects available'}
                </p>
              </div>
            ) : (
              <div className='p-2'>
                {filteredProjects.map(project => (
                  <div
                    key={project.key}
                    className={cn(
                      'hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md p-3 text-sm transition-colors',
                      selectedProjectKey === project.key && 'bg-accent'
                    )}
                    onClick={() => setSelectedProjectKey(project.key)}
                  >
                    <input
                      type='radio'
                      checked={selectedProjectKey === project.key}
                      onChange={() => setSelectedProjectKey(project.key)}
                      className='text-primary focus:ring-primary h-4 w-4'
                    />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <p
                          className='truncate font-medium'
                          title={project.name}
                        >
                          {project.name}
                        </p>
                        <Badge variant='outline' className='text-xs'>
                          {project.key}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Project Type: {project.projectTypeKey || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedProjectKey}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
