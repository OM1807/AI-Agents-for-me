'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { ActionBarProps } from '@/types/agent-api-suite';

export function ActionBar({
  // activeView,
  // onViewChange,
  onCreatePR,
  showCreatePR = true,
}: ActionBarProps) {
  return (
    <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      {/* Toggle Buttons */}
      {/* <div className='flex rounded-lg border border-[#B5B2C8] bg-[#E7E6ED] p-1'> */}
      {/* <button
          onClick={() => onViewChange('code')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeView === 'code' ? 'bg-[#4A20F5] text-white' : 'text-black'
          }`}
        >
          Code Generated
        </button> */}
      {/* <button
          onClick={() => onViewChange('automation')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeView === 'automation'
              ? 'bg-[#4A20F5] text-white'
              : 'text-black'
          }`}
        > */}
      {/* Automation Report
        </button> */}
      {/* </div> */}

      {/* Create PR Button - Only show if GitHub is connected */}
      {showCreatePR && (
        <Button
          onClick={onCreatePR}
          className='font-outfit flex items-center gap-2 bg-[#11054C] text-lg leading-none font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400'
        >
          <Github />
          Create PR (GitHub)
        </Button>
      )}
    </div>
  );
}
