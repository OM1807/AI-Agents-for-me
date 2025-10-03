import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, children, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-6 w-6 text-xs',
      md: 'h-8 w-8 text-xs',
      lg: 'h-10 w-10 text-sm',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-blue-500 font-medium text-white',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
