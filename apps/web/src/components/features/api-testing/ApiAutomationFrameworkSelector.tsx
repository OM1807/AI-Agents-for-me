'use client';
import React from 'react';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { useProject } from '@/hooks/useProject';
import { SettingsIcon } from '@/components/icons/QualtiyAssurance';
import { cn } from '@/lib/utils';
import { ApiAutomationFrameworkSelectorProps } from '@/types/agent-api-suite';

export function ApiAutomationFrameworkSelector({
  className,
}: ApiAutomationFrameworkSelectorProps) {
  const { apiFrameworks, updateApiFramework } = useProject();

  const handleRadioChange = (frameworkId: string) => {
    // Disable all frameworks first, then enable the selected one
    apiFrameworks.frameworks.forEach(framework => {
      updateApiFramework(framework.id, framework.id === frameworkId);
    });
  };
  return (
    <div className={className}>
      <SectionWrapper
        icon={<SettingsIcon className='h-4 w-4' />}
        title='Select Your API Automation Framework'
      >
        <div className={cn('grid grid-cols-1 gap-4 md:w-full md:grid-cols-3')}>
          {apiFrameworks.frameworks.map(framework => (
            <label
              key={framework.id}
              className={cn(
                'relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all',
                framework.enabled
                  ? 'border-primary bg-[#11054c]/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <input
                type='radio'
                value={framework.id}
                checked={framework.enabled}
                onChange={() => handleRadioChange(framework.id)}
                className='sr-only'
              />
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold'>{framework.name}</h3>
                </div>
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                    framework.enabled
                      ? 'border-primary bg-[#11054c]'
                      : 'border-gray-300'
                  )}
                >
                  {framework.enabled && (
                    <div className='h-2 w-2 rounded-full bg-white' />
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}
