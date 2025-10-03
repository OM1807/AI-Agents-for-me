import React from 'react';

interface PromptLibraryBackgroundProps {
  className?: string;
}

export const PromptLibraryBackground: React.FC<
  PromptLibraryBackgroundProps
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
        <linearGradient id='promptGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#F59E0B' stopOpacity='0.1' />
          <stop offset='50%' stopColor='#D97706' stopOpacity='0.2' />
          <stop offset='100%' stopColor='#B45309' stopOpacity='0.3' />
        </linearGradient>
        <linearGradient id='bookGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#FBBF24' />
          <stop offset='100%' stopColor='#F59E0B' />
        </linearGradient>
        <radialGradient id='aiGlow' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#FCD34D' stopOpacity='0.4' />
          <stop offset='100%' stopColor='#F59E0B' stopOpacity='0.1' />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width='400' height='192' fill='url(#promptGradient)' />

      {/* Library shelves */}
      <rect
        x='30'
        y='40'
        width='340'
        height='120'
        rx='8'
        fill='white'
        fillOpacity='0.9'
      />

      {/* Books on shelves */}
      <g>
        {/* Top shelf */}
        <rect x='50' y='55' width='12' height='40' rx='2' fill='#EF4444' />
        <rect x='65' y='55' width='15' height='40' rx='2' fill='#3B82F6' />
        <rect x='83' y='55' width='10' height='40' rx='2' fill='#10B981' />
        <rect x='96' y='55' width='18' height='40' rx='2' fill='#8B5CF6' />
        <rect x='117' y='55' width='13' height='40' rx='2' fill='#F59E0B' />
        <rect x='133' y='55' width='11' height='40' rx='2' fill='#EC4899' />
        <rect x='147' y='55' width='16' height='40' rx='2' fill='#06B6D4' />
        <rect x='166' y='55' width='14' height='40' rx='2' fill='#84CC16' />

        {/* Middle shelf */}
        <rect x='50' y='105' width='14' height='40' rx='2' fill='#7C3AED' />
        <rect x='67' y='105' width='12' height='40' rx='2' fill='#DC2626' />
        <rect x='82' y='105' width='17' height='40' rx='2' fill='#059669' />
        <rect x='102' y='105' width='11' height='40' rx='2' fill='#2563EB' />
        <rect x='116' y='105' width='15' height='40' rx='2' fill='#D97706' />
        <rect x='134' y='105' width='13' height='40' rx='2' fill='#BE185D' />
        <rect x='150' y='105' width='19' height='40' rx='2' fill='#0891B2' />
      </g>

      {/* Floating AI elements */}
      <g>
        {/* AI brain */}
        <circle cx='300' cy='80' r='25' fill='url(#aiGlow)' />
        <path
          d='M285 75 Q300 65 315 75 Q310 90 300 85 Q290 90 285 75'
          fill='#F59E0B'
          fillOpacity='0.6'
        />

        {/* Sparkles */}
        <g transform='translate(250, 60)'>
          <path
            d='M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z'
            fill='#FBBF24'
          />
        </g>
        <g transform='translate(330, 110)'>
          <path
            d='M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z'
            fill='#F59E0B'
          />
        </g>
        <g transform='translate(270, 120)'>
          <path
            d='M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z'
            fill='#FBBF24'
          />
        </g>
      </g>

      {/* Prompt cards floating */}
      <g>
        <rect
          x='200'
          y='50'
          width='60'
          height='25'
          rx='4'
          fill='white'
          fillOpacity='0.9'
          stroke='#F59E0B'
          strokeWidth='1'
        />
        <text
          x='230'
          y='60'
          textAnchor='middle'
          fontSize='8'
          fill='#D97706'
          fontWeight='600'
        >
          Code Review
        </text>
        <text x='230' y='70' textAnchor='middle' fontSize='6' fill='#92400E'>
          Prompt Template
        </text>

        <rect
          x='210'
          y='130'
          width='70'
          height='25'
          rx='4'
          fill='white'
          fillOpacity='0.9'
          stroke='#F59E0B'
          strokeWidth='1'
        />
        <text
          x='245'
          y='140'
          textAnchor='middle'
          fontSize='8'
          fill='#D97706'
          fontWeight='600'
        >
          Bug Analysis
        </text>
        <text x='245' y='150' textAnchor='middle' fontSize='6' fill='#92400E'>
          AI Assistant
        </text>
      </g>

      {/* Search bar */}
      <rect
        x='50'
        y='25'
        width='200'
        height='20'
        rx='10'
        fill='white'
        fillOpacity='0.8'
        stroke='#F59E0B'
        strokeWidth='1'
      />
      <text x='60' y='37' fontSize='10' fill='#92400E'>
        Search prompts...
      </text>
      <circle cx='235' cy='35' r='6' fill='#F59E0B' />
      <path
        d='M232 32 L238 38 M238 32 L232 38'
        stroke='white'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
};
