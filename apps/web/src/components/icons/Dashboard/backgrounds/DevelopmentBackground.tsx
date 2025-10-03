import React from 'react';

interface DevelopmentBackgroundProps {
  className?: string;
}

export const DevelopmentBackground: React.FC<DevelopmentBackgroundProps> = ({
  className,
}) => {
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
        <linearGradient id='devGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.1' />
          <stop offset='50%' stopColor='#1D4ED8' stopOpacity='0.2' />
          <stop offset='100%' stopColor='#1E40AF' stopOpacity='0.3' />
        </linearGradient>
        <linearGradient id='codeGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#60A5FA' />
          <stop offset='100%' stopColor='#3B82F6' />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width='400' height='192' fill='url(#devGradient)' />

      {/* Code editor window */}
      <rect
        x='40'
        y='30'
        width='320'
        height='132'
        rx='8'
        fill='white'
        fillOpacity='0.9'
      />
      <rect x='40' y='30' width='320' height='24' rx='8' fill='#1F2937' />

      {/* Window controls */}
      <circle cx='56' cy='42' r='4' fill='#EF4444' />
      <circle cx='72' cy='42' r='4' fill='#F59E0B' />
      <circle cx='88' cy='42' r='4' fill='#10B981' />

      {/* Code lines */}
      <rect
        x='56'
        y='70'
        width='120'
        height='4'
        rx='2'
        fill='url(#codeGradient)'
      />
      <rect x='56' y='82' width='200' height='4' rx='2' fill='#94A3B8' />
      <rect
        x='72'
        y='94'
        width='160'
        height='4'
        rx='2'
        fill='url(#codeGradient)'
      />
      <rect x='72' y='106' width='140' height='4' rx='2' fill='#94A3B8' />
      <rect
        x='56'
        y='118'
        width='180'
        height='4'
        rx='2'
        fill='url(#codeGradient)'
      />
      <rect x='56' y='130' width='100' height='4' rx='2' fill='#94A3B8' />
      <rect
        x='72'
        y='142'
        width='120'
        height='4'
        rx='2'
        fill='url(#codeGradient)'
      />

      {/* Floating code elements */}
      <rect
        x='280'
        y='80'
        width='60'
        height='20'
        rx='4'
        fill='#3B82F6'
        fillOpacity='0.2'
      />
      <text
        x='310'
        y='93'
        textAnchor='middle'
        fontSize='10'
        fill='#3B82F6'
        fontFamily='monospace'
      >
        &#123;&#125;
      </text>

      <rect
        x='290'
        y='110'
        width='40'
        height='16'
        rx='3'
        fill='#10B981'
        fillOpacity='0.2'
      />
      <text
        x='310'
        y='120'
        textAnchor='middle'
        fontSize='8'
        fill='#10B981'
        fontFamily='monospace'
      >
        =&gt;
      </text>

      {/* Binary pattern in background */}
      <text
        x='20'
        y='180'
        fontSize='12'
        fill='#3B82F6'
        fillOpacity='0.3'
        fontFamily='monospace'
      >
        01001000 01100101 01101100 01101100 01101111
      </text>
    </svg>
  );
};
