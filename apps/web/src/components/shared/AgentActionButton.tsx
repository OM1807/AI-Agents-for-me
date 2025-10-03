import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useHeader } from '@/hooks/useHeader';
import { useProject } from '@/hooks/useProject';
import { cn } from '@/lib/utils';

interface AgentActionButtonProps {
  /**
   * The text to display on the button
   */
  buttonText: string;

  /**
   * The title to set when navigating
   */
  title: string;

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Agent action button that navigates to chat page and sets the title
 */
export function AgentActionButton({
  buttonText,
  title,
  disabled = false,
  className,
}: AgentActionButtonProps) {
  const router = useRouter();
  const { setTitle } = useHeader();
  const { projectName } = useProject();

  const handleClick = () => {
    // Set the title
    setTitle(`${title} - ${projectName}`);

    // Navigate to chat page
    router.push('/chat');
  };

  return (
    <Button
      variant='default'
      className={cn(
        'w-1/4 cursor-pointer bg-[#11054c] text-lg font-semibold text-white hover:bg-[#11054c]/90',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      size='lg'
    >
      {buttonText}
    </Button>
  );
}
