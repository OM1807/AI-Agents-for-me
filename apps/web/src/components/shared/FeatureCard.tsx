import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  heading: string;
  subheading: string;
  buttonIcon?: React.ReactNode;
  buttonText: string;
  buttonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  buttonClassName?: string;
  onButtonClick?: () => void;
  className?: string;
  containerClassName?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  heading,
  subheading,
  buttonIcon,
  buttonText,
  buttonVariant = 'default',
  buttonClassName,
  onButtonClick,
  className,
  containerClassName,
}) => {
  return (
    <div className={cn('w-full', containerClassName)}>
      <div
        className={cn(
          'animate-in fade-in slide-in-from-bottom-4 bg-card w-full space-y-4 rounded-xl border border-dashed p-4 text-center duration-500',
          className
        )}
      >
        {/* Icon */}
        <div className='flex justify-center'>
          <div className='flex h-20 w-20 items-center justify-center rounded-2xl'>
            {icon}
          </div>
        </div>

        {/* Heading */}
        <h1 className='text-foreground text-2xl font-bold tracking-tight'>
          {heading}
        </h1>

        {/* Subheading */}
        <p className='text-muted-foreground font-outfit mx-auto text-sm whitespace-nowrap'>
          {subheading}
        </p>

        {/* Button */}
        <Button
          variant={buttonVariant}
          size='lg'
          onClick={onButtonClick}
          className={cn(
            'min-w-[200px]',
            buttonVariant === 'default' && 'bg-[#11054c] hover:bg-[#11054c]/90',
            buttonClassName
          )}
        >
          {buttonIcon && <span className='mr-2'>{buttonIcon}</span>}
          {buttonText}
        </Button>
      </div>
    </div>
  );
};
