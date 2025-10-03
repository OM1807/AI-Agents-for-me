'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  value: string[];
  onValueChange: (value: string[]) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(
  undefined
);

interface AccordionProps {
  children: React.ReactNode;
  value?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
  type?: 'single' | 'multiple';
  defaultValue?: string[];
}

export function Accordion({
  children,
  value: controlledValue,
  onValueChange,
  className,
  type = 'single',
  defaultValue = [],
}: AccordionProps) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState<string[]>(defaultValue);
  const value = controlledValue ?? uncontrolledValue;

  const handleValueChange = React.useCallback(
    (itemValue: string) => {
      const newValue =
        type === 'single'
          ? value.includes(itemValue)
            ? []
            : [itemValue]
          : value.includes(itemValue)
            ? value.filter(v => v !== itemValue)
            : [...value, itemValue];

      if (onValueChange) {
        onValueChange(newValue);
      } else {
        setUncontrolledValue(newValue);
      }
    },
    [value, onValueChange, type]
  );

  return (
    <AccordionContext.Provider
      value={{ value, onValueChange: v => handleValueChange(v[0]) }}
    >
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function AccordionItem({
  children,
  value,
  className,
}: AccordionItemProps) {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionItem must be used within an Accordion');
  }

  const isExpanded = context.value.includes(value);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border transition-all duration-200',
        isExpanded ? 'border-blue-400 shadow-md' : 'border-gray-200',
        'bg-white',
        className
      )}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isExpanded,
            value,
          });
        }
        return child;
      })}
    </div>
  );
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  isExpanded?: boolean;
  value?: string;
}

export function AccordionTrigger({
  children,
  className,
  isExpanded = false,
  value = '',
}: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);

  const handleClick = () => {
    if (context && value) {
      context.onValueChange([value]);
    }
  };

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'flex w-full cursor-pointer items-center px-4 py-3 transition-colors hover:bg-gray-50',
        className
      )}
    >
      <span className='flex flex-1 items-center gap-2'>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
        {children}
      </span>
    </div>
  );
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
  isExpanded?: boolean;
}

export function AccordionContent({
  children,
  className,
  isExpanded = false,
}: AccordionContentProps) {
  if (!isExpanded) return null;

  return (
    <div className={cn('border-t border-gray-200', className)}>
      <div className='overflow-y-auto bg-white'>{children}</div>
    </div>
  );
}
