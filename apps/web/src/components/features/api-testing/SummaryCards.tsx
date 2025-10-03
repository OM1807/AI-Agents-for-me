'use client';

import React from 'react';
import { CheckCircle, Cog } from 'lucide-react';
import { SummaryCardsProps } from '@/types/agent-api-suite';

export function SummaryCards({
  testCasesAutomated,
  failed,
}: SummaryCardsProps) {
  return (
    <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
      {/* Test Cases Automated Card */}
      <div className='flex items-center gap-4 rounded-lg border bg-white p-6'>
        <div className='flex-shrink-0'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
        </div>
        <div className='flex-1'>
          <div className='text-2xl font-bold text-green-600'>
            {testCasesAutomated}
          </div>
          <div className='text-sm text-gray-600'>Test Cases Automated</div>
        </div>
      </div>

      {/* Failed Card */}
      <div className='flex items-center gap-4 rounded-lg border bg-white p-6'>
        <div className='flex-shrink-0'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
            <Cog className='h-6 w-6 text-yellow-600' />
          </div>
        </div>
        <div className='flex-1'>
          <div className='text-2xl font-bold text-yellow-600'>{failed}</div>
          <div className='text-sm text-gray-600'>
            Total API Endpoints Covered
          </div>
        </div>
      </div>
    </div>
  );
}
