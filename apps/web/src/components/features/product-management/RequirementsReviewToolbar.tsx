'use client';

import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { PublishJiraModal } from './publish-jira-modal';

export default function RequirementsReviewToolbar({
  append,
  isStreaming,
}: {
  append: (message: any) => void;
  isStreaming: boolean;
}) {
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('list');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className='flex flex-col gap-4'>
      {/* Header Text */}
      <p className='text-gray-600'>
        Review and edit the parsed epics, user stories, and tasks before
        publishing to JIRA
      </p>

      {/* Controls */}
      <div className='flex items-center justify-between'>
        {/* Toggle Buttons */}
        <div className='flex overflow-hidden rounded-lg border border-gray-300'>
          <button
            onClick={() => setActiveView('kanban')}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${
              activeView === 'kanban'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid className='h-4 w-4' />
            Kanban View
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${
              activeView === 'list'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className='h-4 w-4' />
            List View
          </button>
        </div>

        {/* Publish Button */}
        {!isStreaming && (
          <button
            className='rounded-md bg-indigo-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-800'
            onClick={() => setShowModal(true)}
          >
            Publish to JIRA
          </button>
        )}
      </div>
      {showModal && (
        <PublishJiraModal
          open={showModal}
          onOpenChange={setShowModal}
          onPublish={(project: string, board: string, sprint?: string) => {
            append({
              role: 'user',
              content: `Publish to Jira for project: ${project}${board ? `, board: ${board}` : ''}${sprint ? ` and sprint: ${sprint}` : ''}`,
            });
          }}
        />
      )}
    </div>
  );
}
