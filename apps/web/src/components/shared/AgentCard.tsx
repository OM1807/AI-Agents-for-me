'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useProject } from '@/hooks/useProject';

interface AgentCardProps {
  icon: React.ReactNode;
  heading: string;
  description: string;
  navigateTo?: string;
  className?: string;
  badgeStatus?: 'COMING SOON' | 'BETA';
  agentType?: string;
}

export function AgentCard({
  icon,
  heading,
  description,
  navigateTo,
  className,
  badgeStatus,
  agentType,
}: AgentCardProps) {
  const { setAgentType, resetProject } = useProject();
  const router = useRouter();

  const isDisabled = !navigateTo || badgeStatus === 'COMING SOON';

  const handleCardClick = () => {
    if (!isDisabled) {
      resetProject();
      setAgentType(agentType || '');
      router.push(navigateTo);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative rounded-xl bg-white shadow-sm dark:bg-gray-900',
        'p-4 transition-all duration-300 ease-in-out',
        !isDisabled &&
          'transform cursor-pointer hover:-translate-y-1 hover:shadow-xl',
        isDisabled && 'cursor-not-allowed',
        className
      )}
      style={{
        border: '2px solid transparent',
        borderRadius: '0.75rem',
        backgroundImage: `linear-gradient(white, white), linear-gradient(140.56deg, rgba(223, 223, 223, 0.5) 3.32%, rgba(74, 32, 245, 0.2) 54.25%, rgba(223, 223, 223, 0.5) 98.76%)`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      {/* Icon with Badge */}
      <div className='mb-4 flex items-center justify-between'>
        {icon}
        {badgeStatus && (
          <Badge
            variant='outline'
            className={cn(
              'transition-all duration-300 ease-out',
              badgeStatus === 'COMING SOON' &&
                'border-[#22A0F41A] bg-[#22A0F41A] text-[#22A0F4]',
              badgeStatus === 'BETA' &&
                'border-[#F7A9864D] bg-[#F7A9864D] text-[#FD6E5E]'
            )}
          >
            {badgeStatus}
          </Badge>
        )}
      </div>

      {/* Heading */}
      <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {heading}
      </h3>

      {/* Description */}
      <p className='text-xs leading-relaxed text-gray-600 dark:text-gray-400'>
        {description}
      </p>

      {/* Hover gradient overlay - only show when not disabled */}
      {!isDisabled && (
        <div
          className={cn(
            'absolute inset-0 rounded-xl bg-gradient-to-t from-purple-600/5 to-transparent',
            'pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100'
          )}
        />
      )}
    </div>
  );
}

export default AgentCard;
