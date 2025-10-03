import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      checked,
      onCheckedChange,
      defaultChecked = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] =
      React.useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    const handleClick = () => {
      if (disabled) return;

      const newChecked = !isChecked;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
    };

    return (
      <button
        type='button'
        role='switch'
        aria-checked={isChecked}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out',
          'focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none',
          isChecked ? 'bg-purple-600' : 'bg-gray-200',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out',
            isChecked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
          )}
        />
      </button>
    );
  }
);
Toggle.displayName = 'Toggle';

export { Toggle };
