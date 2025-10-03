import React from 'react';

interface QualityAssuranceBackgroundProps {
  className?: string;
}

export const QualityAssuranceBackground: React.FC<
  QualityAssuranceBackgroundProps
> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox='0 0 400 192'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      preserveAspectRatio='none'
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id='qaGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#8B5CF6' stopOpacity='0.1' />
          <stop offset='50%' stopColor='#7C3AED' stopOpacity='0.2' />
          <stop offset='100%' stopColor='#6D28D9' stopOpacity='0.3' />
        </linearGradient>
        <linearGradient id='testGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#A78BFA' />
          <stop offset='100%' stopColor='#8B5CF6' />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width='400' height='192' fill='url(#qaGradient)' />

      {/* Test dashboard */}
      <rect
        x='30'
        y='25'
        width='340'
        height='142'
        rx='12'
        fill='white'
        fillOpacity='0.9'
      />

      {/* Header */}
      <rect
        x='30'
        y='25'
        width='340'
        height='30'
        rx='12'
        fill='#8B5CF6'
        fillOpacity='0.1'
      />
      <text x='50' y='44' fontSize='12' fill='#8B5CF6' fontWeight='600'>
        Test Suite Dashboard
      </text>

      {/* Test cases */}
      <g>
        {/* Passed test */}
        <circle cx='60' cy='80' r='6' fill='#10B981' />
        <text x='75' y='85' fontSize='10' fill='#374151'>
          Test Case 1: Login Validation
        </text>
        <text x='320' y='85' fontSize='10' fill='#10B981' fontWeight='600'>
          PASSED
        </text>

        {/* Failed test */}
        <circle cx='60' cy='105' r='6' fill='#EF4444' />
        <text x='75' y='110' fontSize='10' fill='#374151'>
          Test Case 2: Payment Processing
        </text>
        <text x='320' y='110' fontSize='10' fill='#EF4444' fontWeight='600'>
          FAILED
        </text>

        {/* Running test */}
        <circle cx='60' cy='130' r='6' fill='#F59E0B' />
        <text x='75' y='135' fontSize='10' fill='#374151'>
          Test Case 3: User Registration
        </text>
        <text x='315' y='135' fontSize='10' fill='#F59E0B' fontWeight='600'>
          RUNNING
        </text>
      </g>

      {/* Progress bar */}
      <rect x='50' y='150' width='300' height='8' rx='4' fill='#E5E7EB' />
      <rect
        x='50'
        y='150'
        width='200'
        height='8'
        rx='4'
        fill='url(#testGradient)'
      />

      {/* Stats */}
      <text x='50' y='180' fontSize='10' fill='#8B5CF6' fontWeight='600'>
        67% Complete • 2/3 Passed • 1 Failed
      </text>

      {/* Bug icon */}
      <g transform='translate(320, 60)'>
        <circle cx='20' cy='20' r='15' fill='#EF4444' fillOpacity='0.2' />
        <path
          d='M15 15 L25 25 M25 15 L15 25'
          stroke='#EF4444'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
    </svg>
  );
};
