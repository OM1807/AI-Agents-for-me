'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useProject } from '@/hooks/useProject';

export type AnalysisType = 'basic' | 'deep';

interface AnalysisScopeSelectorProps {
  basicTitle?: string;
  basicDescription?: string;
  deepTitle?: string;
  deepDescription?: string;
  className?: string;
}

export function AnalysisScopeSelector({
  className,
  basicTitle = 'Basic research',
  basicDescription = 'Top-level summaries only',
  deepTitle = 'Deep research',
  deepDescription = 'Summaries + API map + diagrams + inter-service dependencies',
}: AnalysisScopeSelectorProps) {
  const { setAnalysisType, analysisType } = useProject();

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:w-1/2 md:grid-cols-2',
        className
      )}
    >
      <label
        className={cn(
          'relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all',
          analysisType === 'basic'
            ? 'border-primary bg-[#11054c]/5'
            : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <input
          type='radio'
          value='basic'
          checked={analysisType === 'basic'}
          onChange={() => setAnalysisType('basic')}
          className='sr-only'
        />
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold'>{basicTitle}</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              {basicDescription}
            </p>
          </div>
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
              analysisType === 'basic'
                ? 'border-primary bg-[#11054c]'
                : 'border-gray-300'
            )}
          >
            {analysisType === 'basic' && (
              <div className='h-2 w-2 rounded-full bg-white' />
            )}
          </div>
        </div>
      </label>

      <label
        className={cn(
          'relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all',
          analysisType === 'deep'
            ? 'border-primary bg-[#11054c]/5'
            : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <input
          type='radio'
          value='deep'
          checked={analysisType === 'deep'}
          onChange={() => setAnalysisType('deep')}
          className='sr-only'
        />
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold'>{deepTitle}</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              {deepDescription}
            </p>
          </div>
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
              analysisType === 'deep'
                ? 'border-primary bg-[#11054c]'
                : 'border-gray-300'
            )}
          >
            {analysisType === 'deep' && (
              <div className='h-2 w-2 rounded-full bg-white' />
            )}
          </div>
        </div>
      </label>
    </div>
  );
}
