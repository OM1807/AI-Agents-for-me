import type { IconProps } from './types';

export const NewRelicIcon: React.FC<IconProps> = ({
  className,
  ...props
}: IconProps) => (
  <svg
    className={className}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <rect x='2' y='2' width='20' height='20' rx='4' fill='#1CE783' />
    <path d='M6 8L12 6L18 8V16L12 18L6 16V8Z' fill='#FFFFFF' />
    <path
      d='M12 8V16M8 10L16 14M16 10L8 14'
      stroke='#1CE783'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
  </svg>
);
