import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className='relative flex items-center justify-center'>
        <input
          type='checkbox'
          className={cn(
            'peer ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 rounded border border-gray-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            'bg-background appearance-none transition-all checked:border-[#11054c] checked:bg-[#11054c]',
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        <Check
          className='pointer-events-none absolute top-0.5 left-0.5 h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100'
          strokeWidth={3}
        />
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
