import React from 'react';
import { IconProps } from './types';

export const JiraIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      width='29'
      height='29'
      viewBox='0 0 29 29'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g clipPath='url(#clip0_585_5933)'>
        <path
          d='M25.956 3.49939H13.917C13.917 4.94073 14.4896 6.32304 15.5087 7.34223C16.5279 8.36141 17.9102 8.93398 19.3516 8.93398H21.5693V11.0752C21.5713 14.0739 24.0017 16.5044 27.0004 16.5064V4.54377C27.0004 3.96714 26.5329 3.49939 25.956 3.49939Z'
          fill='#2684FF'
        />
        <path
          d='M19.9991 9.49805H7.96021C7.96207 12.4968 10.3925 14.9273 13.3913 14.9292H15.609V17.0773C15.6128 20.076 18.0449 22.5049 21.0436 22.5049V10.5426C21.0436 9.9658 20.5759 9.49805 19.9991 9.49805Z'
          fill='url(#paint0_linear_585_5933)'
        />
        <path
          d='M14.0388 15.4932H1.99976C1.99976 18.4946 4.43299 20.9278 7.43435 20.9278H9.65902V23.0689C9.66098 26.0649 12.0872 28.4943 15.0832 28.5V16.5376C15.0832 15.9608 14.6156 15.4932 14.0388 15.4932Z'
          fill='url(#paint1_linear_585_5933)'
        />
      </g>
      <defs>
        <linearGradient
          id='paint0_linear_585_5933'
          x1='3282.69'
          y1='15.4863'
          x2='1983.92'
          y2='1533.28'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0.18' stopColor='#0052CC' />
          <stop offset='1' stopColor='#2684FF' />
        </linearGradient>
        <linearGradient
          id='paint1_linear_585_5933'
          x1='3364.74'
          y1='32.4164'
          x2='1862.41'
          y2='1687.85'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0.18' stopColor='#0052CC' />
          <stop offset='1' stopColor='#2684FF' />
        </linearGradient>
        <clipPath id='clip0_585_5933'>
          <rect
            width='28'
            height='28'
            fill='white'
            transform='translate(0.5 0.5)'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
