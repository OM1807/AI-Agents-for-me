import React from 'react';
import { IconProps } from '../types';

export const TickIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M20 6L9 17l-5-5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};
