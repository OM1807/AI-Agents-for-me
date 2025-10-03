import React from 'react';

interface ProductManagementBackgroundProps {
  className?: string;
}

export const ProductManagementBackground: React.FC<
  ProductManagementBackgroundProps
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
        <linearGradient id='pmGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#10B981' stopOpacity='0.1' />
          <stop offset='50%' stopColor='#059669' stopOpacity='0.2' />
          <stop offset='100%' stopColor='#047857' stopOpacity='0.3' />
        </linearGradient>
        <linearGradient id='kanbanGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#34D399' />
          <stop offset='100%' stopColor='#10B981' />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width='400' height='192' fill='url(#pmGradient)' />

      {/* Kanban board */}
      <rect
        x='20'
        y='20'
        width='360'
        height='152'
        rx='8'
        fill='white'
        fillOpacity='0.9'
      />

      {/* Kanban columns */}
      <g>
        {/* To Do column */}
        <rect x='35' y='35' width='100' height='122' rx='6' fill='#F3F4F6' />
        <rect x='35' y='35' width='100' height='20' rx='6' fill='#6B7280' />
        <text
          x='85'
          y='48'
          textAnchor='middle'
          fontSize='10'
          fill='white'
          fontWeight='600'
        >
          TO DO
        </text>

        {/* Cards in To Do */}
        <rect
          x='45'
          y='65'
          width='80'
          height='25'
          rx='4'
          fill='white'
          stroke='#E5E7EB'
        />
        <text x='85' y='80' textAnchor='middle' fontSize='8' fill='#374151'>
          User Stories
        </text>

        <rect
          x='45'
          y='95'
          width='80'
          height='25'
          rx='4'
          fill='white'
          stroke='#E5E7EB'
        />
        <text x='85' y='110' textAnchor='middle' fontSize='8' fill='#374151'>
          Requirements
        </text>

        {/* In Progress column */}
        <rect x='150' y='35' width='100' height='122' rx='6' fill='#FEF3C7' />
        <rect x='150' y='35' width='100' height='20' rx='6' fill='#F59E0B' />
        <text
          x='200'
          y='48'
          textAnchor='middle'
          fontSize='10'
          fill='white'
          fontWeight='600'
        >
          IN PROGRESS
        </text>

        {/* Cards in Progress */}
        <rect
          x='160'
          y='65'
          width='80'
          height='25'
          rx='4'
          fill='white'
          stroke='#F59E0B'
          strokeWidth='2'
        />
        <text x='200' y='80' textAnchor='middle' fontSize='8' fill='#374151'>
          Sprint Planning
        </text>

        {/* Done column */}
        <rect x='265' y='35' width='100' height='122' rx='6' fill='#D1FAE5' />
        <rect x='265' y='35' width='100' height='20' rx='6' fill='#10B981' />
        <text
          x='315'
          y='48'
          textAnchor='middle'
          fontSize='10'
          fill='white'
          fontWeight='600'
        >
          DONE
        </text>

        {/* Cards in Done */}
        <rect
          x='275'
          y='65'
          width='80'
          height='25'
          rx='4'
          fill='white'
          stroke='#10B981'
          strokeWidth='2'
        />
        <text x='315' y='80' textAnchor='middle' fontSize='8' fill='#374151'>
          Backlog Review
        </text>

        <rect
          x='275'
          y='95'
          width='80'
          height='25'
          rx='4'
          fill='white'
          stroke='#10B981'
          strokeWidth='2'
        />
        <text x='315' y='110' textAnchor='middle' fontSize='8' fill='#374151'>
          Ticket Creation
        </text>
      </g>

      {/* Progress indicator */}
      <g transform='translate(35, 165)'>
        <text x='0' y='0' fontSize='10' fill='#10B981' fontWeight='600'>
          Sprint Progress: 65%
        </text>
        <rect x='120' y='-6' width='100' height='6' rx='3' fill='#E5E7EB' />
        <rect
          x='120'
          y='-6'
          width='65'
          height='6'
          rx='3'
          fill='url(#kanbanGradient)'
        />
      </g>

      {/* Chart icon */}
      <g transform='translate(340, 130)'>
        <rect x='0' y='15' width='4' height='20' fill='#10B981' />
        <rect x='8' y='10' width='4' height='25' fill='#34D399' />
        <rect x='16' y='5' width='4' height='30' fill='#10B981' />
        <rect x='24' y='12' width='4' height='23' fill='#34D399' />
      </g>
    </svg>
  );
};
