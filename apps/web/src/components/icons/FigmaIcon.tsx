import React from 'react';
import { IconProps } from './types';

export const FigmaIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => {
  return (
    <svg
      className={className}
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g clipPath='url(#clip0_figma)'>
        {/* Left side paths */}
        <path
          d='M5.333 16c1.467 0 2.667-1.2 2.667-2.667V10.667H5.333A2.668 2.668 0 0 0 2.667 13.333C2.667 14.8 3.867 16 5.333 16z'
          fill='#0ACF83'
        />
        <path
          d='M2.667 8A2.668 2.668 0 0 0 5.333 10.667H8V5.333H5.333A2.668 2.668 0 0 0 2.667 8z'
          fill='#A259FF'
        />
        <path
          d='M2.667 2.667A2.668 2.668 0 0 0 5.333 5.333H8V0H5.333A2.668 2.668 0 0 0 2.667 2.667z'
          fill='#F24E1E'
        />
        {/* Right side paths */}
        <path d='M8 0h2.667a2.668 2.668 0 0 1 0 5.333H8V0z' fill='#FF7262' />
        <path
          d='M13.333 8a2.668 2.668 0 0 1-2.667 2.667A2.668 2.668 0 0 1 8 8a2.668 2.668 0 0 1 2.667-2.667A2.668 2.668 0 0 1 13.333 8z'
          fill='#1ABCFE'
        />
      </g>
      <defs>
        <clipPath id='clip0_figma'>
          <rect width='16' height='16' fill='white' />
        </clipPath>
      </defs>
    </svg>
  );
};
