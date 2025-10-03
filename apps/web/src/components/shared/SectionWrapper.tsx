import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SectionWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
}

const SectionWrapper = React.forwardRef<HTMLDivElement, SectionWrapperProps>(
  ({ className, icon, title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-4 rounded-lg border border-gray-200 bg-white p-4',
          className
        )}
        {...props}
      >
        <div className='flex items-center gap-2'>
          <div className='rounded-full border border-gray-200 p-2'>{icon}</div>
          <div className='flex-1'>
            <h3 className='font-semibold'>{title}</h3>
          </div>
        </div>
        <div className='space-y-4'>
          <div className='space-y-3'>{children}</div>
        </div>
      </div>
    );
  }
);
SectionWrapper.displayName = 'SectionWrapper';

export default SectionWrapper;
